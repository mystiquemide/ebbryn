import { checkPlan } from "@/lib/check";
import { InputError, parsePlanInputs, WINDOW_DAYS, type PlanInputs } from "@/lib/input";
import { IxsError, listVaults } from "@/lib/ixs";
import type { CheckResult, Plan, VaultInfo } from "@/lib/plan";
import { cacheGet, cacheSet, takePlanSlot } from "@/lib/ratelimit";
import { expandSchedule } from "@/lib/schedule";
import { requestPlan, ServError, type ServMeta } from "@/lib/serv";
import { canonical, signPayload } from "@/lib/sign";

export const maxDuration = 300;

export type PlanResponse = {
  inputs: PlanInputs;
  plan: Plan;
  check: CheckResult;
  attempts: number;
  meta: ServMeta;
  signature: string | null;
  vaults: VaultInfo[];
};

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: Request) {
  let inputs: PlanInputs;
  try {
    inputs = parsePlanInputs(await req.json(), new Date().toISOString().slice(0, 10));
  } catch (e) {
    const message = e instanceof InputError ? e.message : "Body must be valid JSON";
    return Response.json({ error: message }, { status: 400 });
  }

  const cacheKey = canonical(inputs);
  const cached = cacheGet<PlanResponse>(cacheKey);
  if (cached) return Response.json({ ...cached, cached: true });

  const slot = takePlanSlot(clientIp(req));
  if (!slot.ok) {
    return Response.json(
      { error: "Planning is paused for a few minutes to protect shared credits.", reason: slot.reason, retryAfterSec: slot.retryAfterSec },
      { status: 429, headers: { "retry-after": String(slot.retryAfterSec) } },
    );
  }

  try {
    const vaults = await listVaults();
    const occurrences = expandSchedule(inputs.payouts, inputs.today, WINDOW_DAYS);
    const request = { ...inputs, occurrences, vaults };
    const run = (plan: Plan) => checkPlan({ plan, ...inputs, occurrences, vaults });

    let { plan, meta } = await requestPlan(request);
    let check = run(plan);
    let attempts = 1;
    if (!check.ok) {
      const retry = await requestPlan(request, check.failures);
      plan = retry.plan;
      meta = retry.meta;
      check = run(plan);
      attempts = 2;
    }

    const body: PlanResponse = {
      inputs,
      plan,
      check,
      attempts,
      meta,
      signature: check.ok ? signPayload({ inputs, plan }) : null,
      vaults,
    };
    cacheSet(cacheKey, body);
    return Response.json(body);
  } catch (e) {
    if (e instanceof IxsError) return Response.json({ error: `IXS: ${e.message}` }, { status: 502 });
    if (e instanceof ServError) return Response.json({ error: `SERV: ${e.message}` }, { status: 502 });
    console.error(e);
    return Response.json({ error: "Planning failed. Nothing was changed." }, { status: 500 });
  }
}

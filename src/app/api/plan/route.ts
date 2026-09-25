import { checkPlan } from "@/lib/check";
import { InputError, parsePlanInputs, WINDOW_DAYS, type PlanInputs } from "@/lib/input";
import { IxsError, listVaults } from "@/lib/ixs";
import type { CheckResult, Plan, VaultInfo } from "@/lib/plan";
import { cacheGet, cacheSet, takeSharedPlanSlot } from "@/lib/ratelimit";
import { expandSchedule } from "@/lib/schedule";
import { requestPlanHedged, ServError, type ServMeta } from "@/lib/serv";
import { canonical, signPayload } from "@/lib/sign";
import { beacon, reviewId } from "@/server/beacon";

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
    const message = e instanceof InputError ? e.message : "Something in the form didn't come through. Refresh the page and try again.";
    return Response.json({ error: message }, { status: 400 });
  }

  const cacheKey = canonical(inputs);
  const cached = cacheGet<PlanResponse>(cacheKey);
  if (cached) return Response.json({ ...cached, cached: true });

  const slot = await takeSharedPlanSlot(clientIp(req));
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

    const started = Date.now();
    let { plan, meta } = await requestPlanHedged(request);
    let check = run(plan);
    let attempts = 1;
    // Retry once with the failures, but only if there's time left inside the function limit.
    if (!check.ok && Date.now() - started < 120_000) {
      const retry = await requestPlanHedged(request, check.failures);
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
    const rid = reviewId(req.headers.get("cookie"));
    if (rid) await beacon(`Ebbryn review ${rid}: plan ${check.ok ? `passed ${check.passed.length}/8` : `rejected (${check.failures.map((f) => f.code).join(", ")})`}, SERV ${meta.requestId?.slice(0, 8) ?? "?"}`);
    return Response.json(body);
  } catch (e) {
    // Details stay in server logs. Users get what happened and what to do.
    console.error(e);
    const rid = reviewId(req.headers.get("cookie"));
    if (rid) await beacon(`Ebbryn review ${rid}: plan failed (${e instanceof Error ? e.message.slice(0, 80) : "unknown error"})`);
    if (e instanceof IxsError) {
      return Response.json({ error: "IXS didn't answer in time, so Ebbryn couldn't check the vaults. Nothing was changed. Try again in a minute." }, { status: 502 });
    }
    if (e instanceof ServError && /credit/.test(e.message)) {
      return Response.json({ error: "Planning is paused while Ebbryn's SERV credits are topped up. Nothing was changed. Try again later." }, { status: 503 });
    }
    if (e instanceof ServError) {
      return Response.json({ error: "SERV couldn't finish this plan. Nothing was changed. Try again in a minute." }, { status: 502 });
    }
    return Response.json({ error: "This plan didn't finish. Nothing was changed. Try again." }, { status: 500 });
  }
}

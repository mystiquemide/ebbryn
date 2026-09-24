import { isAddress } from "viem";
import { checkPlan } from "@/lib/check";
import { WINDOW_DAYS, type PlanInputs } from "@/lib/input";
import { buildDeposit, IxsError, listVaults, type McpStep } from "@/lib/ixs";
import type { Plan } from "@/lib/plan";
import { daysBetween, expandSchedule } from "@/lib/schedule";
import { verifyPayload } from "@/lib/sign";
import { toBaseUnits } from "@/lib/units";

export type Move = {
  vaultId: string;
  vaultName: string;
  network: string;
  chainId: number;
  explorerUrl: string;
  vaultAddress: `0x${string}`;
  asset: `0x${string}`;
  decimals: number;
  amount: number;
  baseUnits: string;
  steps: McpStep[];
};

const bad = (status: number, error: string, extra: object = {}) => Response.json({ error, ...extra }, { status });

// Only returns steps for a plan this server signed, re-checked against live vault state.
export async function POST(req: Request) {
  let body: { inputs?: PlanInputs; plan?: Plan; signature?: string; owner?: string };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Something didn't come through. Refresh the page and try again.");
  }
  const { inputs, plan, signature, owner } = body;
  if (!inputs || !plan || typeof signature !== "string") return bad(400, "There's no checked plan to sign. Make a plan first.");
  if (typeof owner !== "string" || !isAddress(owner)) return bad(400, "Connect a wallet so IXS can prepare the transactions for it.");

  try {
    if (!verifyPayload({ inputs, plan }, signature)) return bad(400, "This plan was changed after Ebbryn checked it, so it can't be used. Make a new plan.");
  } catch {
    return bad(400, "This plan was changed after Ebbryn checked it, so it can't be used. Make a new plan.");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (daysBetween(inputs.today, today) > 1) return bad(409, "This plan is more than a day old. Make a new plan before signing.");

  try {
    const vaults = await listVaults();
    const occurrences = expandSchedule(inputs.payouts, inputs.today, WINDOW_DAYS);
    const check = checkPlan({ plan, ...inputs, occurrences, vaults });
    if (!check.ok) return bad(409, "Something changed since you planned, like a vault closing, so this plan no longer passes. Make a new plan.", { failures: check.failures });

    const moves: Move[] = [];
    for (const p of plan.parked) {
      if (p.amount <= 0) continue;
      const v = vaults.find((x) => x.id === p.vaultId)!;
      const baseUnits = toBaseUnits(p.amount, v.decimals);
      const steps = await buildDeposit(v.id, owner, baseUnits);
      const allowed = new Set([v.address.toLowerCase(), v.asset.toLowerCase()]);
      if (steps.some((s) => !allowed.has(s.tx.to.toLowerCase()))) {
        return bad(502, `IXS sent a transaction for a contract Ebbryn doesn't expect on ${v.name}, so Ebbryn blocked it. Nothing to sign. Try again later.`);
      }
      moves.push({
        vaultId: v.id,
        vaultName: v.name,
        network: v.network,
        chainId: v.chainId,
        explorerUrl: v.explorerUrl,
        vaultAddress: v.address,
        asset: v.asset,
        decimals: v.decimals,
        amount: p.amount,
        baseUnits,
        steps,
      });
    }
    return Response.json({ moves });
  } catch (e) {
    console.error(e);
    if (e instanceof IxsError) return bad(502, "IXS couldn't prepare your transactions. Nothing was changed. Try again in a minute.");
    return bad(500, "IXS couldn't prepare your transactions. Nothing was changed. Try again in a minute.");
  }
}

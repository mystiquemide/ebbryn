import { CHECK_CODES, type CheckFailure, type CheckResult, type Limits, type Plan, type VaultInfo } from "./plan";
import { addDays, dailySpend, type Occurrence, type Payout } from "./schedule";
import { formatUsdc, round2 } from "./units";

export type CheckInput = {
  plan: Plan;
  balance: number;
  today: string;
  payouts: Payout[];
  occurrences: Occurrence[];
  vaults: VaultInfo[];
  limits: Limits;
};

const EPS = 0.01;

const day = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : iso;

function expandRefs(refs: string[], occurrences: Occurrence[]): { ids: string[]; unknown: string[] } {
  const ids: string[] = [];
  const unknown: string[] = [];
  for (const ref of refs) {
    if (ref.endsWith("@*")) {
      const payoutId = ref.slice(0, -2);
      const hits = occurrences.filter((o) => o.payoutId === payoutId);
      if (hits.length === 0) unknown.push(ref);
      ids.push(...hits.map((o) => o.id));
    } else if (occurrences.some((o) => o.id === ref)) {
      ids.push(ref);
    } else {
      unknown.push(ref);
    }
  }
  return { ids, unknown };
}

function sumOf(ids: string[], byId: Map<string, Occurrence>): number {
  return ids.reduce((s, id) => s + (byId.get(id)?.amount ?? 0), 0);
}

// Code is the safety layer: every plan from the model goes through these checks before anything can be signed.
export function checkPlan(input: CheckInput): CheckResult {
  const { plan, balance, today, payouts, occurrences, vaults, limits } = input;
  const failures: CheckFailure[] = [];
  const fail = (code: CheckFailure["code"], detail: string) => failures.push({ code, detail });
  const byId = new Map(occurrences.map((o) => [o.id, o]));
  const vaultById = new Map(vaults.map((v) => [v.id, v]));
  const totalParked = plan.parked.reduce((s, p) => s + p.amount, 0);

  // SUM
  const total = plan.liquid + totalParked;
  if (Math.abs(total - balance) > EPS) {
    fail("SUM", `Ready ${formatUsdc(plan.liquid)} plus parked ${formatUsdc(totalParked)} makes ${formatUsdc(total)}, but you hold ${formatUsdc(balance)}.`);
  }
  if (plan.liquid < 0 || plan.parked.some((p) => p.amount < 0) || plan.redemptions.some((r) => r.amount < 0)) {
    fail("SUM", "The plan has a negative amount, which isn't possible.");
  }

  // CAP
  const cap = round2((balance * limits.maxParkedPct) / 100);
  if (totalParked > cap + EPS) {
    fail("CAP", `Parked ${formatUsdc(totalParked)} is over your ${limits.maxParkedPct}% limit of ${formatUsdc(cap)}.`);
  }

  // CLOSED
  for (const p of plan.parked) {
    const v = vaultById.get(p.vaultId);
    if (!v) fail("CLOSED", "The plan parks money in a vault IXS doesn't list.");
    else if (p.amount > 0 && !v.acceptsDeposits) fail("CLOSED", `${v.name} isn't taking deposits right now.`);
  }

  // COVER_ONCE
  const liquidRefs = expandRefs(plan.liquidFunds, occurrences);
  const count = new Map<string, number>();
  for (const id of liquidRefs.ids) count.set(id, (count.get(id) ?? 0) + 1);
  const unknownRefs = [...liquidRefs.unknown];
  const redemptionIds = plan.redemptions.map((r) => {
    const refs = expandRefs(r.funds, occurrences);
    unknownRefs.push(...refs.unknown);
    for (const id of refs.ids) count.set(id, (count.get(id) ?? 0) + 1);
    return refs.ids;
  });
  for (const ref of unknownRefs) {
    const when = ref.split("@")[1];
    fail("COVER_ONCE", `The plan pays for something that isn't on your schedule${when && when !== "*" ? ` (${day(when)})` : ""}.`);
  }
  const doubled = occurrences.filter((o) => (count.get(o.id) ?? 0) > 1);
  const missing = occurrences.filter((o) => !count.has(o.id));
  for (const o of doubled) {
    fail("COVER_ONCE", `${o.label} on ${day(o.date)} (${formatUsdc(o.amount)}) is funded ${count.get(o.id)} times.`);
  }
  if (missing.length > 0) {
    const amount = missing.reduce((s, o) => s + o.amount, 0);
    const first = missing[0];
    fail(
      "COVER_ONCE",
      `${missing.length === 1 ? "1 payout" : `${missing.length} payouts`} totalling ${formatUsdc(amount)} ${missing.length === 1 ? "is" : "are"} not funded, starting with ${first.label} on ${day(first.date)}.`,
    );
  }
  plan.redemptions.forEach((r, i) => {
    const needed = sumOf(redemptionIds[i], byId);
    if (r.amount + EPS < needed) {
      fail("COVER_ONCE", `The ${day(r.requestDate)} withdrawal of ${formatUsdc(r.amount)} is less than the ${formatUsdc(needed)} it has to cover.`);
    }
  });

  // LIQUID_COVER
  const liquidNeeded = sumOf(liquidRefs.ids, byId) + dailySpend(payouts) * limits.minLiquidDays;
  if (plan.liquid + EPS < liquidNeeded) {
    fail("LIQUID_COVER", `Ready cash of ${formatUsdc(plan.liquid)} is short of the ${formatUsdc(liquidNeeded)} needed for its payouts and your ${limits.minLiquidDays}-day buffer.`);
  }

  // TIMING
  plan.redemptions.forEach((r, i) => {
    const v = vaultById.get(r.vaultId);
    const lag = v?.lagDays ?? 0;
    if (r.requestDate < today) fail("TIMING", `The withdrawal on ${day(r.requestDate)} is already in the past.`);
    const dates = redemptionIds[i].map((id) => byId.get(id)!.date).sort();
    if (dates.length === 0) return;
    const lands = addDays(r.requestDate, lag);
    const deadline = addDays(dates[0], -1);
    if (lands > deadline) {
      fail("TIMING", `The ${day(r.requestDate)} withdrawal arrives ${day(lands)}, too late for the ${day(dates[0])} payout.`);
    }
  });

  // REDEEM_LE_PARKED
  const parkedByVault = new Map<string, number>();
  for (const p of plan.parked) parkedByVault.set(p.vaultId, (parkedByVault.get(p.vaultId) ?? 0) + p.amount);
  const redeemedByVault = new Map<string, number>();
  for (const r of plan.redemptions) redeemedByVault.set(r.vaultId, (redeemedByVault.get(r.vaultId) ?? 0) + r.amount);
  for (const [vaultId, redeemed] of redeemedByVault) {
    const parked = parkedByVault.get(vaultId) ?? 0;
    if (redeemed > parked + EPS) {
      fail("REDEEM_LE_PARKED", `The plan withdraws ${formatUsdc(redeemed)} from ${vaultById.get(vaultId)?.name ?? "a vault"}, but only ${formatUsdc(parked)} is parked there.`);
    }
  }

  // SHORTFALL
  const due = occurrences.reduce((s, o) => s + o.amount, 0);
  if (due > balance + EPS) {
    const short = occurrences.reduce(
      (acc, o) => {
        if (acc.found) return acc;
        const running = acc.running + o.amount;
        return running > balance + EPS ? { running, found: o } : { running, found: null as Occurrence | null };
      },
      { running: 0, found: null as Occurrence | null },
    );
    const where = short.found ? `${short.found.label} on ${day(short.found.date)}` : "the next 30 days";
    fail("SHORTFALL", `Your payouts need ${formatUsdc(due - balance)} more than you hold, starting with ${where}. Ebbryn won't park anything.`);
  }

  const failed = new Set(failures.map((f) => f.code));
  return { ok: failures.length === 0, passed: CHECK_CODES.filter((c) => !failed.has(c)), failures };
}

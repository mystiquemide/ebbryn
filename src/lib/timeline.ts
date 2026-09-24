import type { Plan, VaultInfo } from "./plan";
import { addDays, type Occurrence } from "./schedule";

export type Day = {
  date: string;
  ready: number; // in the wallet at end of day
  parked: number; // still in vaults at end of day
  paid: Occurrence[]; // payouts that went out that day
  withdrawnRequested: number; // redemption requests made that day
  withdrawnLanded: number; // redemptions that reached the wallet that day
};

// Day-by-day balances implied by a plan. Pure arithmetic on the plan and the schedule, nothing estimated.
export function buildTimeline(plan: Plan, occurrences: Occurrence[], vaults: VaultInfo[], today: string, windowDays: number): Day[] {
  const lag = new Map(vaults.map((v) => [v.id, v.lagDays]));
  let ready = plan.liquid;
  let parked = plan.parked.reduce((s, p) => s + p.amount, 0);
  const days: Day[] = [];

  for (let i = 0; i < windowDays; i++) {
    const date = addDays(today, i);
    const requested = plan.redemptions.filter((r) => r.requestDate === date).reduce((s, r) => s + r.amount, 0);
    const landed = plan.redemptions
      .filter((r) => addDays(r.requestDate, lag.get(r.vaultId) ?? 0) === date)
      .reduce((s, r) => s + r.amount, 0);
    parked -= landed;
    ready += landed;
    const paid = occurrences.filter((o) => o.date === date);
    ready -= paid.reduce((s, o) => s + o.amount, 0);
    days.push({ date, ready, parked, paid, withdrawnRequested: requested, withdrawnLanded: landed });
  }
  return days;
}

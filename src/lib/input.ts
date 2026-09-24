import type { Limits } from "./plan";
import type { Payout, Repeat } from "./schedule";

export type PlanInputs = {
  balance: number;
  today: string;
  payouts: Payout[];
  rules: string;
  limits: Limits;
};

export const WINDOW_DAYS = 30;
const REPEATS: Repeat[] = ["none", "daily", "semimonthly"];

export class InputError extends Error {}

function num(v: unknown, min: number, max: number, message: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new InputError(message);
  return Math.round(v * 100) / 100;
}

export function parsePlanInputs(body: unknown, today: string): PlanInputs {
  if (!body || typeof body !== "object") throw new InputError("Something in the form didn't come through. Refresh the page and try again.");
  const b = body as Record<string, unknown>;
  const balance = num(b.balance, 0, 1_000_000_000, "Enter the USDC you hold, as a number.");
  if (!Array.isArray(b.payouts) || b.payouts.length === 0) throw new InputError("Add at least one payout to plan around.");
  if (b.payouts.length > 20) throw new InputError("Ebbryn plans up to 20 payouts at a time. Remove a few and try again.");
  const ids = new Map<string, number>();
  const payouts = b.payouts.map((raw, i): Payout => {
    const n = i + 1;
    const p = (raw ?? {}) as Record<string, unknown>;
    const label = typeof p.label === "string" ? p.label.trim().slice(0, 60) : "";
    if (!label) throw new InputError(`Give payout ${n} a name.`);
    const id = typeof p.id === "string" && /^[a-z0-9-]{1,24}$/.test(p.id) ? p.id : null;
    if (!id) throw new InputError(`Rename payout ${n} using letters and numbers.`);
    const clash = ids.get(id);
    if (clash) throw new InputError(`Payouts ${clash} and ${n} have the same name. Rename one so Ebbryn can tell them apart.`);
    ids.set(id, n);
    const amount = num(p.amount, 0.01, 1_000_000_000, `Enter an amount above 0 for payout ${n}.`);
    const date = typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : null;
    if (!date) throw new InputError(`Pick a first date for payout ${n}.`);
    const repeat = REPEATS.includes(p.repeat as Repeat) ? (p.repeat as Repeat) : null;
    if (!repeat) throw new InputError(`Choose how often payout ${n} repeats.`);
    return { id, label, amount, date, repeat };
  });
  const rules = typeof b.rules === "string" ? b.rules.slice(0, 1200) : "";
  const l = (b.limits ?? {}) as Record<string, unknown>;
  const limits: Limits = {
    maxParkedPct: num(l.maxParkedPct, 0, 100, `"Park at most" needs a number from 0 to 100.`),
    minLiquidDays: num(l.minLiquidDays, 0, 30, `"Extra days kept ready" needs a number from 0 to 30.`),
  };
  return { balance, today, payouts, rules, limits };
}

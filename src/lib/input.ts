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

function num(v: unknown, name: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
    throw new InputError(`${name} must be a number between ${min} and ${max}`);
  }
  return Math.round(v * 100) / 100;
}

// Validates everything that reaches SERV or the checks. The server sets today, never the client.
export function parsePlanInputs(body: unknown, today: string): PlanInputs {
  if (!body || typeof body !== "object") throw new InputError("Body must be a JSON object");
  const b = body as Record<string, unknown>;
  const balance = num(b.balance, "balance", 0, 1_000_000_000);
  if (!Array.isArray(b.payouts) || b.payouts.length === 0 || b.payouts.length > 20) {
    throw new InputError("payouts must list 1 to 20 payouts");
  }
  const ids = new Set<string>();
  const payouts = b.payouts.map((raw, i): Payout => {
    const p = (raw ?? {}) as Record<string, unknown>;
    const id = typeof p.id === "string" && /^[a-z0-9-]{1,24}$/.test(p.id) ? p.id : null;
    if (!id || ids.has(id)) throw new InputError(`payouts[${i}].id must be unique, lowercase letters, numbers or dashes`);
    ids.add(id);
    const label = typeof p.label === "string" ? p.label.trim().slice(0, 60) : "";
    if (!label) throw new InputError(`payouts[${i}].label is required`);
    const date = typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : null;
    if (!date) throw new InputError(`payouts[${i}].date must be YYYY-MM-DD`);
    const repeat = REPEATS.includes(p.repeat as Repeat) ? (p.repeat as Repeat) : null;
    if (!repeat) throw new InputError(`payouts[${i}].repeat must be one of ${REPEATS.join(", ")}`);
    return { id, label, amount: num(p.amount, `payouts[${i}].amount`, 0.01, 1_000_000_000), date, repeat };
  });
  const rules = typeof b.rules === "string" ? b.rules.slice(0, 1200) : "";
  const l = (b.limits ?? {}) as Record<string, unknown>;
  const limits: Limits = {
    maxParkedPct: num(l.maxParkedPct, "limits.maxParkedPct", 0, 100),
    minLiquidDays: num(l.minLiquidDays, "limits.minLiquidDays", 0, 30),
  };
  return { balance, today, payouts, rules, limits };
}

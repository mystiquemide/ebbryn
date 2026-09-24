import type { Limits } from "./plan";
import type { Payout } from "./schedule";

export type SetupState = {
  balance: string;
  payouts: (Omit<Payout, "amount"> & { amount: string })[];
  rules: string;
  limits: { maxParkedPct: string; minLiquidDays: string };
};

export const STORAGE_KEY = "ebbryn.setup.v1";

export const DEFAULT_RULES =
  "Never be short for payroll. Keep 3 days of agent spend ready. Park the rest, but keep at least half the balance ready.";

export const DEFAULT_LIMITS: Limits = { maxParkedPct: 60, minLiquidDays: 3 };

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Next 1st or 15th on or after today, so a semimonthly template always starts in the future.
export function nextPayday(today: string): string {
  const d = new Date(`${today}T00:00:00Z`);
  const day = d.getUTCDate();
  if (day <= 1) return today;
  if (day <= 15) return `${today.slice(0, 8)}15`;
  const n = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return n.toISOString().slice(0, 10);
}

const limits = (l: Limits) => ({ maxParkedPct: String(l.maxParkedPct), minLiquidDays: String(l.minLiquidDays) });

// Starting inputs the visitor edits. Labelled as a template in the UI, never presented as their data.
export function template(kind: "payroll" | "fleet" | "blank", today: string): SetupState {
  if (kind === "payroll") {
    return {
      balance: "128,400",
      payouts: [
        { id: "payroll", label: "Contractor payroll", amount: "42,000", date: nextPayday(today), repeat: "semimonthly" },
        { id: "agents", label: "Agent fleet top-up", amount: "1,200", date: today, repeat: "daily" },
      ],
      rules: DEFAULT_RULES,
      limits: limits(DEFAULT_LIMITS),
    };
  }
  if (kind === "fleet") {
    return {
      balance: "60,000",
      payouts: [
        { id: "fleet", label: "Agent fleet top-up", amount: "900", date: today, repeat: "daily" },
        { id: "infra", label: "Hosting and API bill", amount: "6,500", date: addDays(today, 14), repeat: "none" },
      ],
      rules: "Keep 5 days of agent spend ready at all times. Park the rest.",
      limits: { maxParkedPct: "70", minLiquidDays: "5" },
    };
  }
  return { balance: "", payouts: [], rules: "", limits: limits(DEFAULT_LIMITS) };
}

export function slug(label: string, taken: Set<string>): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 18) || "payout";
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

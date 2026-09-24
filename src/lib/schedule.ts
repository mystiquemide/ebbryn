export type Repeat = "none" | "daily" | "semimonthly";

export type Payout = {
  id: string;
  label: string;
  amount: number;
  date: string; // YYYY-MM-DD, first occurrence
  repeat: Repeat;
};

export type Occurrence = {
  id: string; // `${payoutId}@${date}`, what a plan must fund exactly once
  payoutId: string;
  label: string;
  amount: number;
  date: string;
};

const DAY_MS = 86_400_000;

export function parseDay(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date: ${date}`);
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`Invalid date: ${date}`);
  return ms;
}

export function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDay(parseDay(date) + days * DAY_MS);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS);
}

// Expands payouts into dated occurrences inside [today, today + windowDays).
// Semimonthly means the 1st and the 15th of each month, starting from the payout's first date.
export function expandSchedule(payouts: Payout[], today: string, windowDays = 30): Occurrence[] {
  const start = parseDay(today);
  const end = start + windowDays * DAY_MS;
  const out: Occurrence[] = [];

  for (const p of payouts) {
    const first = Math.max(parseDay(p.date), start);
    for (let t = first; t < end; t += DAY_MS) {
      if (t < parseDay(p.date)) continue;
      const day = new Date(t).getUTCDate();
      const hit =
        p.repeat === "daily" ||
        (p.repeat === "none" && t === parseDay(p.date)) ||
        (p.repeat === "semimonthly" && (day === 1 || day === 15));
      if (!hit) continue;
      const date = formatDay(t);
      out.push({ id: `${p.id}@${date}`, payoutId: p.id, label: p.label, amount: p.amount, date });
      if (p.repeat === "none") break;
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

// Average daily spend from daily payouts, used for the extra-liquid-days limit.
export function dailySpend(payouts: Payout[]): number {
  return payouts.filter((p) => p.repeat === "daily").reduce((sum, p) => sum + p.amount, 0);
}

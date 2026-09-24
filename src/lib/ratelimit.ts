// In-memory limits protect the shared SERV credit on the public URL. They reset on redeploy, which is fine for a single instance.
const WINDOW_MS = 10 * 60_000;
const PER_IP = Number(process.env.PLAN_LIMIT_PER_IP ?? 5);
const PER_DAY = Number(process.env.PLAN_LIMIT_PER_DAY ?? 200);

const hits = new Map<string, number[]>();
let day = { key: "", count: 0 };

export type LimitResult = { ok: true } | { ok: false; reason: "ip" | "day"; retryAfterSec: number };

export function takePlanSlot(ip: string, now = Date.now()): LimitResult {
  const today = new Date(now).toISOString().slice(0, 10);
  if (day.key !== today) day = { key: today, count: 0 };
  if (day.count >= PER_DAY) {
    const midnight = Date.parse(`${today}T00:00:00Z`) + 86_400_000;
    return { ok: false, reason: "day", retryAfterSec: Math.ceil((midnight - now) / 1000) };
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_IP) {
    const oldest = recent[0] ?? now;
    return { ok: false, reason: "ip", retryAfterSec: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)) };
  }
  recent.push(now);
  hits.set(ip, recent);
  day.count += 1;
  return { ok: true };
}

const cache = new Map<string, { at: number; value: unknown }>();

export function cacheGet<T>(key: string, now = Date.now()): T | null {
  const hit = cache.get(key);
  if (!hit || now - hit.at > WINDOW_MS) return null;
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, now = Date.now()): void {
  cache.set(key, { at: now, value });
}

export function resetLimits(): void {
  hits.clear();
  cache.clear();
  day = { key: "", count: 0 };
}

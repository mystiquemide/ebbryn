// Limits protect the shared SERV credit on the public URL. With Upstash Redis configured they are shared across
// every server instance and survive redeploys. Without it, each instance falls back to its own in-memory counts.
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

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const sharedLimits = Boolean(REDIS_URL && REDIS_TOKEN);

async function redis(commands: (string | number)[][]): Promise<number[]> {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${REDIS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  const out = (await res.json()) as { result?: number; error?: string }[];
  const failed = out.find((r) => r.error);
  if (failed) throw new Error(failed.error);
  return out.map((r) => Number(r.result));
}

// Fixed windows in Redis: one counter per IP per 10-minute window, one per UTC day.
// A slot is only spent when both counters are under the limit.
export async function takeSharedPlanSlot(ip: string, now = Date.now()): Promise<LimitResult> {
  if (!sharedLimits) return takePlanSlot(ip, now);
  const today = new Date(now).toISOString().slice(0, 10);
  const win = Math.floor(now / WINDOW_MS);
  const ipKey = `ebbryn:rl:ip:${ip}:${win}`;
  const dayKey = `ebbryn:rl:day:${today}`;
  try {
    const [ipCount, , dayCount] = await redis([
      ["INCR", ipKey],
      ["EXPIRE", ipKey, WINDOW_MS / 1000],
      ["INCR", dayKey],
      ["EXPIRE", dayKey, 86_400 * 2],
    ]);
    if (dayCount > PER_DAY) {
      await redis([["DECR", ipKey]]);
      const midnight = Date.parse(`${today}T00:00:00Z`) + 86_400_000;
      return { ok: false, reason: "day", retryAfterSec: Math.ceil((midnight - now) / 1000) };
    }
    if (ipCount > PER_IP) {
      await redis([["DECR", dayKey]]);
      return { ok: false, reason: "ip", retryAfterSec: Math.max(1, Math.ceil(((win + 1) * WINDOW_MS - now) / 1000)) };
    }
    return { ok: true };
  } catch (e) {
    // Redis down should not take planning down with it. Fall back to this instance's counts.
    console.error("rate limit redis failed", e);
    return takePlanSlot(ip, now);
  }
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

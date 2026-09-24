import { createHmac, timingSafeEqual } from "node:crypto";

// Stable JSON: object keys sorted at every level, so the same plan always signs the same way.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function secret(): string {
  const s = process.env.PLAN_SIGNING_SECRET;
  if (!s || s.length < 32) throw new Error("PLAN_SIGNING_SECRET is missing or too short");
  return s;
}

export function signPayload(payload: unknown): string {
  return createHmac("sha256", secret()).update(canonical(payload)).digest("hex");
}

export function verifyPayload(payload: unknown, signature: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(signature)) return false;
  const expected = Buffer.from(signPayload(payload), "hex");
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

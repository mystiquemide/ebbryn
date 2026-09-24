import { beforeEach, describe, expect, it } from "vitest";
import { InputError, parsePlanInputs } from "./input";
import { cacheGet, cacheSet, resetLimits, takePlanSlot, takeSharedPlanSlot } from "./ratelimit";
import { canonical, signPayload, verifyPayload } from "./sign";

process.env.PLAN_SIGNING_SECRET = "x".repeat(64);

describe("plan signing", () => {
  const payload = { inputs: { balance: 100 }, plan: { liquid: 40, parked: [{ vaultId: "v", amount: 60 }] } };

  it("signs key-order independently", () => {
    expect(canonical({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe('{"a":[2,{"c":4,"d":3}],"b":1}');
    expect(signPayload(payload)).toBe(signPayload({ plan: payload.plan, inputs: payload.inputs }));
  });

  it("rejects a tampered plan", () => {
    const sig = signPayload(payload);
    expect(verifyPayload(payload, sig)).toBe(true);
    expect(verifyPayload({ ...payload, plan: { ...payload.plan, liquid: 0 } }, sig)).toBe(false);
    expect(verifyPayload(payload, "not-a-signature")).toBe(false);
  });
});

describe("rate limit", () => {
  beforeEach(() => resetLimits());

  it("allows 5 plans per IP per 10 minutes, then 429", () => {
    const t = Date.parse("2026-09-25T10:00:00Z");
    for (let i = 0; i < 5; i++) expect(takePlanSlot("1.2.3.4", t + i).ok).toBe(true);
    const sixth = takePlanSlot("1.2.3.4", t + 10);
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.retryAfterSec).toBe(600);
    expect(takePlanSlot("5.6.7.8", t + 10).ok).toBe(true);
    expect(takePlanSlot("1.2.3.4", t + 10 * 60_000 + 1).ok).toBe(true);
  });

  it("caches identical inputs for 10 minutes", () => {
    cacheSet("k", { v: 1 }, 0);
    expect(cacheGet("k", 60_000)).toEqual({ v: 1 });
    expect(cacheGet("k", 11 * 60_000)).toBeNull();
  });
});

describe("parsePlanInputs", () => {
  const good = {
    balance: 128400,
    payouts: [{ id: "payroll", label: "Payroll", amount: 42000, date: "2026-10-01", repeat: "semimonthly" }],
    rules: "Never be short.",
    limits: { maxParkedPct: 60, minLiquidDays: 3 },
  };

  it("accepts valid input and sets today from the server", () => {
    expect(parsePlanInputs(good, "2026-09-25").today).toBe("2026-09-25");
  });

  it("rejects bad input", () => {
    expect(() => parsePlanInputs({ ...good, balance: -1 }, "2026-09-25")).toThrow(InputError);
    expect(() => parsePlanInputs({ ...good, limits: { maxParkedPct: 150, minLiquidDays: 3 } }, "2026-09-25")).toThrow(InputError);
    expect(() => parsePlanInputs({ ...good, payouts: [] }, "2026-09-25")).toThrow(InputError);
    expect(() => parsePlanInputs({ ...good, payouts: [{ ...good.payouts[0], repeat: "weekly" }] }, "2026-09-25")).toThrow(InputError);
  });
});

describe("shared rate limit", () => {
  beforeEach(() => resetLimits());

  it("falls back to in-memory limits when Redis isn't configured", async () => {
    const t = Date.parse("2026-09-24T12:00:00Z");
    for (let i = 0; i < 5; i++) expect((await takeSharedPlanSlot("9.9.9.9", t + i)).ok).toBe(true);
    expect((await takeSharedPlanSlot("9.9.9.9", t + 10)).ok).toBe(false);
  });
});

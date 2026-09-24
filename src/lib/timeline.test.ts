import { describe, expect, it } from "vitest";
import real from "@/fixtures/serv-plan-payroll.json";
import type { Plan, VaultInfo } from "./plan";
import { expandSchedule, type Payout } from "./schedule";
import { buildTimeline } from "./timeline";

describe("buildTimeline on the real passing SERV plan", () => {
  const i = real.inputs;
  const occ = expandSchedule(i.payouts as Payout[], i.today, i.windowDays);
  const days = buildTimeline(real.plan as Plan, occ, i.vaults as VaultInfo[], i.today, i.windowDays);

  it("covers the whole window", () => {
    expect(days).toHaveLength(30);
    expect(days[0].date).toBe(i.today);
  });

  it("never lets the wallet go negative", () => {
    expect(Math.min(...days.map((d) => d.ready))).toBeGreaterThanOrEqual(0);
  });

  it("lands the Oct 14 withdrawal on Oct 14 for a sync vault and pays the Oct 15 payroll from it", () => {
    const oct14 = days.find((d) => d.date === "2026-10-14")!;
    expect(oct14.withdrawnLanded).toBe(42000);
    const oct15 = days.find((d) => d.date === "2026-10-15")!;
    expect(oct15.paid.some((o) => o.id === "payroll@2026-10-15")).toBe(true);
  });

  it("conserves money: ready + parked + paid always equals the balance", () => {
    let paid = 0;
    for (const d of days) {
      paid += d.paid.reduce((s, o) => s + o.amount, 0);
      expect(d.ready + d.parked + paid).toBeCloseTo(i.balance, 2);
    }
  });
});

import { describe, expect, it } from "vitest";
import { addDays, dailySpend, daysBetween, expandSchedule, type Payout } from "./schedule";

const payroll: Payout = { id: "payroll", label: "Contractor payroll", amount: 42000, date: "2026-10-01", repeat: "semimonthly" };
const agents: Payout = { id: "agents", label: "Agent fleet top-up", amount: 1200, date: "2026-09-24", repeat: "daily" };
const oneOff: Payout = { id: "audit", label: "Legal fee", amount: 3000, date: "2026-10-05", repeat: "none" };

describe("expandSchedule", () => {
  it("expands semimonthly to the 1st and 15th inside the window", () => {
    const occ = expandSchedule([payroll], "2026-09-24", 30);
    expect(occ.map((o) => o.date)).toEqual(["2026-10-01", "2026-10-15"]);
    expect(occ[0].id).toBe("payroll@2026-10-01");
  });

  it("expands daily from today for the window length", () => {
    expect(expandSchedule([agents], "2026-09-24", 30)).toHaveLength(30);
  });

  it("includes one-off payouts once and drops past ones", () => {
    expect(expandSchedule([oneOff], "2026-09-24", 30)).toHaveLength(1);
    expect(expandSchedule([oneOff], "2026-10-06", 30)).toHaveLength(0);
  });

  it("gives every occurrence a unique id, sorted by date", () => {
    const occ = expandSchedule([payroll, agents, oneOff], "2026-09-24", 30);
    expect(new Set(occ.map((o) => o.id)).size).toBe(occ.length);
    const dates = occ.map((o) => o.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe("date helpers", () => {
  it("adds days and measures gaps across month ends", () => {
    expect(addDays("2026-09-29", 3)).toBe("2026-10-02");
    expect(daysBetween("2026-09-24", "2026-10-01")).toBe(7);
  });

  it("sums daily spend", () => {
    expect(dailySpend([payroll, agents, oneOff])).toBe(1200);
  });
});

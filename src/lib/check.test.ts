import { describe, expect, it } from "vitest";
import recorded from "@/fixtures/serv-double-count.json";
import { checkPlan, type CheckInput } from "./check";
import type { Plan, VaultInfo } from "./plan";
import { expandSchedule, type Payout } from "./schedule";

const vault: VaultInfo = {
  id: "97-0xcb09",
  name: "IXHYB - BSC",
  network: "bsc-testnet",
  chainId: 97,
  address: "0xCb09a5326AEFD705d14FF4C5ca2beD7086ba0Dcc",
  asset: "0xbBCa80a7116aE46B0f249D279EF43f86274dc4f4",
  decimals: 6,
  settlement: "sync",
  lagDays: 0,
  acceptsDeposits: true,
  explorerUrl: "https://testnet.bscscan.com",
};
const closed: VaultInfo = { ...vault, id: "arc", name: "IXHYB - Arc", network: "arc-testnet", settlement: "async-erc7540", lagDays: 2, acceptsDeposits: false };

const payouts: Payout[] = [
  { id: "payroll", label: "Payroll", amount: 42000, date: "2026-10-01", repeat: "semimonthly" },
  { id: "agents", label: "Agent top-up", amount: 1200, date: "2026-09-24", repeat: "daily" },
];
const today = "2026-09-24";
const occurrences = expandSchedule(payouts, today, 30); // payroll Oct 1 + Oct 15, agents x30 = 36,000

const good: Plan = {
  liquid: 81_600,
  liquidFunds: ["payroll@2026-10-01", "agents@*"],
  parked: [{ vaultId: vault.id, amount: 46_800 }],
  redemptions: [{ vaultId: vault.id, amount: 42_000, requestDate: "2026-10-13", funds: ["payroll@2026-10-15"] }],
  reasons: [{ text: "Keep Oct 1 payroll and agent spend liquid.", rule: "Never be short for payroll" }],
};

function input(plan: Plan, over: Partial<CheckInput> = {}): CheckInput {
  return { plan, balance: 128_400, today, payouts, occurrences, vaults: [vault, closed], limits: { maxParkedPct: 60, minLiquidDays: 3 }, ...over };
}
const codes = (plan: Plan, over?: Partial<CheckInput>) => checkPlan(input(plan, over)).failures.map((f) => f.code);

describe("checkPlan", () => {
  it("passes a sound plan with all 8 checks", () => {
    const r = checkPlan(input(good));
    expect(r.failures).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.passed).toHaveLength(8);
  });

  it("SUM: amounts must add up to the balance", () => {
    expect(codes({ ...good, liquid: 70_000 })).toContain("SUM");
  });

  it("CAP: rules text cannot lift the hard limit", () => {
    const greedy: Plan = { ...good, liquid: 28_400, parked: [{ vaultId: vault.id, amount: 100_000 }] };
    expect(codes(greedy)).toContain("CAP");
  });

  it("CLOSED: no deposits into a vault that is not accepting them", () => {
    expect(codes({ ...good, parked: [{ vaultId: "arc", amount: 46_800 }], redemptions: [{ ...good.redemptions[0], vaultId: "arc" }] })).toContain("CLOSED");
  });

  it("COVER_ONCE: the same payroll funded twice is rejected", () => {
    const twice: Plan = { ...good, liquidFunds: ["payroll@*", "agents@*"] };
    const r = checkPlan(input(twice));
    expect(r.ok).toBe(false);
    expect(r.failures.find((f) => f.code === "COVER_ONCE")?.detail).toMatch(/Payroll on Oct 15 .* funded 2 times/);
  });

  it("COVER_ONCE: unfunded payouts and unknown refs are rejected", () => {
    expect(codes({ ...good, liquidFunds: ["agents@*"] })).toContain("COVER_ONCE");
    expect(codes({ ...good, liquidFunds: [...good.liquidFunds, "rent@2026-10-03"] })).toContain("COVER_ONCE");
  });

  it("LIQUID_COVER: liquid must cover what it funds plus extra days", () => {
    const thin: Plan = { ...good, liquid: 60_000, parked: [{ vaultId: vault.id, amount: 68_400 }] };
    expect(codes(thin, { limits: { maxParkedPct: 100, minLiquidDays: 3 } })).toContain("LIQUID_COVER");
  });

  it("TIMING: redemption must land a day before the payout", () => {
    expect(codes(good, { vaults: [{ ...vault, lagDays: 3 }, closed] })).toContain("TIMING");
    expect(codes({ ...good, redemptions: [{ ...good.redemptions[0], requestDate: "2026-09-20" }] })).toContain("TIMING");
  });

  it("REDEEM_LE_PARKED: cannot redeem more than is parked", () => {
    expect(codes({ ...good, redemptions: [{ ...good.redemptions[0], amount: 60_000 }] })).toContain("REDEEM_LE_PARKED");
  });

  it("SHORTFALL: payouts above balance lock the plan", () => {
    expect(codes(good, { balance: 50_000 })).toContain("SHORTFALL");
  });
});

describe("recorded SERV output, Sep 24", () => {
  it("fails COVER_ONCE because it funds the Oct 1 payroll twice", () => {
    const { inputs, plan } = recorded;
    const occ = expandSchedule(inputs.payouts as Payout[], inputs.today, inputs.windowDays);
    const r = checkPlan({
      plan: plan as Plan,
      balance: inputs.balance,
      today: inputs.today,
      payouts: inputs.payouts as Payout[],
      occurrences: occ,
      vaults: inputs.vaults as VaultInfo[],
      limits: inputs.limits,
    });
    expect(r.ok).toBe(false);
    const cover = r.failures.filter((f) => f.code === "COVER_ONCE").map((f) => f.detail);
    expect(cover.some((d) => /Payroll on Oct 1 .* funded 2 times/.test(d))).toBe(true);
    expect(cover.some((d) => /not funded, starting with Agent top-up on Sep 27/.test(d))).toBe(true);
  });
});

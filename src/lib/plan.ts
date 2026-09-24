export type Settlement = "sync" | "queued" | "async-erc7540";

export type VaultInfo = {
  id: string;
  name: string;
  network: string;
  chainId: number;
  address: `0x${string}`;
  asset: `0x${string}`;
  decimals: number;
  settlement: Settlement;
  lagDays: number;
  acceptsDeposits: boolean;
  explorerUrl: string;
};

export type Limits = {
  maxParkedPct: number;
  minLiquidDays: number;
};

// Funding refs are occurrence ids ("payroll@2026-10-01") or "payoutId@*" for every occurrence of that payout.
export type Plan = {
  liquid: number;
  liquidFunds: string[];
  parked: { vaultId: string; amount: number }[];
  redemptions: { vaultId: string; amount: number; requestDate: string; funds: string[] }[];
  reasons: { text: string; rule: string }[];
};

export type CheckCode =
  | "SUM"
  | "CAP"
  | "CLOSED"
  | "COVER_ONCE"
  | "LIQUID_COVER"
  | "TIMING"
  | "REDEEM_LE_PARKED"
  | "SHORTFALL";

export type CheckFailure = { code: CheckCode; detail: string };

export type CheckResult = { ok: boolean; passed: CheckCode[]; failures: CheckFailure[] };

export const CHECK_CODES: CheckCode[] = [
  "SUM",
  "CAP",
  "CLOSED",
  "COVER_ONCE",
  "LIQUID_COVER",
  "TIMING",
  "REDEEM_LE_PARKED",
  "SHORTFALL",
];

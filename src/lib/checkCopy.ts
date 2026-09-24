import type { CheckCode } from "./plan";

export const CHECK_PLAIN: Record<CheckCode, { title: string; meaning: string }> = {
  SUM: { title: "Amounts add up", meaning: "Ready plus parked equals your balance." },
  CAP: { title: "Hard limit respected", meaning: "Nothing parked above your limit." },
  CLOSED: { title: "No closed vaults", meaning: "Only vaults taking deposits right now." },
  COVER_ONCE: { title: "Every payout funded exactly once", meaning: "No payout counted twice or left out." },
  LIQUID_COVER: { title: "Enough cash kept ready", meaning: "Ready cash covers its payouts and your buffer." },
  TIMING: { title: "Money back in time", meaning: "Withdrawals land a day before they're needed." },
  REDEEM_LE_PARKED: { title: "Can't withdraw more than parked", meaning: "Withdrawals never exceed what's in the vault." },
  SHORTFALL: { title: "No shortfall", meaning: "Your balance covers every payout in the window." },
};

import type { VaultInfo } from "./plan";

// Plain-language vault facts for people who don't know ERC-7540.
export function withdrawalCopy(v: Pick<VaultInfo, "settlement" | "lagDays">): string {
  if (v.settlement === "sync") return "Withdraw anytime";
  return `By request, about ${v.lagDays} day${v.lagDays === 1 ? "" : "s"}`;
}

export function depositCopy(v: Pick<VaultInfo, "acceptsDeposits">): string {
  return v.acceptsDeposits ? "Taking deposits" : "Not taking deposits right now";
}

export function networkCopy(network: string): string {
  const name = network.replace(/-testnet$/, "");
  const pretty: Record<string, string> = { bsc: "BSC", arc: "Arc", avalanche: "Avalanche" };
  return `${pretty[name] ?? name} testnet`;
}

// Open vaults first, then closed ones, so the hero leads with somewhere money can actually go.
export function heroVaults(vaults: VaultInfo[], max = 3): VaultInfo[] {
  return [...vaults].sort((a, b) => Number(b.acceptsDeposits) - Number(a.acceptsDeposits)).slice(0, max);
}

export function asOfCopy(iso: string): string {
  const d = new Date(iso);
  const when = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `IXS testnet, as of ${when} UTC`;
}

import type { Settlement, VaultInfo } from "./plan";

const MCP_URL = process.env.IXS_MCP_URL ?? "https://api-dev-v2.ixs.finance/mcp";
// Discovery uses the REST list: MCP vaults_list only returns a subset of vaults.
const API_BASE = MCP_URL.replace(/\/mcp$/, "");
const ASYNC_LAG_DAYS = Number(process.env.IXS_ASYNC_LAG_DAYS ?? 2);
// Address used only to ask IXS whether a vault accepts deposits right now. It never signs anything.
const PROBE_OWNER = "0x000000000000000000000000000000000000dEaD";

export class IxsError extends Error {}

export type McpStep = {
  type: string;
  description: string;
  tx: { to: `0x${string}`; data: `0x${string}`; value?: string; chainId?: number };
};

// IXS MCP replies over Streamable HTTP as SSE. The JSON-RPC result is in the first `data:` frame.
export function parseSse(body: string): unknown {
  const line = body.split("\n").find((l) => l.startsWith("data: "));
  const json = JSON.parse(line ? line.slice(6) : body);
  if (json.error) throw new IxsError(json.error.message ?? "IXS MCP error");
  const content = json.result?.content?.[0];
  if (!content || content.type !== "text") throw new IxsError("IXS MCP returned no content");
  if (json.result.isError) throw new IxsError(content.text);
  try {
    return JSON.parse(content.text);
  } catch {
    throw new IxsError(content.text);
  }
}

export async function mcpCall<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
    cache: "no-store",
  });
  if (!res.ok) throw new IxsError(`IXS MCP ${name} failed with HTTP ${res.status}`);
  return parseSse(await res.text()) as T;
}

type RawVault = {
  routeId: string;
  name: string;
  network: string;
  chainId: number;
  contractAddress: `0x${string}`;
  explorerUrl: string;
  requiresWhitelist: boolean;
  status?: string;
  underlyingAsset: { address: `0x${string}`; decimals: number };
};

type VaultGet = { ok: boolean; settlement: Settlement; vault: RawVault; pricing?: Record<string, string> };

export function toVaultInfo(raw: RawVault, settlement: Settlement, acceptsDeposits: boolean): VaultInfo {
  const explorer = raw.explorerUrl.replace(/\/address\/.*$/, "");
  return {
    id: raw.routeId,
    name: raw.name,
    network: raw.network,
    chainId: raw.chainId,
    address: raw.contractAddress,
    asset: raw.underlyingAsset.address,
    decimals: raw.underlyingAsset.decimals,
    settlement,
    lagDays: settlement === "sync" ? 0 : ASYNC_LAG_DAYS,
    acceptsDeposits,
    explorerUrl: explorer,
  };
}

async function acceptsDeposits(vaultId: string, requiresWhitelist: boolean): Promise<boolean> {
  if (requiresWhitelist) return false;
  try {
    await mcpCall("vault_build_request_deposit", { vaultId, ownerAddress: PROBE_OWNER, assetAmount: "1" });
    return true;
  } catch (e) {
    if (e instanceof IxsError && /limit|whitelist|not supported/i.test(e.message)) return false;
    throw e;
  }
}

let cache: { at: number; vaults: VaultInfo[] } | null = null;
const CACHE_MS = 60_000;

// Live IXS testnet vaults with settlement type and whether each accepts deposits right now.
export async function listVaults(): Promise<VaultInfo[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.vaults;
  const res = await fetch(`${API_BASE}/vaults?pageSize=100`, { cache: "no-store" });
  if (!res.ok) throw new IxsError(`IXS vault list failed with HTTP ${res.status}`);
  const list = (await res.json()) as { items?: RawVault[] };
  const items = (list.items ?? []).filter((v) => (v.status ?? "active") === "active" && /testnet/.test(v.network));
  const vaults = await Promise.all(
    items.map(async (raw) => {
      const detail = await mcpCall<VaultGet>("vault_get", { vaultId: raw.routeId });
      return toVaultInfo(raw, detail.settlement, await acceptsDeposits(raw.routeId, raw.requiresWhitelist));
    }),
  );
  cache = { at: Date.now(), vaults };
  return vaults;
}

export async function buildDeposit(vaultId: string, owner: string, baseUnits: string): Promise<McpStep[]> {
  const res = await mcpCall<{ ok: boolean; steps: McpStep[] }>("vault_build_request_deposit", {
    vaultId,
    ownerAddress: owner,
    assetAmount: baseUnits,
  });
  return res.steps;
}

export async function buildRedeem(vaultId: string, owner: string, shareBaseUnits: string): Promise<McpStep[]> {
  const res = await mcpCall<{ ok: boolean; steps: McpStep[] }>("vault_build_request_redeem", {
    vaultId,
    ownerAddress: owner,
    shareAmount: shareBaseUnits,
  });
  return res.steps;
}

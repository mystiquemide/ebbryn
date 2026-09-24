import { describe, expect, it } from "vitest";
import { IxsError, parseSse, toVaultInfo } from "./ixs";

const frame = (result: unknown) => `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result })}\n\n`;

describe("parseSse", () => {
  it("reads JSON from the first data frame", () => {
    const body = frame({ content: [{ type: "text", text: JSON.stringify({ ok: true, settlement: "sync" }) }] });
    expect(parseSse(body)).toEqual({ ok: true, settlement: "sync" });
  });

  it("turns plain-text tool replies into IxsError", () => {
    const body = frame({ content: [{ type: "text", text: "Deposit amount exceeds the current vault limit of 0 USDC." }] });
    expect(() => parseSse(body)).toThrow(IxsError);
    expect(() => parseSse(body)).toThrow(/vault limit of 0/);
  });

  it("surfaces JSON-RPC errors", () => {
    const body = `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "boom" } })}\n`;
    expect(() => parseSse(body)).toThrow("boom");
  });
});

describe("toVaultInfo", () => {
  const raw = {
    routeId: "97-0xcb09a5326aefd705d14ff4c5ca2bed7086ba0dcc",
    name: "IXHYB - BSC",
    network: "bsc-testnet",
    chainId: 97,
    contractAddress: "0xCb09a5326AEFD705d14FF4C5ca2beD7086ba0Dcc" as const,
    explorerUrl: "https://testnet.bscscan.com/address/0xCb09a5326AEFD705d14FF4C5ca2beD7086ba0Dcc",
    requiresWhitelist: false,
    status: "active",
    underlyingAsset: { address: "0xbBCa80a7116aE46B0f249D279EF43f86274dc4f4" as const, decimals: 6 },
  };

  it("maps sync vaults to zero lag and strips the explorer path", () => {
    const v = toVaultInfo(raw, "sync", true);
    expect(v.lagDays).toBe(0);
    expect(v.explorerUrl).toBe("https://testnet.bscscan.com");
    expect(v.acceptsDeposits).toBe(true);
  });

  it("gives async vaults a redemption lag", () => {
    expect(toVaultInfo(raw, "async-erc7540", false).lagDays).toBeGreaterThan(0);
  });
});

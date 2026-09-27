import { describe, expect, it } from "vitest";
import { isMainnetChain } from "./network";
import { networkCopy } from "./vaultCopy";

describe("mainnet preview", () => {
  it("treats BSC and Avalanche mainnet as chains that must never be signed on", () => {
    expect(isMainnetChain(56)).toBe(true);
    expect(isMainnetChain(43114)).toBe(true);
    expect(isMainnetChain(97)).toBe(false);
  });

  it("labels networks by environment", () => {
    expect(networkCopy("bsc-testnet")).toBe("BSC testnet");
    expect(networkCopy("bsc")).toBe("BSC mainnet");
    expect(networkCopy("avalanche-mainnet")).toBe("Avalanche mainnet");
  });
});

"use client";

import { createPublicClient, erc20Abi, formatUnits, http, type EIP1193Provider } from "viem";
import { chainById } from "./chains";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export class WalletError extends Error {}

export function hasWallet(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function connectWallet(): Promise<`0x${string}`> {
  if (!window.ethereum) throw new WalletError("No browser wallet found. Install one like MetaMask to use your wallet balance.");
  try {
    const [account] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
    if (!account) throw new WalletError("The wallet didn't share an account.");
    return account;
  } catch (e) {
    if (e instanceof WalletError) throw e;
    const code = (e as { code?: number })?.code;
    throw new WalletError(code === 4001 ? "You declined the connection. Nothing was shared." : "The wallet couldn't connect.");
  }
}

// Reads an ERC-20 balance over the chain's public RPC, so it works whatever network the wallet is on.
export async function readTokenBalance(chainId: number, token: `0x${string}`, owner: `0x${string}`, decimals: number): Promise<number> {
  const chain = chainById(chainId);
  if (!chain) throw new WalletError(`Ebbryn doesn't know chain ${chainId}.`);
  const client = createPublicClient({ chain, transport: http() });
  const raw = await client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [owner] });
  return Number(formatUnits(raw, decimals));
}

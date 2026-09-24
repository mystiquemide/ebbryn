"use client";

import { createPublicClient, createWalletClient, custom, decodeFunctionData, erc20Abi, formatUnits, http, type EIP1193Provider } from "viem";
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

export async function walletChainId(): Promise<number> {
  if (!window.ethereum) throw new WalletError("No browser wallet found.");
  const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
  return parseInt(hex, 16);
}

// Switches the wallet to the chain, adding it first if the wallet doesn't know it.
export async function switchWalletChain(chainId: number): Promise<void> {
  const chain = chainById(chainId);
  if (!window.ethereum || !chain) throw new WalletError("Can't switch networks in this wallet.");
  const hexId = `0x${chainId.toString(16)}` as `0x${string}`;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (e) {
    const code = (e as { code?: number })?.code;
    if (code === 4001) throw new WalletError("You declined the network switch.");
    if (code !== 4902) throw new WalletError("The wallet couldn't switch networks.");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexId,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [...chain.rpcUrls.default.http],
          blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [],
        },
      ],
    });
  }
}

export async function readAllowance(chainId: number, token: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
  const chain = chainById(chainId);
  if (!chain) throw new WalletError(`Ebbryn doesn't know chain ${chainId}.`);
  const client = createPublicClient({ chain, transport: http() });
  return client.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
}

export type TxOutcome = { hash: `0x${string}`; status: "success" | "reverted" };

// Sends one prepared transaction from the user's wallet and waits for it on chain.
export async function sendAndConfirm(
  chainId: number,
  from: `0x${string}`,
  tx: { to: `0x${string}`; data: `0x${string}`; value?: string },
  onSent: (hash: `0x${string}`) => void,
): Promise<TxOutcome> {
  const chain = chainById(chainId);
  if (!window.ethereum || !chain) throw new WalletError("No browser wallet found.");
  const wallet = createWalletClient({ chain, transport: custom(window.ethereum) });
  let hash: `0x${string}`;
  try {
    hash = await wallet.sendTransaction({ account: from, to: tx.to, data: tx.data, value: tx.value ? BigInt(tx.value) : BigInt(0), chain });
  } catch (e) {
    const code = (e as { code?: number; cause?: { code?: number } })?.code ?? (e as { cause?: { code?: number } })?.cause?.code;
    if (code === 4001 || /rejected|denied/i.test(String((e as Error)?.message))) throw new WalletError("Not signed. Nothing moved.");
    throw new WalletError("The wallet couldn't send this transaction. Nothing moved.");
  }
  onSent(hash);
  const client = createPublicClient({ chain, transport: http() });
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 180_000 });
  return { hash, status: receipt.status };
}

export async function readNativeBalance(chainId: number, owner: `0x${string}`): Promise<number> {
  const chain = chainById(chainId);
  if (!chain) throw new WalletError(`Ebbryn doesn't know chain ${chainId}.`);
  const client = createPublicClient({ chain, transport: http() });
  return Number(formatUnits(await client.getBalance({ address: owner }), chain.nativeCurrency.decimals));
}

// Best effort: wallets that support it drop this site's access. Ebbryn forgets the account either way.
export async function disconnectWallet(): Promise<void> {
  try {
    await window.ethereum?.request({ method: "wallet_revokePermissions" as never, params: [{ eth_accounts: {} }] as never });
  } catch {
    /* not every wallet supports revoking; local state is cleared regardless */
  }
}

// Reads approve(spender, amount) out of an ERC-20 approve call so the UI can show exactly what is approved.
export function decodeApprove(data: `0x${string}`): { spender: `0x${string}`; amount: bigint } | null {
  try {
    const d = decodeFunctionData({ abi: erc20Abi, data });
    if (d.functionName !== "approve") return null;
    const [spender, amount] = d.args as [`0x${string}`, bigint];
    return { spender, amount };
  } catch {
    return null;
  }
}

import { defineChain } from "viem";
import { bscTestnet } from "viem/chains";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});

const bsc = {
  ...bscTestnet,
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://bsc-testnet.bnbchain.org"] } },
};

export const CHAINS = { [bscTestnet.id]: bsc, [arcTestnet.id]: arcTestnet } as const;

export function chainById(id: number) {
  return (CHAINS as Record<number, typeof bsc | typeof arcTestnet>)[id] ?? null;
}

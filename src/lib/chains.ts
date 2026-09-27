import { defineChain } from "viem";
import { avalanche, bsc as bscMainnet, bscTestnet } from "viem/chains";

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

// Mainnet chains are only read from (balances, allowances). Ebbryn never signs on them.
const bscMain = { ...bscMainnet, rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_BSC_RPC || "https://bsc-dataseed.bnbchain.org"] } } };
const avax = { ...avalanche, rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_AVAX_RPC || "https://api.avax.network/ext/bc/C/rpc"] } } };

export const CHAINS = { [bscTestnet.id]: bsc, [arcTestnet.id]: arcTestnet, [bscMainnet.id]: bscMain, [avalanche.id]: avax } as const;

type AnyChain = typeof bsc | typeof arcTestnet | typeof bscMain | typeof avax;

export function chainById(id: number) {
  return (CHAINS as Record<number, AnyChain>)[id] ?? null;
}

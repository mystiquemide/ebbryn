// Which IXS environment Ebbryn reads. Testnet is IXS's dev environment; mainnet reads the production API and
// real vaults. Mainnet is preview only: Ebbryn builds and checks real transactions but never lets anyone sign them.
export const IXS_NETWORK: "mainnet" | "testnet" = process.env.IXS_NETWORK === "mainnet" ? "mainnet" : "testnet";

// Chains where real funds live. The Moves screen refuses to sign on these, whatever the server says.
export const MAINNET_CHAIN_IDS = new Set([56, 43114]);

export const isMainnetChain = (chainId: number) => MAINNET_CHAIN_IDS.has(chainId);

// Short label used in copy: "IXS mainnet" or "IXS testnet".
export const IXS_LABEL = `IXS ${IXS_NETWORK}`;

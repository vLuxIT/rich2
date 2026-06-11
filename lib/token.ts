export const RICH_TOKEN = {
  symbol: "RICH",
  logo: "/rc.png",
  address: "0x8d8e9f6aA383C8F175aEbf1c921c48368167380A" as const,
  decimals: 18,
};

export const USDT_TOKEN = {
  symbol: "USDT",
  logo: "/usdt.png",
  address: "0x55d398326f99059fF775485246999027B3197955" as const,
  decimals: 18,
};

export type SwapToken = typeof RICH_TOKEN | typeof USDT_TOKEN;
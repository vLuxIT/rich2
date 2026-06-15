export const RICH_TOKEN = {
  symbol: "RIC",
  logo: "/rc.png",
  address: "0x4981F824e7173846771a4b6C5f9492c3144AAbd8" as const,
  decimals: 18,
};

export const USDT_TOKEN = {
  symbol: "USDT",
  logo: "/usdt.png",
  address: "0x55d398326f99059fF775485246999027B3197955" as const,
  decimals: 18,
};

export type SwapToken = typeof RICH_TOKEN | typeof USDT_TOKEN;
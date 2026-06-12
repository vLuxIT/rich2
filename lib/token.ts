export const RICH_TOKEN = {
  symbol: "RIC",
  logo: "/rc.png",
  address: "0xc9CBFac89dbB869ea16D11DfBB74bEe8b119745c" as const,
  decimals: 18,
};

export const USDT_TOKEN = {
  symbol: "USDT",
  logo: "/usdt.png",
  address: "0x55d398326f99059fF775485246999027B3197955" as const,
  decimals: 18,
};

export type SwapToken = typeof RICH_TOKEN | typeof USDT_TOKEN;
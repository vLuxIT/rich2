export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type RampNetwork =
  | "celo"
  | "polygon"
  | "erc20"
  | "bep20"
  | "lsk"
  | "solana"
  | "base"
  | "ton"
  | "trc20";

export type RampFiatCurrency = "ngn" | "ghs";
export type RampToken = "usdt" | "usdc" | "cngn" | "xaut" | "usat";

export interface QuidaxCustomer {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  [key: string]: JsonValue | undefined;
}

/**
 * Quidax documents wallet_address as an object but does not expose all nested
 * fields in its public reference page. `address` and `network` are the fields
 * used by this integration; extra merchant-enabled fields can be forwarded.
 */
export interface QuidaxWalletAddress {
  address: string;
  network: RampNetwork;
  [key: string]: JsonValue;
}

export interface BuyQuoteQuery {
  currency: RampFiatCurrency;
  token: "usdt" | "usdc" | "xaut" | "usat";
  fiat_amount: string;
  token_network: RampNetwork;
}

export interface SellQuoteQuery {
  token: "usdt";
  currency: "ngn";
  token_amount: string;
  token_network: RampNetwork;
}

export interface InitiateOnRampBody {
  from_currency: RampFiatCurrency;
  to_currency: "usdt" | "usdc" | "cngn";
  from_amount: string;
  merchant_reference: string;
  customer: QuidaxCustomer;
  wallet_address: QuidaxWalletAddress;
}

export interface InitiateOffRampBody {
  from_currency: "usdt" | "usdc" | "cngn";
  to_currency: RampFiatCurrency;
  from_amount: string;
  network: RampNetwork;
  merchant_reference: string;
  customer: QuidaxCustomer;
}

export interface AddBankAccountBody {
  bank_code: string;
  account_number: string;
  currency_code: RampFiatCurrency;
}

export interface QuidaxEnvelope<T = unknown> {
  status?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

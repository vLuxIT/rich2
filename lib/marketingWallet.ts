import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

import { RICH_TOKEN } from "@/lib/token";
import { erc20Abi } from "@/lib/erc20Abi";

const privateKey = process.env.MARKETING_WALLET_PRIVATE_KEY;
const rpcUrl = process.env.BSC_RPC_URL;

if (!privateKey) {
  throw new Error("Missing MARKETING_WALLET_PRIVATE_KEY");
}

if (!rpcUrl) {
  throw new Error("Missing BSC_RPC_URL");
}

const formattedPrivateKey = privateKey.startsWith("0x")
  ? (privateKey as `0x${string}`)
  : (`0x${privateKey}` as `0x${string}`);

export const marketingAccount = privateKeyToAccount(formattedPrivateKey);

export const marketingWalletClient = createWalletClient({
  account: marketingAccount,
  chain: bsc,
  transport: http(rpcUrl),
});

export async function sendRichReferralReward({
  to,
  amountRich,
}: {
  to: `0x${string}`;
  amountRich: number;
}) {
  const amount = parseUnits(amountRich.toString(), RICH_TOKEN.decimals);

  const hash = await marketingWalletClient.writeContract({
    address: RICH_TOKEN.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });

  return hash;
}
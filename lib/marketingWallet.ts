import { createWalletClient, formatEther, formatUnits, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

import { bscClient } from "@/lib/bscClient";
import { erc20Abi } from "@/lib/erc20Abi";
import { RICH_TOKEN } from "@/lib/token";

const privateKey = process.env.MARKETING_WALLET_PRIVATE_KEY;
const rpcUrl = process.env.BSC_RPC_URL;

if (!privateKey) throw new Error("Missing MARKETING_WALLET_PRIVATE_KEY");
if (!rpcUrl) throw new Error("Missing BSC_RPC_URL");

const formattedPrivateKey = privateKey.startsWith("0x")
  ? (privateKey as `0x${string}`)
  : (`0x${privateKey}` as `0x${string}`);

export const marketingAccount = privateKeyToAccount(formattedPrivateKey);

export const marketingWalletClient = createWalletClient({
  account: marketingAccount,
  chain: bsc,
  transport: http(rpcUrl),
});

export type ReferralPayoutResult = {
  hash: `0x${string}`;
  blockNumber: bigint;
};

function contractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const details = error as Error & {
      shortMessage?: string;
      details?: string;
    };

    return (
      details.shortMessage ||
      details.details ||
      details.message ||
      "Unknown contract error"
    );
  }

  return "Unknown contract error";
}

export async function sendRichReferralReward({
  to,
  amountRaw,
  onSubmitted,
}: {
  to: `0x${string}`;
  amountRaw: bigint;
  onSubmitted?: (hash: `0x${string}`) => Promise<void>;
}): Promise<ReferralPayoutResult> {
  if (amountRaw <= BigInt(0)) {
    throw new Error("Referral reward must be greater than zero");
  }

  const [ricBalance, bnbBalance] = await Promise.all([
    bscClient.readContract({
      address: RICH_TOKEN.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [marketingAccount.address],
    }),
    bscClient.getBalance({ address: marketingAccount.address }),
  ]);

  console.log("========== MARKETING WALLET ==========");
  console.log("Address:", marketingAccount.address);
  console.log("RIC balance:", formatUnits(ricBalance, RICH_TOKEN.decimals));
  console.log("Reward required:", formatUnits(amountRaw, RICH_TOKEN.decimals));
  console.log("BNB balance:", formatEther(bnbBalance));

  if (ricBalance < amountRaw) {
    throw new Error(
      `Insufficient marketing RIC. Balance ${formatUnits(
        ricBalance,
        RICH_TOKEN.decimals,
      )}; required ${formatUnits(amountRaw, RICH_TOKEN.decimals)}`,
    );
  }

  if (bnbBalance <= BigInt(0)) {
    throw new Error("Marketing wallet has no BNB for gas");
  }

  try {
    const { request } = await bscClient.simulateContract({
      account: marketingAccount,
      address: RICH_TOKEN.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amountRaw],
    });

    const hash = await marketingWalletClient.writeContract(request);

    if (onSubmitted) {
      await onSubmitted(hash);
    }

    const receipt = await bscClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 120_000,
    });

    if (receipt.status !== "success") {
      throw new Error(`Referral payout reverted: ${hash}`);
    }

    return { hash, blockNumber: receipt.blockNumber };
  } catch (error: unknown) {
    const message = contractErrorMessage(error);

    console.error("========== REFERRAL PAYOUT ERROR ==========");
    console.error("Marketing wallet:", marketingAccount.address);
    console.error("Recipient:", to);
    console.error("Amount:", formatUnits(amountRaw, RICH_TOKEN.decimals), "RIC");
    console.error("Reason:", message);
    console.dir(error, { depth: null });

    throw new Error(`Referral payout failed: ${message}`, { cause: error });
  }
}

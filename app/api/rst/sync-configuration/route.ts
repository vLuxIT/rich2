import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  parseAbi,
  parseGwei,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Production RST contracts.
 *
 * Kept local in this API route so the server route does not depend on any
 * client-only module.
 */
const RST_MANAGER_ADDRESS =
  "0x36D2C7a9759dae8C860d799e35C95e5Dba7b89FF" as Address;

const RST_TREASURY_ADDRESS =
  "0x40c9497B35002C3Eb5b4096810644b81C220359D" as Address;

const RIC_CLAIM_PROCESSOR_ADDRESS =
  "0x8B867A8A031654ded045EBf7d08e53F146Bc62E2" as Address;

const TAX_WALLET_ADDRESS =
  "0x5677700188491E9Ad49DE2bbc4EE37bb8D707aAC" as Address;

const rstManagerConfigurationAbi = parseAbi([
  "function currentOpvUsdt() view returns (uint256)",
  "function subscriptionPriceUsdt() view returns (uint256)",
  "function minimumSubscriptionUsdt() view returns (uint256)",
  "function setConfiguration(address treasury_, address claimProcessor_, address taxWallet_, uint256 subscriptionPriceUsdt_, uint256 minimumSubscriptionUsdt_)",
]);

const DEFAULT_GAS_PRICE_GWEI = "0.05";

const DEFAULT_BATCH_GAS_LIMIT = BigInt(
  process.env.RST_BATCH_GAS_LIMIT || "2000000"
);

const MAX_BATCH_GAS_LIMIT = BigInt(
  process.env.RST_BATCH_MAX_GAS_LIMIT || "5000000"
);

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getRpcUrl() {
  const rpcUrl = process.env.BSC_RPC_URL;

  if (!rpcUrl) {
    throw new Error("Missing BSC_RPC_URL.");
  }

  return rpcUrl;
}

function getPrivateKey() {
  const privateKey = process.env.RST_BATCH_EXECUTOR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing RST_BATCH_EXECUTOR_PRIVATE_KEY.");
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error("RST_BATCH_EXECUTOR_PRIVATE_KEY must start with 0x.");
  }

  return privateKey as Hex;
}

function getLegacyGasPrice() {
  return parseGwei(process.env.BSC_GAS_PRICE_GWEI || DEFAULT_GAS_PRICE_GWEI);
}

async function getSafeGasLimit({
  publicClient,
  account,
  gasPrice,
  currentOpvUsdt,
}: {
  publicClient: ReturnType<typeof createPublicClient>;
  account: ReturnType<typeof privateKeyToAccount>;
  gasPrice: bigint;
  currentOpvUsdt: bigint;
}) {
  let gasLimit = DEFAULT_BATCH_GAS_LIMIT;

  try {
    const estimatedGas = await publicClient.estimateContractGas({
      account,
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "setConfiguration",
      args: [
        RST_TREASURY_ADDRESS,
        RIC_CLAIM_PROCESSOR_ADDRESS,
        TAX_WALLET_ADDRESS,
        currentOpvUsdt,
        currentOpvUsdt,
      ],
      gasPrice,
    });

    const estimatedWithBuffer = (estimatedGas * BigInt(130)) / BigInt(100);

    if (
      estimatedWithBuffer > DEFAULT_BATCH_GAS_LIMIT &&
      estimatedWithBuffer <= MAX_BATCH_GAS_LIMIT
    ) {
      gasLimit = estimatedWithBuffer;
    }
  } catch (error) {
    console.warn(
      "Could not estimate RST setConfiguration gas. Using RST_BATCH_GAS_LIMIT.",
      error
    );
  }

  return gasLimit;
}

async function assertExecutorHasEnoughBnb({
  publicClient,
  executor,
  gasPrice,
  gasLimit,
}: {
  publicClient: ReturnType<typeof createPublicClient>;
  executor: Address;
  gasPrice: bigint;
  gasLimit: bigint;
}) {
  const balance = await publicClient.getBalance({ address: executor });
  const required = gasPrice * gasLimit;

  if (balance < required) {
    throw new Error(
      `RST config executor needs more BNB. Executor ${executor} has ${formatUnits(
        balance,
        18
      )} BNB, but this route reserves about ${formatUnits(
        required,
        18
      )} BNB for gas. Fund the RST_BATCH_EXECUTOR_PRIVATE_KEY wallet or reduce BSC_GAS_PRICE_GWEI / RST_BATCH_GAS_LIMIT.`
    );
  }

  return {
    balance,
    required,
  };
}

export async function GET() {
  try {
    const rpcUrl = getRpcUrl();
    const account = privateKeyToAccount(getPrivateKey());
    const gasPrice = getLegacyGasPrice();

    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(rpcUrl),
    });

    const currentOpvUsdt = await publicClient.readContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "currentOpvUsdt",
    });

    if (currentOpvUsdt <= BigInt(0)) {
      throw new Error("currentOpvUsdt() returned 0. Configuration not updated.");
    }

    const beforeSubscriptionPrice = await publicClient.readContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "subscriptionPriceUsdt",
    });

    const beforeMinimumSubscription = await publicClient.readContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "minimumSubscriptionUsdt",
    });

    const gasLimit = await getSafeGasLimit({
      publicClient,
      account,
      gasPrice,
      currentOpvUsdt,
    });

    const executorGas = await assertExecutorHasEnoughBnb({
      publicClient,
      executor: account.address,
      gasPrice,
      gasLimit,
    });

    /**
     * Important:
     * Pass bounded gas into both simulateContract and writeContract.
     * This avoids the old RPC problem where simulateContract used an absurd
     * gas amount and failed with insufficient funds.
     */
    await publicClient.simulateContract({
      account,
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "setConfiguration",
      args: [
        RST_TREASURY_ADDRESS,
        RIC_CLAIM_PROCESSOR_ADDRESS,
        TAX_WALLET_ADDRESS,
        currentOpvUsdt,
        currentOpvUsdt,
      ],
      gas: gasLimit,
      gasPrice,
    });

    const hash = await walletClient.writeContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "setConfiguration",
      args: [
        RST_TREASURY_ADDRESS,
        RIC_CLAIM_PROCESSOR_ADDRESS,
        TAX_WALLET_ADDRESS,
        currentOpvUsdt,
        currentOpvUsdt,
      ],
      gas: gasLimit,
      gasPrice,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    const afterSubscriptionPrice = await publicClient.readContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "subscriptionPriceUsdt",
    });

    const afterMinimumSubscription = await publicClient.readContract({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerConfigurationAbi,
      functionName: "minimumSubscriptionUsdt",
    });

    return jsonResponse({
      ok: true,
      manager: RST_MANAGER_ADDRESS,
      treasury: RST_TREASURY_ADDRESS,
      claimProcessor: RIC_CLAIM_PROCESSOR_ADDRESS,
      taxWallet: TAX_WALLET_ADDRESS,
      executor: account.address,
      currentOpvUsdtRaw: currentOpvUsdt.toString(),
      currentOpvUsdtFormatted: formatUnits(currentOpvUsdt, 18),
      before: {
        subscriptionPriceUsdtRaw: beforeSubscriptionPrice.toString(),
        subscriptionPriceUsdtFormatted: formatUnits(
          beforeSubscriptionPrice,
          18
        ),
        minimumSubscriptionUsdtRaw: beforeMinimumSubscription.toString(),
        minimumSubscriptionUsdtFormatted: formatUnits(
          beforeMinimumSubscription,
          18
        ),
      },
      after: {
        subscriptionPriceUsdtRaw: afterSubscriptionPrice.toString(),
        subscriptionPriceUsdtFormatted: formatUnits(afterSubscriptionPrice, 18),
        minimumSubscriptionUsdtRaw: afterMinimumSubscription.toString(),
        minimumSubscriptionUsdtFormatted: formatUnits(
          afterMinimumSubscription,
          18
        ),
      },
      txHash: hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      gasLimit: gasLimit.toString(),
      gasPriceWei: gasPrice.toString(),
      executorBalanceBnb: formatUnits(executorGas.balance, 18),
      reservedGasBnb: formatUnits(executorGas.required, 18),
    });
  } catch (error) {
    console.error("RST setConfiguration sync failed:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "RST setConfiguration sync failed.",
      },
      500
    );
  }
}

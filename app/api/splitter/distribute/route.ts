import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseAbi,
  parseGwei,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPLITTER_ADDRESS =
  "0xCAcA46A07A11941AE693a8d9c692d7f30BCdf640" as Address;

/**
 * BSC USDT.
 * This keeps the $10 check simple: no BNB/USD conversion.
 * It checks whether the splitter has at least 10 USDT.
 */
const USDT_ADDRESS =
  "0x55d398326f99059fF775485246999027B3197955" as Address;

const USDT_DECIMALS = 18;
const MIN_SPLITTER_BALANCE_USDT = "10";

const splitterAbi = parseAbi(["function distribute()"]);

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
}: {
  publicClient: ReturnType<typeof createPublicClient>;
  account: ReturnType<typeof privateKeyToAccount>;
  gasPrice: bigint;
}) {
  /**
   * Start with RST_BATCH_GAS_LIMIT so we never accidentally use a huge RPC
   * default like 600,000,000 gas.
   */
  let gasLimit = DEFAULT_BATCH_GAS_LIMIT;

  try {
    const estimatedGas = await publicClient.estimateContractGas({
      account,
      address: SPLITTER_ADDRESS,
      abi: splitterAbi,
      functionName: "distribute",
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
      "Could not estimate splitter distribute gas. Using RST_BATCH_GAS_LIMIT.",
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
      `Splitter executor needs more BNB. Executor ${executor} has ${formatUnits(
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

    const splitterUsdtBalance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [SPLITTER_ADDRESS],
    });

    const minBalanceRaw = parseUnits(
      MIN_SPLITTER_BALANCE_USDT,
      USDT_DECIMALS
    );

    if (splitterUsdtBalance < minBalanceRaw) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: `Splitter USDT balance is below $${MIN_SPLITTER_BALANCE_USDT}. distribute() was not called.`,
        splitter: SPLITTER_ADDRESS,
        balanceToken: USDT_ADDRESS,
        splitterBalanceUsdt: formatUnits(splitterUsdtBalance, USDT_DECIMALS),
        minBalanceUsdt: MIN_SPLITTER_BALANCE_USDT,
        executor: account.address,
      });
    }

    const gasLimit = await getSafeGasLimit({
      publicClient,
      account,
      gasPrice,
    });

    const executorGas = await assertExecutorHasEnoughBnb({
      publicClient,
      executor: account.address,
      gasPrice,
      gasLimit,
    });

    /**
     * Important:
     * Always pass the bounded gas limit into simulateContract and writeContract.
     * This avoids the old RPC issue where simulateContract used 600,000,000 gas.
     */
    await publicClient.simulateContract({
      account,
      address: SPLITTER_ADDRESS,
      abi: splitterAbi,
      functionName: "distribute",
      gas: gasLimit,
      gasPrice,
    });

    const hash = await walletClient.writeContract({
      address: SPLITTER_ADDRESS,
      abi: splitterAbi,
      functionName: "distribute",
      gas: gasLimit,
      gasPrice,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    return jsonResponse({
      ok: true,
      skipped: false,
      splitter: SPLITTER_ADDRESS,
      balanceToken: USDT_ADDRESS,
      splitterBalanceBeforeUsdt: formatUnits(
        splitterUsdtBalance,
        USDT_DECIMALS
      ),
      minBalanceUsdt: MIN_SPLITTER_BALANCE_USDT,
      executor: account.address,
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
    console.error("splitter distribute GET failed:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Splitter distribute failed.",
      },
      500
    );
  }
}

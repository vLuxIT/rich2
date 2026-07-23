import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseGwei,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

export const runtime = "nodejs";

const RIC_ALLOCATION_ROUTER_ADDRESS =
  "0x5ff664dab40a564252c7dbdc5079e12dff6b110e" as Address;

const BPS_DENOMINATOR = BigInt(10000);
const DEFAULT_SLIPPAGE_BPS = BigInt(500);

const ricAllocationRouterAbi = parseAbi([
  "function pendingSubscriptionUsdt() view returns (uint256)",
  "function getSwapPath() view returns (address[] memory)",
  "function dexRouter() view returns (address)",
  "function executeSubscriptionBatch(uint256 amount, uint256 minRicOut, uint256 deadline)",
]);

const pancakeQuoteAbi = parseAbi([
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
]);

type ExecuteBatchBody = {
  subscriptionTxHash?: Hex;
  amountRaw?: string;
  slippageBps?: number;
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function getReadableError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    details?: string;
    message?: string;
    cause?: {
      shortMessage?: string;
      details?: string;
      message?: string;
    };
  };

  return (
    err.shortMessage ||
    err.details ||
    err.cause?.shortMessage ||
    err.cause?.details ||
    err.message ||
    err.cause?.message ||
    "Failed to execute subscription batch"
  );
}

function getPrivateKey() {
  const privateKey = process.env.RST_BATCH_EXECUTOR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing RST_BATCH_EXECUTOR_PRIVATE_KEY");
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error("RST_BATCH_EXECUTOR_PRIVATE_KEY must start with 0x");
  }

  return privateKey as Hex;
}

function getRpcUrl() {
  const rpcUrl = process.env.BSC_RPC_URL;

  if (!rpcUrl) {
    throw new Error("Missing BSC_RPC_URL");
  }

  return rpcUrl;
}

async function getLegacyGasPrice(
  publicClient: ReturnType<typeof createPublicClient>
) {
  const envGasPriceGwei = process.env.BSC_GAS_PRICE_GWEI;
  const fallbackGasPrice = parseGwei(envGasPriceGwei || "3");

  try {
    const networkGasPrice = await publicClient.getGasPrice();

    if (networkGasPrice > BigInt(0)) {
      return networkGasPrice;
    }

    return fallbackGasPrice;
  } catch {
    return fallbackGasPrice;
  }
}

async function verifySubscriptionTx(
  publicClient: ReturnType<typeof createPublicClient>,
  txHash?: Hex
) {
  if (!txHash) return;

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  if (receipt.status !== "success") {
    throw new Error("Subscription transaction did not succeed");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ExecuteBatchBody;

    const rpcUrl = getRpcUrl();
    const account = privateKeyToAccount(getPrivateKey());

    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(rpcUrl),
    });

    await verifySubscriptionTx(publicClient, body.subscriptionTxHash);

    const pendingSubscriptionUsdt = (await publicClient.readContract({
      address: RIC_ALLOCATION_ROUTER_ADDRESS,
      abi: ricAllocationRouterAbi,
      functionName: "pendingSubscriptionUsdt",
    })) as bigint;

    const amount =
      body.amountRaw !== undefined
        ? BigInt(body.amountRaw)
        : pendingSubscriptionUsdt;

    if (amount <= BigInt(0)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No pending subscription USDT to batch",
        pendingSubscriptionUsdtRaw: pendingSubscriptionUsdt.toString(),
        executor: account.address,
      });
    }

    if (amount > pendingSubscriptionUsdt) {
      return json(400, {
        ok: false,
        error: "Requested batch amount is greater than pendingSubscriptionUsdt",
        requestedAmountRaw: amount.toString(),
        pendingSubscriptionUsdtRaw: pendingSubscriptionUsdt.toString(),
      });
    }

    const swapPath = (await publicClient.readContract({
      address: RIC_ALLOCATION_ROUTER_ADDRESS,
      abi: ricAllocationRouterAbi,
      functionName: "getSwapPath",
    })) as Address[];

    if (!swapPath || swapPath.length < 2) {
      return json(500, {
        ok: false,
        error: "RICAllocationRouter swap path is not configured",
        swapPath,
      });
    }

    const dexRouter = (await publicClient.readContract({
      address: RIC_ALLOCATION_ROUTER_ADDRESS,
      abi: ricAllocationRouterAbi,
      functionName: "dexRouter",
    })) as Address;

    const amounts = (await publicClient.readContract({
      address: dexRouter,
      abi: pancakeQuoteAbi,
      functionName: "getAmountsOut",
      args: [amount, swapPath],
    })) as bigint[];

    const quotedRicOut = amounts[amounts.length - 1];

    const slippageBps =
      body.slippageBps !== undefined
        ? BigInt(body.slippageBps)
        : DEFAULT_SLIPPAGE_BPS;

    if (slippageBps < BigInt(0) || slippageBps >= BPS_DENOMINATOR) {
      return json(400, {
        ok: false,
        error: "slippageBps must be between 0 and 9999",
      });
    }

    const minRicOut =
      (quotedRicOut * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
    const gasPrice = await getLegacyGasPrice(publicClient);

    await publicClient.simulateContract({
      account,
      address: RIC_ALLOCATION_ROUTER_ADDRESS,
      abi: ricAllocationRouterAbi,
      functionName: "executeSubscriptionBatch",
      args: [amount, minRicOut, deadline],
      gasPrice,
    });

    const hash = await walletClient.writeContract({
      address: RIC_ALLOCATION_ROUTER_ADDRESS,
      abi: ricAllocationRouterAbi,
      functionName: "executeSubscriptionBatch",
      args: [amount, minRicOut, deadline],
      gasPrice,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status !== "success") {
      throw new Error("executeSubscriptionBatch transaction reverted");
    }

    return NextResponse.json({
      ok: true,
      skipped: false,
      txHash: hash,
      executor: account.address,
      amountRaw: amount.toString(),
      pendingSubscriptionUsdtRaw: pendingSubscriptionUsdt.toString(),
      dexRouter,
      swapPath,
      quotedRicOutRaw: quotedRicOut.toString(),
      minRicOutRaw: minRicOut.toString(),
      gasPriceWei: gasPrice.toString(),
    });
  } catch (error) {
    const message = getReadableError(error);

    console.error("execute-subscription-batch failed:", error);

    return json(500, {
      ok: false,
      error: message,
    });
  }
}

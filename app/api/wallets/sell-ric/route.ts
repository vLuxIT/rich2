import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseAbi,
  parseEther,
  parseUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

import { PANCAKE_V2_ROUTER } from "@/lib/pancake";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { USDT_TOKEN } from "@/lib/token";
import { decryptPrivateKey } from "@/lib/walletCrypto";

export const runtime = "nodejs";

const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address;

const routerAbi = parseAbi([
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
]);

type SellRicBody = {
  walletId?: string;
  walletAddress?: string;

  /**
   * Human-readable RIC amount to sell, e.g. "1000", "250.5".
   * This is the preferred input.
   */
  tokenAmount?: string;

  /**
   * Optional aliases.
   */
  amount?: string;
  ricAmount?: string;

  /**
   * Fallback for older requests.
   */
  sellPercent?: number;

  slippagePercent?: number;
};

type GeneratedWalletRow = {
  id: string;
  address: string;
  chain: string;
  encrypted_private_key: string;
  encryption_iv: string;
  encryption_tag: string;
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.startsWith("0x")
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);
}

function clampPercent(value: unknown, fallback: number) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 0) return fallback;
  if (numeric > 100) return 100;

  return numeric;
}

function toBps(percent: number) {
  return BigInt(Math.floor(percent * 100));
}

function getSellPath(ricTokenAddress: Address) {
  return [ricTokenAddress, USDT_TOKEN.address] as Address[];
}

function getRequestedTokenAmount(body: SellRicBody) {
  return body.tokenAmount || body.amount || body.ricAmount;
}

function isValidDecimalAmount(value: string) {
  return /^(?:\d+|\d*\.\d+)$/.test(value.trim());
}

async function getBnbTopupAmount(
  publicClient: ReturnType<typeof createPublicClient>
) {
  const gasTopupUsd = process.env.GAS_TOPUP_USD || "0.07";

  try {
    const usdtAmount = parseUnits(gasTopupUsd, USDT_TOKEN.decimals);

    const amounts = (await publicClient.readContract({
      address: PANCAKE_V2_ROUTER,
      abi: routerAbi,
      functionName: "getAmountsOut",
      args: [usdtAmount, [USDT_TOKEN.address, WBNB_ADDRESS]],
    })) as bigint[];

    const quotedBnb = amounts[amounts.length - 1];

    if (quotedBnb > BigInt(0)) {
      return quotedBnb;
    }
  } catch (error) {
    console.warn(
      "Failed to quote GAS_TOPUP_USD. Falling back to GAS_TOPUP_BNB.",
      error
    );
  }

  return parseEther(process.env.GAS_TOPUP_BNB || "0.00012");
}

async function updateSellTx(id: string | undefined, values: Record<string, unknown>) {
  if (!id) return;

  const { error } = await supabaseAdmin
    .from("ric_sell_transactions")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update ric_sell_transactions:", error);
  }
}

export async function POST(req: NextRequest) {
  let transactionId: string | undefined;

  try {
    const apiSecret = requireEnv("SELL_RIC_API_SECRET");
    const requestSecret = req.headers.get("x-api-key");

    if (requestSecret !== apiSecret) {
      return json(401, {
        ok: false,
        error: "Unauthorized",
      });
    }

    const bscRpcUrl = requireEnv("BSC_RPC_URL");
    const ricTokenAddress = requireEnv("RIC_TOKEN_ADDRESS") as Address;
    const receiverAddress = requireEnv("RIC_SELL_RECEIVER_ADDRESS") as Address;
    const gasFunderPrivateKey = normalizePrivateKey(
      requireEnv("GAS_FUNDER_PRIVATE_KEY")
    );

    if (!isAddress(ricTokenAddress)) {
      return json(500, {
        ok: false,
        error: "Invalid RIC_TOKEN_ADDRESS",
      });
    }

    if (!isAddress(receiverAddress)) {
      return json(500, {
        ok: false,
        error: "Invalid RIC_SELL_RECEIVER_ADDRESS",
      });
    }

    const body = (await req.json()) as SellRicBody;

    if (!body.walletId && !body.walletAddress) {
      return json(400, {
        ok: false,
        error: "walletId or walletAddress is required",
      });
    }

    if (body.walletAddress && !isAddress(body.walletAddress)) {
      return json(400, {
        ok: false,
        error: "Invalid walletAddress",
      });
    }

    const requestedTokenAmount = getRequestedTokenAmount(body);

    if (requestedTokenAmount && !isValidDecimalAmount(requestedTokenAmount)) {
      return json(400, {
        ok: false,
        error: "Invalid tokenAmount",
      });
    }

    const sellPercent = clampPercent(body.sellPercent, 100);
    const slippagePercent = clampPercent(body.slippagePercent, 15);
    const sellPath = getSellPath(ricTokenAddress);

    let walletQuery = supabaseAdmin
      .from("generated_wallets")
      .select(
        "id,address,chain,encrypted_private_key,encryption_iv,encryption_tag"
      )
      .eq("chain", "bsc")
      .limit(1);

    if (body.walletId) {
      walletQuery = walletQuery.eq("id", body.walletId);
    } else {
      walletQuery = walletQuery.ilike("address", body.walletAddress!);
    }

    const { data: walletRows, error: walletError } = await walletQuery;

    if (walletError) {
      return json(500, {
        ok: false,
        error: walletError.message,
      });
    }

    const wallet = walletRows?.[0] as GeneratedWalletRow | undefined;

    if (!wallet) {
      return json(404, {
        ok: false,
        error: "Generated wallet not found",
      });
    }

    const tokenWalletPrivateKey = decryptPrivateKey({
      encryptedPrivateKey: wallet.encrypted_private_key,
      encryptionIv: wallet.encryption_iv,
      encryptionTag: wallet.encryption_tag,
    });

    const tokenWalletAccount = privateKeyToAccount(tokenWalletPrivateKey);
    const gasFunderAccount = privateKeyToAccount(gasFunderPrivateKey);

    if (tokenWalletAccount.address.toLowerCase() !== wallet.address.toLowerCase()) {
      return json(500, {
        ok: false,
        error: "Decrypted private key does not match stored wallet address",
      });
    }

    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(bscRpcUrl),
    });

    const gasFunderClient = createWalletClient({
      account: gasFunderAccount,
      chain: bsc,
      transport: http(bscRpcUrl),
    });

    const tokenWalletClient = createWalletClient({
      account: tokenWalletAccount,
      chain: bsc,
      transport: http(bscRpcUrl),
    });

    const { data: createdTx, error: createTxError } = await supabaseAdmin
      .from("ric_sell_transactions")
      .insert({
        wallet_id: wallet.id,
        wallet_address: tokenWalletAccount.address,
        receiver_address: receiverAddress,
        token_address: ricTokenAddress,
        sell_percent: sellPercent,
        slippage_percent: slippagePercent,
        status: "started",
      })
      .select("id")
      .single();

    if (createTxError) {
      return json(500, {
        ok: false,
        error: createTxError.message,
      });
    }

    transactionId = createdTx.id;

    const [tokenBalanceRaw, tokenDecimals, tokenSymbol] = await Promise.all([
      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [tokenWalletAccount.address],
      }),
      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ]);

    if (tokenBalanceRaw <= BigInt(0)) {
      await updateSellTx(transactionId, {
        status: "failed",
        error_message: "Wallet has zero RIC balance",
      });

      return json(400, {
        ok: false,
        error: "Wallet has zero RIC balance",
      });
    }

    const amountToSellRaw = requestedTokenAmount
      ? parseUnits(requestedTokenAmount, tokenDecimals)
      : (tokenBalanceRaw * BigInt(Math.floor(sellPercent * 100))) /
        BigInt(10000);

    if (amountToSellRaw <= BigInt(0)) {
      await updateSellTx(transactionId, {
        status: "failed",
        error_message: "Calculated sell amount is zero",
      });

      return json(400, {
        ok: false,
        error: "Calculated sell amount is zero",
      });
    }

    if (amountToSellRaw > tokenBalanceRaw) {
      await updateSellTx(transactionId, {
        status: "failed",
        error_message: "Token amount exceeds wallet RIC balance",
      });

      return json(400, {
        ok: false,
        error: "Token amount exceeds wallet RIC balance",
        wallet: tokenWalletAccount.address,
        walletRicBalance: formatUnits(tokenBalanceRaw, tokenDecimals),
      });
    }

    await updateSellTx(transactionId, {
      token_symbol: tokenSymbol,
      token_decimals: tokenDecimals,
      token_balance_raw: tokenBalanceRaw.toString(),
      token_amount_sold_raw: amountToSellRaw.toString(),
      status: "funding_gas",
    });

    const topupAmount = await getBnbTopupAmount(publicClient);
    const currentBnbBalance = await publicClient.getBalance({
      address: tokenWalletAccount.address,
    });

    if (currentBnbBalance < topupAmount) {
      const amountToFund = topupAmount - currentBnbBalance;

      const gasFundingHash = await gasFunderClient.sendTransaction({
        to: tokenWalletAccount.address,
        value: amountToFund,
      });

      await updateSellTx(transactionId, {
        gas_funding_tx_hash: gasFundingHash,
      });

      await publicClient.waitForTransactionReceipt({
        hash: gasFundingHash,
        confirmations: 1,
      });
    }

    await updateSellTx(transactionId, {
      status: "approving",
    });

    const allowance = await publicClient.readContract({
      address: ricTokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [tokenWalletAccount.address, PANCAKE_V2_ROUTER],
    });

    if (allowance < amountToSellRaw) {
      const approvalHash = await tokenWalletClient.writeContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [PANCAKE_V2_ROUTER, amountToSellRaw],
      });

      await updateSellTx(transactionId, {
        approval_tx_hash: approvalHash,
      });

      await publicClient.waitForTransactionReceipt({
        hash: approvalHash,
        confirmations: 1,
      });
    }

    await updateSellTx(transactionId, {
      status: "swapping",
    });

    const quoteAmounts = (await publicClient.readContract({
      address: PANCAKE_V2_ROUTER,
      abi: routerAbi,
      functionName: "getAmountsOut",
      args: [amountToSellRaw, sellPath],
    })) as bigint[];

    const quotedUsdtOut = quoteAmounts[quoteAmounts.length - 1];
    const slippageBps = toBps(slippagePercent);
    const amountOutMin =
      (quotedUsdtOut * (BigInt(10000) - slippageBps)) / BigInt(10000);

    const usdtBalanceBefore = await publicClient.readContract({
      address: USDT_TOKEN.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [tokenWalletAccount.address],
    });

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

    const swapHash = await tokenWalletClient.writeContract({
      address: PANCAKE_V2_ROUTER,
      abi: routerAbi,
      functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      args: [
        amountToSellRaw,
        amountOutMin,
        sellPath,
        tokenWalletAccount.address,
        deadline,
      ],
    });

    await updateSellTx(transactionId, {
      swap_tx_hash: swapHash,
    });

    await publicClient.waitForTransactionReceipt({
      hash: swapHash,
      confirmations: 1,
    });

    await updateSellTx(transactionId, {
      status: "sending_usdt",
    });

    const usdtBalanceAfter = await publicClient.readContract({
      address: USDT_TOKEN.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [tokenWalletAccount.address],
    });

    const usdtReceived =
      usdtBalanceAfter > usdtBalanceBefore
        ? usdtBalanceAfter - usdtBalanceBefore
        : usdtBalanceAfter;

    if (usdtReceived <= BigInt(0)) {
      await updateSellTx(transactionId, {
        status: "failed",
        error_message: "No USDT received from swap",
      });

      return json(500, {
        ok: false,
        error: "No USDT received from swap",
      });
    }

    const usdtTransferHash = await tokenWalletClient.writeContract({
      address: USDT_TOKEN.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [receiverAddress, usdtReceived],
    });

    await updateSellTx(transactionId, {
      usdt_transfer_tx_hash: usdtTransferHash,
      usdt_sent_raw: usdtReceived.toString(),
      status: "sent_usdt",
    });

    await publicClient.waitForTransactionReceipt({
      hash: usdtTransferHash,
      confirmations: 1,
    });

    await updateSellTx(transactionId, {
      status: "completed",
    });

    return NextResponse.json({
      ok: true,
      usdtSent: formatUnits(usdtReceived, USDT_TOKEN.decimals),
      receivingAddress: receiverAddress,
      ricSold: formatUnits(amountToSellRaw, tokenDecimals),
      txId: usdtTransferHash,
      wallet: tokenWalletAccount.address,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sell RIC and send USDT";

    await updateSellTx(transactionId, {
      status: "failed",
      error_message: message,
    });

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

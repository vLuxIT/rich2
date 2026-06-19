import { NextResponse } from "next/server";
import {
  decodeFunctionData,
  formatUnits,
  getAddress,
  parseAbiItem,
} from "viem";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bscClient } from "@/lib/bscClient";
import { RICH_TOKEN, USDT_TOKEN } from "@/lib/token";
import {
  PANCAKE_V2_ROUTER,
  pancakeV2RouterAbi,
} from "@/lib/pancake";
import { sendRichReferralReward } from "@/lib/marketingWallet";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { buyer, referrer, txHash } = body;

    if (!buyer || !referrer || !txHash) {
      return NextResponse.json(
        { message: "buyer, referrer and txHash are required" },
        { status: 400 }
      );
    }

    const buyerAddress = getAddress(buyer);
    const referrerAddress = getAddress(referrer);
    const normalizedTxHash = txHash.toLowerCase();

    if (buyerAddress.toLowerCase() === referrerAddress.toLowerCase()) {
      return NextResponse.json(
        { message: "Self-referral is not allowed" },
        { status: 400 }
      );
    }

    const existingReward = await supabaseAdmin
      .from("referral_rewards")
      .select("id, status, reward_tx_hash")
      .eq("tx_hash", normalizedTxHash)
      .maybeSingle();

    if (existingReward.data) {
      return NextResponse.json({
        success: true,
        message: "Referral reward already processed",
        status: existingReward.data.status,
        rewardTxHash: existingReward.data.reward_tx_hash,
      });
    }

    const transaction = await bscClient.getTransaction({
      hash: txHash,
    });

    const receipt = await bscClient.getTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { message: "Transaction was not successful" },
        { status: 400 }
      );
    }

    if (
      transaction.to?.toLowerCase() !== PANCAKE_V2_ROUTER.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Transaction was not sent to PancakeSwap router" },
        { status: 400 }
      );
    }

    const decoded = decodeFunctionData({
      abi: pancakeV2RouterAbi,
      data: transaction.input,
    });

    const isSupportedSwap =
      decoded.functionName === "swapExactTokensForTokens" ||
      decoded.functionName ===
        "swapExactTokensForTokensSupportingFeeOnTransferTokens";

    if (!isSupportedSwap) {
      return NextResponse.json(
        { message: "Transaction is not a supported swap" },
        { status: 400 }
      );
    }

    const args = decoded.args as unknown as [
      bigint,
      bigint,
      readonly `0x${string}`[],
      `0x${string}`,
      bigint
    ];

    const path = args[2];
    const swapRecipient = getAddress(args[3]);

    if (swapRecipient.toLowerCase() !== buyerAddress.toLowerCase()) {
      return NextResponse.json(
        { message: "Swap recipient mismatch" },
        { status: 400 }
      );
    }

    const firstToken = path[0]?.toLowerCase();
    const lastToken = path[path.length - 1]?.toLowerCase();

    const isBuySwap =
      firstToken === USDT_TOKEN.address.toLowerCase() &&
      lastToken === RICH_TOKEN.address.toLowerCase();

    if (!isBuySwap) {
      return NextResponse.json(
        { message: "Referral rewards only apply to USDT → RIC buys" },
        { status: 400 }
      );
    }

    const richTransfersToBuyer = await bscClient.getLogs({
      address: RICH_TOKEN.address,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      args: {
        to: buyerAddress,
      },
    });

    const richReceivedRaw = richTransfersToBuyer
      .filter(
        (log) =>
          log.transactionHash.toLowerCase() === normalizedTxHash
      )
      .reduce((total, log) => {
        if (!log.args.value) return total;

        return total + log.args.value;
      }, BigInt(0));

    if (richReceivedRaw <= BigInt(0)) {
      return NextResponse.json(
        { message: "No RIC transfer to buyer found" },
        { status: 400 }
      );
    }

    const richReceived = Number(
      formatUnits(richReceivedRaw, RICH_TOKEN.decimals)
    );

    const rewardAmountRich = richReceived * 0.05;

    const { error: referralError } = await supabaseAdmin
      .from("referrals")
      .upsert(
        {
          buyer_wallet: buyerAddress.toLowerCase(),
          referrer_wallet: referrerAddress.toLowerCase(),
        },
        {
          onConflict: "buyer_wallet",
          ignoreDuplicates: true,
        }
      );

    if (referralError) {
      return NextResponse.json(
        { message: referralError.message },
        { status: 500 }
      );
    }

    const { data: insertedReward, error: insertError } = await supabaseAdmin
      .from("referral_rewards")
      .insert({
        tx_hash: normalizedTxHash,
        buyer_wallet: buyerAddress.toLowerCase(),
        referrer_wallet: referrerAddress.toLowerCase(),
        buy_amount_usdt: 0,
        reward_amount_rich: rewardAmountRich,
        status: "verified",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 }
      );
    }

    try {
      console.log("========== REFERRAL PAYOUT ==========");
      console.log("Buyer:", buyerAddress);
      console.log("Referrer:", referrerAddress);
      console.log("RIC Received:", richReceived);
      console.log("Reward Amount:", rewardAmountRich);
      console.log("Sending reward from marketing wallet...");

      const rewardTxHash = await sendRichReferralReward({
        to: referrerAddress,
        amountRich: rewardAmountRich,
      });

      console.log("Reward TX Hash:", rewardTxHash);

      const { error: updateError } = await supabaseAdmin
        .from("referral_rewards")
        .update({
          status: "paid",
          reward_tx_hash: rewardTxHash.toLowerCase(),
        })
        .eq("id", insertedReward.id);

      if (updateError) {
        return NextResponse.json(
          { message: updateError.message },
          { status: 500 }
        );
      }

      console.log("Referral reward marked as PAID");

      return NextResponse.json({
        success: true,
        message: "Referral reward verified and paid",
        richReceived,
        rewardAmountRich,
        rewardTxHash,
      });
    } catch (payoutError) {
      console.error("Referral payout error:", payoutError);

      await supabaseAdmin
        .from("referral_rewards")
        .update({
          status: "payout_failed",
        })
        .eq("id", insertedReward.id);

      return NextResponse.json(
        {
          success: false,
          message:
            "Referral verified and saved, but payout failed. Check marketing wallet balance and gas.",
          richReceived,
          rewardAmountRich,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Referral record error:", error);

    return NextResponse.json(
      { message: "Failed to verify and record referral" },
      { status: 500 }
    );
  }
}
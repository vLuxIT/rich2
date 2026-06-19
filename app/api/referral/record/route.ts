import { NextResponse } from "next/server";
import { formatUnits, getAddress, parseAbiItem } from "viem";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bscClient } from "@/lib/bscClient";
import { RICH_TOKEN, USDT_TOKEN } from "@/lib/token";
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

    const receipt = await bscClient.getTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { message: "Transaction was not successful" },
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
      .filter((log) => log.transactionHash.toLowerCase() === normalizedTxHash)
      .reduce((total, log) => total + (log.args.value ?? BigInt(0)), BigInt(0));

    if (richReceivedRaw <= BigInt(0)) {
      return NextResponse.json(
        { message: "No RIC transfer to buyer found" },
        { status: 400 }
      );
    }

    const usdtTransfersFromBuyer = await bscClient.getLogs({
      address: USDT_TOKEN.address,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      args: {
        from: buyerAddress,
      },
    });

    const usdtSpentRaw = usdtTransfersFromBuyer
      .filter((log) => log.transactionHash.toLowerCase() === normalizedTxHash)
      .reduce((total, log) => total + (log.args.value ?? BigInt(0)), BigInt(0));

    if (usdtSpentRaw <= BigInt(0)) {
      return NextResponse.json(
        { message: "No USDT transfer from buyer found" },
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

      const rewardTxHash = await sendRichReferralReward({
        to: referrerAddress,
        amountRich: rewardAmountRich,
      });

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
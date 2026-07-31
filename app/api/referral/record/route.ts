import { NextResponse } from "next/server";
import { formatUnits, getAddress, parseAbiItem } from "viem";

import { bscClient } from "@/lib/bscClient";
import { sendRichReferralReward } from "@/lib/marketingWallet";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { RICH_TOKEN, USDT_TOKEN } from "@/lib/token";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

type ReferralBody = {
  buyer?: string;
  referrer?: string;
  txHash?: `0x${string}`;
};

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown referral payout error";
}

export async function POST(request: Request) {
  try {
    const { buyer, referrer, txHash } =
      (await request.json()) as ReferralBody;

    if (!buyer || !referrer || !txHash) {
      return NextResponse.json(
        { success: false, message: "buyer, referrer and txHash are required" },
        { status: 400 },
      );
    }

    const buyerAddress = getAddress(buyer);
    const referrerAddress = getAddress(referrer);
    const normalizedTxHash = txHash.toLowerCase();

    if (buyerAddress.toLowerCase() === referrerAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Self-referral is not allowed" },
        { status: 400 },
      );
    }

    const { data: existingReward, error: existingError } =
      await supabaseAdmin
        .from("referral_rewards")
        .select("id, status, reward_tx_hash")
        .eq("tx_hash", normalizedTxHash)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, message: existingError.message },
        { status: 500 },
      );
    }

    if (existingReward?.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Referral reward already paid",
        status: "paid",
        rewardTxHash: existingReward.reward_tx_hash,
      });
    }

    if (
      existingReward?.status === "payout_submitted" &&
      existingReward.reward_tx_hash
    ) {
      const submittedHash =
        existingReward.reward_tx_hash as `0x${string}`;

      try {
        const submittedReceipt =
          await bscClient.getTransactionReceipt({ hash: submittedHash });

        if (submittedReceipt.status === "success") {
          await supabaseAdmin
            .from("referral_rewards")
            .update({ status: "paid" })
            .eq("id", existingReward.id);

          return NextResponse.json({
            success: true,
            message: "Referral payout confirmed",
            status: "paid",
            rewardTxHash: submittedHash,
          });
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Referral payout is still awaiting confirmation",
            status: "payout_submitted",
            rewardTxHash: submittedHash,
          },
          { status: 202 },
        );
      }
    }

    const receipt = await bscClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { success: false, message: "Transaction was not successful" },
        { status: 400 },
      );
    }

    const richLogs = await bscClient.getLogs({
      address: RICH_TOKEN.address,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      args: { to: buyerAddress },
    });

    const richReceivedRaw = richLogs
      .filter(
        (log) => log.transactionHash.toLowerCase() === normalizedTxHash,
      )
      .reduce((total, log) => total + (log.args.value ?? BigInt(0)), BigInt(0));

    if (richReceivedRaw <= BigInt(0)) {
      return NextResponse.json(
        { success: false, message: "No RIC transfer to buyer found" },
        { status: 400 },
      );
    }

    const usdtLogs = await bscClient.getLogs({
      address: USDT_TOKEN.address,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      args: { from: buyerAddress },
    });

    const usdtSpentRaw = usdtLogs
      .filter(
        (log) => log.transactionHash.toLowerCase() === normalizedTxHash,
      )
      .reduce((total, log) => total + (log.args.value ?? BigInt(0)), BigInt(0));

    if (usdtSpentRaw <= BigInt(0)) {
      return NextResponse.json(
        { success: false, message: "No USDT transfer from buyer found" },
        { status: 400 },
      );
    }

    const rewardAmountRaw = (richReceivedRaw * BigInt(5)) / BigInt(100);

    if (rewardAmountRaw <= BigInt(0)) {
      return NextResponse.json(
        { success: false, message: "Calculated reward is zero" },
        { status: 400 },
      );
    }

    const richReceived = formatUnits(
      richReceivedRaw,
      RICH_TOKEN.decimals,
    );
    const rewardAmountRich = formatUnits(
      rewardAmountRaw,
      RICH_TOKEN.decimals,
    );
    const buyAmountUsdt = formatUnits(
      usdtSpentRaw,
      USDT_TOKEN.decimals,
    );

    const { error: referralError } =
      await supabaseAdmin.from("referrals").upsert(
        {
          buyer_wallet: buyerAddress.toLowerCase(),
          referrer_wallet: referrerAddress.toLowerCase(),
        },
        { onConflict: "buyer_wallet", ignoreDuplicates: true },
      );

    if (referralError) {
      return NextResponse.json(
        { success: false, message: referralError.message },
        { status: 500 },
      );
    }

    let rewardId: string;

    if (existingReward) {
      rewardId = existingReward.id;

      const { error } = await supabaseAdmin
        .from("referral_rewards")
        .update({
          status: "payout_pending",
          reward_tx_hash: null,
          buy_amount_usdt: buyAmountUsdt,
          reward_amount_rich: rewardAmountRich,
        })
        .eq("id", rewardId);

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 },
        );
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("referral_rewards")
        .insert({
          tx_hash: normalizedTxHash,
          buyer_wallet: buyerAddress.toLowerCase(),
          referrer_wallet: referrerAddress.toLowerCase(),
          buy_amount_usdt: buyAmountUsdt,
          reward_amount_rich: rewardAmountRich,
          status: "payout_pending",
        })
        .select("id")
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            message: error?.message ?? "Unable to create referral reward",
          },
          { status: 500 },
        );
      }

      rewardId = data.id;
    }

    try {
      const payout = await sendRichReferralReward({
        to: referrerAddress,
        amountRaw: rewardAmountRaw,
        onSubmitted: async (hash) => {
          const { error } = await supabaseAdmin
            .from("referral_rewards")
            .update({
              status: "payout_submitted",
              reward_tx_hash: hash.toLowerCase(),
            })
            .eq("id", rewardId);

          if (error) {
            throw new Error(
              `Payout broadcast but transaction hash could not be saved: ${error.message}`,
            );
          }
        },
      });

      const { error: paidError } = await supabaseAdmin
        .from("referral_rewards")
        .update({
          status: "paid",
          reward_tx_hash: payout.hash.toLowerCase(),
        })
        .eq("id", rewardId);

      if (paidError) {
        throw new Error(
          `Payout confirmed but paid status could not be saved: ${paidError.message}`,
        );
      }

      return NextResponse.json({
        success: true,
        message: "Referral reward verified and paid",
        richReceived,
        buyAmountUsdt,
        rewardAmountRich,
        rewardTxHash: payout.hash,
        payoutBlock: payout.blockNumber.toString(),
      });
    } catch (payoutError: unknown) {
      const payoutMessage = messageFromError(payoutError);

      console.error("========== REFERRAL ROUTE ERROR ==========");
      console.error(payoutMessage);
      console.dir(payoutError, { depth: null });

      await supabaseAdmin
        .from("referral_rewards")
        .update({ status: "payout_failed" })
        .eq("id", rewardId)
        .is("reward_tx_hash", null);

      return NextResponse.json(
        {
          success: false,
          message: payoutMessage,
          richReceived,
          buyAmountUsdt,
          rewardAmountRich,
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error("Referral record error:", error);
    console.dir(error, { depth: null });

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify and record referral",
      },
      { status: 500 },
    );
  }
}

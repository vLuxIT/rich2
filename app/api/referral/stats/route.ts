import { NextResponse } from "next/server";
import { formatUnits } from "viem";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bscClient } from "@/lib/bscClient";
import { RICH_TOKEN } from "@/lib/token";
import { erc20Abi } from "@/lib/erc20Abi";
import { marketingAccount } from "@/lib/marketingWallet";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { message: "Wallet address is required" },
        { status: 400 }
      );
    }

    const normalizedWallet = wallet.toLowerCase();

    const { data: rewards, error: rewardsError } = await supabaseAdmin
      .from("referral_rewards")
      .select("buyer_wallet, reward_amount_rich")
      .eq("referrer_wallet", normalizedWallet);

    if (rewardsError) {
      return NextResponse.json(
        { message: rewardsError.message },
        { status: 500 }
      );
    }

    const uniqueBuyers = new Set(
      (rewards || []).map((reward) => reward.buyer_wallet)
    );

    const referralCount = uniqueBuyers.size;

    const earnedRich = (rewards || []).reduce((total, reward) => {
      return total + Number(reward.reward_amount_rich || 0);
    }, 0);

    const marketingBalanceRaw = await bscClient.readContract({
      address: RICH_TOKEN.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [marketingAccount.address],
    });

    const rewardsLeftRich = Number(
      formatUnits(marketingBalanceRaw, RICH_TOKEN.decimals)
    );

    return NextResponse.json({
      referralCount,
      earnedRich,
      rewardsLeftRich,
    });
  } catch (error) {
    console.error("Referral stats error:", error);

    return NextResponse.json(
      { message: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
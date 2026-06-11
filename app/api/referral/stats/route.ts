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

    const { count: referralCount } = await supabaseAdmin
      .from("referrals")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("referrer_wallet", normalizedWallet);

    const { data: rewards } = await supabaseAdmin
      .from("referral_rewards")
      .select("reward_amount_rich")
      .eq("referrer_wallet", normalizedWallet);

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
      referralCount: referralCount || 0,
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
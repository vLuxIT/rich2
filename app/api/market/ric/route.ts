import { NextResponse } from "next/server";

const DEFAULT_RIC_PAIR = "0x63c641009b55cf4efdc8fece63a1e75471b3e6fe";

export async function GET() {
  try {
    const chainId = process.env.RIC_DEXSCREENER_CHAIN || "bsc";
    const pairAddress = process.env.RIC_DEXSCREENER_PAIR || DEFAULT_RIC_PAIR;

    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}`,
      {
        next: {
          revalidate: 30,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch RIC market data",
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const pair = data?.pairs?.[0];

    if (!pair) {
      return NextResponse.json(
        {
          ok: false,
          error: "RIC pair not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      priceUsd: Number(pair.priceUsd || 0),
      change24h: Number(pair.priceChange?.h24 || 0),
      liquidityUsd: Number(pair.liquidity?.usd || 0),
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected RIC market error",
      },
      { status: 500 }
    );
  }
}
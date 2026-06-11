"use client";

import Link from "next/link";
import SwapCard from "./SwapCard";

export default function ExchangePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center bg-[#0F1117] text-white">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-[#FFF4B0] via-[#FFD700] to-[#D4AF37] bg-clip-text text-5xl font-semibold text-transparent">
          RichCoin Dex
        </h1>

        <p className="mt-4 text-lg text-zinc-400">
          Exchange RIC token instantly on Binance Smart Chain.
        </p>
      </div>

      <div className="mb-4 w-full max-w-[440px]">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/buy-usdt"
            className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-center text-sm font-medium transition hover:border-yellow-400"
          >
            Buy USDT
          </Link>

          <Link
            href="/sell-usdt"
            className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-center text-sm font-medium transition hover:border-yellow-400"
          >
            Sell USDT
          </Link>
        </div>
      </div>

      <SwapCard />
    </div>
  );
}
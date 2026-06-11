"use client";

import Link from "next/link";
import SwapCard from "./SwapCard";

export default function ExchangePage() {
  return (
    <div className="mx-auto flex w-full flex-col items-center">
      {/* Heading */}

      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-[#FFF4B0] via-[#FFD700] to-[#D4AF37] bg-clip-text text-5xl font-semibold text-transparent">
          Swap RichCoin
        </h1>

        <p className="mt-4 text-lg text-zinc-400">
          Exchange RC token instantly on BNB Smart Chain.
        </p>
      </div>

      {/* Buy / Sell Buttons */}

      <div className="mb-4 w-full max-w-[440px]">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/buy-usdt"
            className="rounded-xl border border-zinc-800 bg-[#15171d] py-2 text-center text-sm font-medium text-zinc-100 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Buy USDT
          </Link>

          <Link
            href="/sell-usdt"
            className="rounded-xl border border-zinc-800 bg-[#15171d] py-2 text-center text-sm font-medium text-zinc-100 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            Sell USDT
          </Link>
        </div>
      </div>

      {/* Swap Card */}

      <SwapCard />
    </div>
  );
}
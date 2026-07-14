"use client";

import { LockKeyhole } from "lucide-react";

import { formatCompactUsd, useRicMarket } from "@/hooks/useRicMarket";

export default function RicLiquidityPoolCard() {
  const { data, isLoading } = useRicMarket();

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#10131A] p-3 md:border-white/5 md:bg-[#0D1118] md:p-4">
      <div className="flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10 text-[10px] font-black text-[#FFC928] md:h-7 md:w-7 md:text-xs">
          R
        </span>

        <p className="max-w-[115px] text-[11px] leading-4 text-[#A4AAB7] md:max-w-none md:text-sm md:leading-5">
          Richcoin Liquidity Pool
        </p>
      </div>

      <p className="mt-4 text-[19px] font-bold text-white md:mt-5 md:text-2xl">
        {isLoading && !data ? "Loading..." : formatCompactUsd(data?.liquidityUsd)}
      </p>

      <p className="mt-1 text-[11px] font-medium text-[#19C46B] md:text-xs">
        Locked for stability
      </p>

      <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
        <LockKeyhole
          size={36}
          className="text-[#FFC928] md:h-[42px] md:w-[42px]"
        />
      </div>
    </div>
  );
}
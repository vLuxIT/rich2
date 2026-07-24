"use client";

import { ArrowUpRight } from "lucide-react";

import { formatRstUsd, useRstMarket } from "@/hooks/useRstMarket";

export default function RstTopPricePill() {
  const { priceUsd, isLoading } = useRstMarket();

  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1250FF] text-[11px] font-black text-white">
        RST
      </span>

      <span className="text-sm font-semibold text-[#A4AAB7]">RST Price</span>

      <span className="text-base font-black text-white">
        {isLoading && priceUsd === null ? "Loading..." : formatRstUsd(priceUsd)}
      </span>

      <span className="inline-flex items-center gap-1 text-sm font-black text-[#19C46B]">
        Live
        <ArrowUpRight size={15} />
      </span>
    </div>
  );
}

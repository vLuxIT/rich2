"use client";

import { useRicMarket, formatPercent, formatUsd } from "@/hooks/useRicMarket";

export default function RicTopPricePill() {
  const { data, isLoading } = useRicMarket();

  const change = data?.change24h ?? 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center gap-2 border-r border-white/10 px-4">
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10 text-xs font-black text-[#FFC928]">
        R
      </span>

      <span className="text-xs text-[#A4AAB7]">RIC Price</span>

      <span className="text-sm font-bold text-white">
        {isLoading && !data ? "Loading..." : formatUsd(data?.priceUsd)}
      </span>

      <span
        className={[
          "text-xs font-semibold",
          isPositive ? "text-[#19C46B]" : "text-[#EF4444]",
        ].join(" ")}
      >
        {formatPercent(data?.change24h)} {isPositive ? "↗" : "↘"}
      </span>
    </div>
  );
}
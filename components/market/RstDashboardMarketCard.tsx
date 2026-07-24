"use client";

import { formatRstUsd, useRstMarket } from "@/hooks/useRstMarket";

function MiniChart() {
  return (
    <svg viewBox="0 0 160 54" className="h-10 w-full">
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke="#1749E8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke="#1749E8"
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RstDashboardMarketCard() {
  const { priceUsd, isLoading } = useRstMarket();

  return (
    <div className="rounded-xl border border-white/5 bg-[#0D1118] p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#123DDB] text-[9px] font-black text-white">
          RST
        </span>
        <span className="text-sm text-[#A4AAB7]">RST Price</span>
      </div>

      <div className="mt-4 grid grid-cols-[auto,1fr] items-end gap-4">
        <div>
          <p className="text-2xl font-bold text-white">
            {isLoading && priceUsd === null ? "Loading..." : formatRstUsd(priceUsd)}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#19C46B]">Live</p>
        </div>

        <MiniChart />
      </div>
    </div>
  );
}

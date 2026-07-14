"use client";

import { useRicMarket, formatPercent, formatUsd } from "@/hooks/useRicMarket";

function MiniChart({ isPositive }: { isPositive: boolean }) {
  return (
    <svg viewBox="0 0 160 54" className="h-10 w-full md:h-14">
      <path
        d={
          isPositive
            ? "M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
            : "M4 14 L14 22 L22 18 L31 30 L41 26 L50 34 L58 27 L69 32 L78 31 L88 38 L97 34 L107 41 L117 37 L127 43 L137 39 L150 46"
        }
        fill="none"
        stroke={isPositive ? "#19C46B" : "#EF4444"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={
          isPositive
            ? "M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
            : "M4 14 L14 22 L22 18 L31 30 L41 26 L50 34 L58 27 L69 32 L78 31 L88 38 L97 34 L107 41 L117 37 L127 43 L137 39 L150 46"
        }
        fill="none"
        stroke={isPositive ? "#19C46B" : "#EF4444"}
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RicDashboardMarketCard() {
  const { data, isLoading } = useRicMarket();

  const change = data?.change24h ?? 0;
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#10131A] p-3 md:border-white/5 md:bg-[#0D1118] md:p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10 text-[10px] font-black text-[#FFC928] md:h-7 md:w-7 md:text-xs">
          R
        </span>

        <span className="text-[11px] text-[#A4AAB7] md:text-sm">RIC Price</span>
      </div>

      <div className="mt-3 grid grid-cols-[auto,1fr] items-end gap-2 md:mt-4 md:gap-4">
        <div>
          <p className="text-[19px] font-bold text-white md:text-2xl">
            {isLoading && !data ? "Loading..." : formatUsd(data?.priceUsd)}
          </p>

          <p
            className={[
              "mt-1 text-[12px] font-semibold md:text-sm",
              isPositive ? "text-[#19C46B]" : "text-[#EF4444]",
            ].join(" ")}
          >
            {formatPercent(data?.change24h)} {isPositive ? "↗" : "↘"}
          </p>
        </div>

        <MiniChart isPositive={isPositive} />
      </div>
    </div>
  );
}
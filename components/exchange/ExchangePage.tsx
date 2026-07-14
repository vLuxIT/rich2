"use client";

import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  History,
  LockKeyhole,
  ShieldCheck,
  Zap,
} from "lucide-react";

import RicDashboardMarketCard from "@/components/market/RicDashboardMarketCard";
import RicLiquidityPoolCard from "@/components/market/RicLiquidityPoolCard";
import SwapCard from "./SwapCard";

const benefits = [
  {
    title: "Secure",
    text: "Your funds are protected",
    icon: ShieldCheck,
  },
  {
    title: "Fast",
    text: "Instant swaps in seconds",
    icon: Zap,
  },
  {
    title: "Best Rates",
    text: "Get the best market prices",
    icon: BarChart3,
  },
  {
    title: "Low Fees",
    text: "Low trading fees always",
    icon: CircleDollarSign,
  },
];

const popularPairs = [
  {
    pair: "RIC / USDT",
    volume: "Volume $186.72K",
    price: "0.04235",
    change: "+5.62%",
    chart: "green",
    icons: ["ric", "usdt"],
  },
  {
    pair: "RST / USDT",
    volume: "Volume $95.43K",
    price: "1.000",
    change: "+1.35%",
    chart: "blue",
    icons: ["rst", "usdt"],
  },
  {
    pair: "RIC / RST",
    volume: "Volume $42.18K",
    price: "0.0421",
    change: "+3.21%",
    chart: "purple",
    icons: ["ric", "rst"],
  },
];

function MiniChart({ variant }: { variant: "green" | "blue" | "purple" }) {
  const stroke =
    variant === "green"
      ? "#19C46B"
      : variant === "blue"
        ? "#1749E8"
        : "#8B5CF6";

  return (
    <svg viewBox="0 0 160 54" className="h-10 w-full">
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RstPriceCard() {
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
          <p className="text-2xl font-bold text-white">$1.00</p>
          <p className="mt-1 text-sm font-semibold text-[#19C46B]">+1.35% ↗</p>
        </div>

        <MiniChart variant="blue" />
      </div>
    </div>
  );
}

function RstPoolCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0D1118] p-4">
      <div className="flex items-start gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#123DDB] text-[9px] font-black text-white">
          RST
        </span>

        <p className="text-sm leading-5 text-[#A4AAB7]">
          Total RST Redemption Pool
        </p>
      </div>

      <p className="mt-5 text-2xl font-bold text-white">$2,450,000</p>
      <p className="mt-1 text-xs font-medium text-[#19C46B]">
        Growing every day
      </p>

      <div className="absolute bottom-4 right-4 text-[#123DDB]">
        <CoinsIcon />
      </div>
    </div>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none">
      <ellipse cx="24" cy="11" rx="13" ry="6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 11v18c0 3.3 5.8 6 13 6s13-2.7 13-6V11" stroke="currentColor" strokeWidth="3" />
      <path d="M11 20c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 29c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function PairIcon({ type }: { type: string }) {
  if (type === "usdt") {
    return (
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#18B96F]">
        <Image src="/usdt.png" alt="USDT" width={22} height={22} />
      </span>
    );
  }

  if (type === "rst") {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#123DDB] text-[9px] font-black text-white">
        RST
      </span>
    );
  }

  return (
    <span className="relative grid h-8 w-8 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10">
      <Image src="/rc.png" alt="RIC" fill sizes="32px" className="object-contain p-1" />
    </span>
  );
}

function PopularPairsPanel({ mobile = false }: { mobile?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Popular Pairs</h2>

        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FFC928]"
        >
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-white/10">
        {popularPairs.map((pair) => (
          <div
            key={pair.pair}
            className="grid grid-cols-[1fr_auto_88px] items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center">
              <div className="relative mr-3 flex w-12 shrink-0 items-center">
                <PairIcon type={pair.icons[0]} />
                <span className="absolute left-5">
                  <PairIcon type={pair.icons[1]} />
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {pair.pair}
                </p>
                <p className="truncate text-[11px] text-[#A4AAB7]">
                  {pair.volume}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-white">{pair.price}</p>
              <p className="text-xs font-semibold text-[#19C46B]">
                {pair.change}
              </p>
            </div>

            <MiniChart variant={pair.chart as "green" | "blue" | "purple"} />
          </div>
        ))}
      </div>
    </section>
  );
}

function RightExchangePanel() {
  return (
    <aside className="hidden space-y-3 lg:block">
      <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Market Overview</h2>

          <button className="rounded-lg bg-[#070A10] px-3 py-1.5 text-xs font-semibold text-[#B7BBC6]">
            24H⌄
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <RicDashboardMarketCard />
          <RstPriceCard />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
        <h2 className="mb-4 text-base font-bold text-white">Ecosystem Pools</h2>

        <div className="grid gap-3">
          <RstPoolCard />
          <RicLiquidityPoolCard />
        </div>
      </section>

      <PopularPairsPanel />
    </aside>
  );
}

export default function ExchangePage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white md:text-3xl">
                Exchange
              </h1>
              <p className="mt-1 text-sm text-[#A4AAB7] md:text-base">
                Trade tokens instantly and securely
              </p>
            </div>

            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#10131A] px-4 text-sm font-bold text-white transition hover:border-[#FFC928]/40"
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>

          <div className="w-full">
            <SwapCard />
          </div>

          <section className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 bg-[#10131A]">
            {benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={[
                    "flex min-h-[108px] flex-col items-center justify-center px-2 py-4 text-center",
                    index !== 0 ? "border-l border-white/10" : "",
                  ].join(" ")}
                >
                  <Icon size={26} className="text-[#FFC928]" />

                  <p className="mt-2 text-xs font-bold text-white md:text-sm">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-[#A4AAB7] md:text-xs">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </section>

          <div className="lg:hidden">
            <PopularPairsPanel mobile />
          </div>
        </section>

        <RightExchangePanel />
      </div>
    </div>
  );
}

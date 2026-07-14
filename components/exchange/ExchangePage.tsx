"use client";

import {
  BarChart3,
  CircleDollarSign,
  History,
  ShieldCheck,
  Zap,
} from "lucide-react";

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

export default function ExchangePage() {
  return (
    <div className="space-y-4">
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

      <div className="mx-auto w-full max-w-2xl">
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
    </div>
  );
}

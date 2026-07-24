"use client";

import Image from "next/image";
import { formatUnits } from "viem";
import Link from "next/link";
import { useReadContract } from "wagmi";
import {
  ArrowRight,
  Droplets,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import RicDashboardMarketCard from "@/components/market/RicDashboardMarketCard";
import RstDashboardMarketCard from "@/components/market/RstDashboardMarketCard";
import RicLiquidityPoolCard from "@/components/market/RicLiquidityPoolCard";
import { RST_TREASURY_ADDRESS, rstTreasuryAbi } from "@/lib/rstContracts";
import HeroSlider from "./HeroSlider";

const actionCards = [
  {
    title: "Buy USDT",
    subtitle: "Buy USDT instantly",
    href: "/buy-usdt",
    type: "usdt-buy",
    color: "green",
  },
  {
    title: "Sell USDT",
    subtitle: "Sell USDT instantly",
    href: "/sell-usdt",
    type: "usdt-sell",
    color: "red",
  },
  {
    title: "Stake RIC",
    subtitle: "Earn rewards by staking",
    href: "/staking",
    type: "ric",
    color: "gold",
  },
  {
    title: "Revenue Share Token (RST)",
    subtitle: "Own a share of our success",
    href: "/rst",
    type: "rst",
    color: "blue",
  },
  {
    title: "Liquidity Providers",
    subtitle: "Add liquidity and earn",
    href: "/liquidity-providers",
    type: "liquidity",
    color: "purple",
  },
  {
    title: "Referral",
    subtitle: "Invite and earn rewards",
    href: "/referral",
    type: "referral",
    color: "orange",
  },
];

const featureCards = [
  {
    icon: ShieldCheck,
    title: "Secure",
    text: "Built on Binance Smart Chain",
  },
  {
    icon: Zap,
    title: "Fast",
    text: "Low fees and high speed",
  },
  {
    icon: TrendingUp,
    title: "Rewarding",
    text: "Multiple ways to earn more",
  },
  {
    icon: Globe2,
    title: "Accessible",
    text: "For everyone, anywhere",
  },
];

function MiniChart({ variant }: { variant: "green" | "blue" }) {
  return (
    <svg viewBox="0 0 160 54" className="h-10 w-full md:h-14">
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke={variant === "green" ? "#19C46B" : "#1749E8"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 42 L14 32 L22 37 L31 25 L41 30 L50 26 L58 35 L69 31 L78 33 L88 21 L97 27 L107 19 L117 23 L127 13 L137 18 L150 8"
        fill="none"
        stroke={variant === "green" ? "#19C46B" : "#1749E8"}
        strokeOpacity="0.25"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TokenIcon({ type }: { type: string }) {
  if (type === "usdt-buy" || type === "usdt-sell") {
    return (
      <div
        className={[
          "relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full md:h-14 md:w-14",
          type === "usdt-buy" ? "bg-[#18B96F]" : "bg-[#DF2D37]",
        ].join(" ")}
      >
        <Image
          src="/usdt.png"
          alt="USDT"
          width={34}
          height={34}
          className="object-contain md:h-[42px] md:w-[42px]"
        />
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#10131A] bg-white/25 md:h-4 md:w-4" />
      </div>
    );
  }

  if (type === "ric") {
    return (
      <div className="relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border border-[#FFC928]/70 bg-[#FFC928]/10 md:h-14 md:w-14">
        <Image
          src="/rc.png"
          alt="RIC"
          fill
          sizes="58px"
          className="object-contain p-1"
        />
      </div>
    );
  }

  if (type === "rst") {
    return (
      <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full bg-[#123DDB] text-[20px] font-black text-white md:h-14 md:w-14 md:text-lg">
        RST
      </div>
    );
  }

  if (type === "liquidity") {
    return (
      <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full bg-[#6B32D8] text-white md:h-14 md:w-14">
        <Droplets size={28} className="md:h-8 md:w-8" />
      </div>
    );
  }

  return (
    <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full bg-[#F07B13] text-white md:h-14 md:w-14">
      <Users size={28} className="md:h-8 md:w-8" />
    </div>
  );
}

function ActionCard({ card }: { card: (typeof actionCards)[number] }) {
  const arrowColor =
    card.color === "green"
      ? "text-[#19C46B] bg-[#19C46B]/10"
      : card.color === "red"
        ? "text-[#DF2D37] bg-[#DF2D37]/10"
        : card.color === "blue"
          ? "text-[#1250FF] bg-[#1250FF]/10"
          : card.color === "purple"
            ? "text-[#7D4DFF] bg-[#7D4DFF]/10"
            : card.color === "orange"
              ? "text-[#F07B13] bg-[#F07B13]/10"
              : "text-[#FFC928] bg-[#FFC928]/10";

  return (
    <Link
      href={card.href}
      className="group flex min-h-[126px] flex-col items-center justify-center rounded-xl border border-white/10 bg-[#10131A] p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[#FFC928]/40 md:min-h-[86px] md:flex-row md:justify-between md:p-4 md:text-left"
    >
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
        <TokenIcon type={card.type} />

        <div>
          <h3 className="text-[14px] font-bold leading-[1.15] text-white md:text-base">
            {card.title}
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-[#A4AAB7] md:mt-1 md:text-xs">
            {card.subtitle}
          </p>
        </div>
      </div>

      <div
        className={[
          "hidden h-9 w-9 place-items-center rounded-full transition group-hover:translate-x-1 md:grid",
          arrowColor,
        ].join(" ")}
      >
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}

function MarketCard({
  title,
  value,
  change,
  chart,
}: {
  title: string;
  value: string;
  change: string;
  chart: "green" | "blue";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#10131A] p-3 md:border-white/5 md:bg-[#0D1118] md:p-4">
      <div className="flex items-center gap-2">
        {chart === "green" ? (
          <span className="grid h-6 w-6 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10 text-[10px] font-black text-[#FFC928] md:h-7 md:w-7 md:text-xs">
            R
          </span>
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#123DDB] text-[8px] font-black text-white md:h-7 md:w-7 md:text-[9px]">
            RST
          </span>
        )}

        <span className="text-[11px] text-[#A4AAB7] md:text-sm">{title}</span>
      </div>

      <div className="mt-3 grid grid-cols-[auto,1fr] items-end gap-2 md:mt-4 md:gap-4">
        <div>
          <p className="text-[19px] font-bold text-white md:text-2xl">{value}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#19C46B] md:text-sm">
            {change} ↗
          </p>
        </div>

        <MiniChart variant={chart} />
      </div>
    </div>
  );
}

function PoolCard({
  type,
  title,
  value,
  subtitle,
}: {
  type: "rst" | "ric";
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#10131A] p-3 md:border-white/5 md:bg-[#0D1118] md:p-4">
      <div className="flex items-start gap-2">
        {type === "rst" ? (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#123DDB] text-[8px] font-black text-white md:h-7 md:w-7 md:text-[9px]">
            RST
          </span>
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#FFC928]/50 bg-[#FFC928]/10 text-[10px] font-black text-[#FFC928] md:h-7 md:w-7 md:text-xs">
            R
          </span>
        )}

        <p className="max-w-[115px] text-[11px] leading-4 text-[#A4AAB7] md:max-w-none md:text-sm md:leading-5">
          {title}
        </p>
      </div>

      <p className="mt-4 text-[19px] font-bold text-white md:mt-5 md:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-[#19C46B] md:text-xs">
        {subtitle}
      </p>

      <div className="absolute bottom-3 right-3 text-[#123DDB] md:bottom-4 md:right-4">
        {type === "rst" ? (
          <CoinsIcon />
        ) : (
          <LockKeyhole size={36} className="text-[#FFC928] md:h-[42px] md:w-[42px]" />
        )}
      </div>
    </div>
  );
}

function formatRedemptionPoolUsd(value?: bigint) {
  if (value === undefined) return "$0.00";

  const one18 = BigInt("1000000000000000000");
  const one6 = BigInt("1000000");

  let numeric: number;

  if (value >= one18) {
    numeric = Number(formatUnits(value, 18));
  } else if (value >= one6) {
    numeric = Number(formatUnits(value, 6));
  } else {
    numeric = Number(value);
  }

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
}

function RstRedemptionPoolCard() {
  const { data: redemptionPool, isLoading } = useReadContract({
    address: RST_TREASURY_ADDRESS,
    abi: rstTreasuryAbi,
    functionName: "redemptionPoolBalance",
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#10131A] p-3 md:border-white/5 md:bg-[#0D1118] md:p-4">
      <div className="flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#123DDB] text-[8px] font-black text-white md:h-7 md:w-7 md:text-[9px]">
          RST
        </span>

        <p className="max-w-[115px] text-[11px] leading-4 text-[#A4AAB7] md:max-w-none md:text-sm md:leading-5">
          Total RST Redemption Pool
        </p>
      </div>

      <p className="mt-4 break-words text-[19px] font-bold leading-tight text-white md:mt-5 md:text-2xl">
        {isLoading && redemptionPool === undefined
          ? "Loading..."
          : formatRedemptionPoolUsd(redemptionPool as bigint | undefined)}
      </p>
      <p className="mt-1 text-[11px] font-medium text-[#19C46B] md:text-xs">
        Live
      </p>

      <div className="absolute bottom-3 right-3 text-[#123DDB] md:bottom-4 md:right-4">
        <CoinsIcon />
      </div>
    </div>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 md:h-12 md:w-12" fill="none">
      <ellipse cx="24" cy="11" rx="13" ry="6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 11v18c0 3.3 5.8 6 13 6s13-2.7 13-6V11" stroke="currentColor" strokeWidth="3" />
      <path d="M11 20c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 29c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export default function HomeDashboard() {
  return (
    <div className="space-y-3 md:space-y-4">
      <HeroSlider />

      <section className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-3">
        {actionCards.map((card) => (
          <ActionCard key={card.title} card={card} />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-2 lg:hidden">
        <RicDashboardMarketCard />

        <RstDashboardMarketCard />

        <RstRedemptionPoolCard />

        <RicLiquidityPoolCard />
      </section>

      <section className="hidden gap-3 lg:grid lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-[#10131A] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Market Overview</h2>
            <button className="rounded-lg bg-[#070A10] px-3 py-1.5 text-xs font-semibold text-[#B7BBC6]">
              24H⌄
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <RicDashboardMarketCard />

            <RstDashboardMarketCard />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#10131A] p-4">
          <h2 className="mb-4 text-base font-bold text-white">Ecosystem Pools</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <PoolCard
              type="rst"
              title="Total RST Redemption Pool"
              value="$2,450,000"
              subtitle="Growing every day"
            />

            <RicLiquidityPoolCard />
          </div>
        </div>
      </section>

      <section className="hidden rounded-xl border border-white/10 bg-[#10131A] p-4 lg:grid lg:grid-cols-4">
        {featureCards.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={[
                "flex items-center gap-4 px-4",
                index !== 0 ? "border-l border-white/10" : "",
              ].join(" ")}
            >
              <Icon size={30} className="text-[#A4AAB7]" />
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="text-xs leading-4 text-[#A4AAB7]">{item.text}</p>
              </div>
            </div>
          );
        })}
      </section>

      <footer className="hidden items-center justify-between border-t border-white/10 pt-3 text-[11px] text-[#7E8494] lg:flex">
        <span>© 2025 Richlance DEX. All rights reserved.</span>
        <span className="text-[#B7BBC6]">Built on Binance Smart Chain</span>
        <div className="flex gap-8">
          <span>Docs</span>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}

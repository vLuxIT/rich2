"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Gift,
  HelpCircle,
  Link as LinkIcon,
  ShieldCheck,
  Share2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useAccount } from "wagmi";

function formatRich(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 3,
  });
}

function ReferralHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] px-5 py-5 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
      <div className="absolute right-0 top-0 hidden h-full w-1/2 bg-[radial-gradient(circle_at_70%_45%,rgba(255,201,40,0.20),transparent_45%)] lg:block" />

      <div className="relative z-10 flex items-start gap-4">
        <Link
          href="/"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0B0E14] text-white lg:hidden"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="hidden h-9 w-9 place-items-center rounded-full bg-[#FFC928]/12 text-[#FFC928] lg:grid">
              <Users size={21} />
            </span>

            <h1 className="text-xl font-black text-white md:text-2xl">
              Referral Program
            </h1>
          </div>

          <p className="mt-2 max-w-md text-xs leading-5 text-[#A4AAB7] md:text-sm md:leading-6">
            Earn 5% rewards in RIC when users buy RichCoin through your referral
            link.
          </p>
        </div>

        <div className="absolute right-0 top-1/2 hidden h-32 w-72 -translate-y-1/2 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_50%,rgba(255,201,40,0.24),transparent_48%)]" />
          <div className="absolute right-12 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#FFC928]/10 blur-2xl" />
          <div className="absolute right-20 top-1/2 h-24 w-24 -translate-y-1/2">
            <Image src="/rc.png" alt="RichCoin" fill sizes="96px" className="object-contain" />
          </div>
          <Gift className="absolute right-36 top-7 text-[#FFC928]" size={34} />
        </div>

        <div className="absolute right-0 top-1/2 h-24 w-36 -translate-y-1/2 lg:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_50%,rgba(255,201,40,0.20),transparent_50%)]" />
          <Image
            src="/rc.png"
            alt="RichCoin"
            fill
            sizes="144px"
            className="object-contain object-right"
          />
        </div>
      </div>
    </section>
  );
}

function RewardsCard({
  value,
  loading,
}: {
  value: number;
  loading: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,201,40,0.08),transparent_65%)]" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-xs text-[#A4AAB7] md:text-sm">
          <span>Rewards left to claim</span>
          <HelpCircle size={13} />
        </div>

        <p className="mt-3 text-2xl font-black leading-none text-[#FFC928] md:text-[26px]">
          {loading ? "..." : `${formatRich(value)} RICH`}
        </p>
      </div>

      <div className="absolute right-5 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-[#FFC928]/12 text-[#FFC928] md:h-16 md:w-16">
        <Gift size={30} />
      </div>
    </section>
  );
}

function ReferralLinkCard({
  referralLink,
  copied,
  onCopy,
}: {
  referralLink: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <h2 className="mb-4 text-sm font-bold text-white md:text-base">Your Referral Link</h2>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1118] px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFC928]/10 text-[#FFC928] lg:hidden">
            <LinkIcon size={18} />
          </span>

          <p className="min-w-0 break-all text-xs leading-5 text-white lg:truncate lg:break-normal lg:whitespace-nowrap">
            {referralLink || "Connect wallet to generate link"}
          </p>

          <button
            type="button"
            onClick={onCopy}
            disabled={!referralLink}
            className="hidden shrink-0 text-[#A4AAB7] hover:text-[#FFC928] disabled:cursor-not-allowed disabled:opacity-40 lg:block"
            aria-label="Copy referral link"
          >
            <Copy size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={onCopy}
          disabled={!referralLink}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FFC928] px-5 text-xs font-black text-[#05070B] hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          <Copy size={17} />
          {copied ? "Copied!" : "Copy Referral Link"}
        </button>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl bg-[#10131A] p-4 text-center lg:min-h-[116px] lg:rounded-none lg:first:rounded-l-2xl lg:last:rounded-r-2xl">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FFC928]/10 text-[#FFC928] md:h-14 md:w-14">
        {icon}
      </div>

      <p className="mt-3 text-xs text-[#A4AAB7] md:text-sm">{title}</p>
      <p className="mt-2 text-xl font-black text-white md:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] text-[#A4AAB7] md:text-xs">{subtitle}</p>
    </div>
  );
}

function StatsSection({
  referralCount,
  earnedRich,
  loading,
}: {
  referralCount: number;
  earnedRich: number;
  loading: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="grid grid-cols-2 divide-x divide-white/10">
        <StatCard
          title="Referral Count"
          value={loading ? "..." : referralCount.toLocaleString()}
          subtitle="Total users joined"
          icon={<Users size={26} />}
        />

        <StatCard
          title="Earned"
          value={loading ? "..." : `${formatRich(earnedRich)} RIC`}
          subtitle="Total rewards earned"
          icon={<TrendingUp size={26} className="text-[#19C46B]" />}
        />
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Step 1",
    text: "Share your referral link with friends",
    icon: <Share2 size={20} />,
    color: "text-[#FFC928] bg-[#FFC928]/10",
  },
  {
    title: "Step 2",
    text: "They sign up and buy RichCoin",
    icon: <Users size={20} />,
    color: "text-[#1250FF] bg-[#1250FF]/10",
  },
  {
    title: "Step 3",
    text: "You earn 5% in RIC rewards",
    icon: <Gift size={20} />,
    color: "text-[#19C46B] bg-[#19C46B]/10",
  },
];

function HowItWorks() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <h2 className="mb-5 text-sm font-black text-white md:text-base">How it Works</h2>

      <div className="grid gap-0 lg:block">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="relative grid grid-cols-[44px_1fr] gap-3 pb-6 last:pb-0 lg:grid-cols-[42px_1fr]"
          >
            {index !== steps.length - 1 ? (
              <div className="absolute left-[22px] top-11 hidden h-[calc(100%-34px)] border-l border-dashed border-white/20 lg:block" />
            ) : null}

            <span
              className={[
                "grid h-11 w-11 place-items-center rounded-full",
                step.color,
              ].join(" ")}
            >
              {step.icon}
            </span>

            <div>
              <p className="text-xs font-black text-[#FFC928] md:text-sm">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#D4D8E2] md:text-sm">
                {step.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-[#FFC928]/20 bg-[#FFC928]/5 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FFC928]/10 text-[#FFC928]">
          <ShieldCheck size={24} />
        </span>

        <div>
          <p className="text-xs font-black text-[#FFC928] md:text-sm">Transparent & Secure</p>
          <p className="mt-1 text-xs leading-5 text-[#D4D8E2] md:text-sm md:leading-6">
            All referrals and rewards are tracked on-chain and distributed
            automatically.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ReferralPage() {
  const { address } = useAccount();

  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [earnedRich, setEarnedRich] = useState(0);
  const [rewardsLeftRich, setRewardsLeftRich] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referralLink = useMemo(() => {
    if (!address || !origin) return "";

    return `${origin}/?ref=${address}`;
  }, [address, origin]);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      if (!address) {
        if (!cancelled) {
          setReferralCount(0);
          setEarnedRich(0);
          setRewardsLeftRich(0);
          setLoadingStats(false);
        }

        return;
      }

      try {
        if (!cancelled) {
          setLoadingStats(true);
        }

        const response = await fetch(`/api/referral/stats?wallet=${address}`);
        const data = await response.json();

        if (!cancelled) {
          setReferralCount(data.referralCount || 0);
          setEarnedRich(data.earnedRich || 0);
          setRewardsLeftRich(data.rewardsLeftRich || 0);
        }
      } catch (error) {
        console.error("Failed to load referral stats:", error);
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [address]);

  async function copyLink() {
    if (!referralLink) return;

    await navigator.clipboard.writeText(referralLink);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          <ReferralHero />

          <RewardsCard value={rewardsLeftRich} loading={loadingStats} />

          <ReferralLinkCard
            referralLink={referralLink}
            copied={copied}
            onCopy={copyLink}
          />

          <StatsSection
            referralCount={referralCount}
            earnedRich={earnedRich}
            loading={loadingStats}
          />

          <div className="lg:hidden">
            <HowItWorks />
          </div>
        </section>

        <aside className="hidden lg:block">
          <HowItWorks />
        </aside>
      </div>
    </div>
  );
}

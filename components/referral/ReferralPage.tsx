"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

export default function ReferralPage() {
  const { address } = useAccount();

  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [earnedRich, setEarnedRich] = useState(0);
  const [rewardsLeftRich, setRewardsLeftRich] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const referralLink = useMemo(() => {
    if (!address) return "";

    return `${window.location.origin}/?ref=${address}`;
  }, [address]);

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
    <div className="mx-auto w-full max-w-[440px]">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-[#FFF4B0] via-[#FFD700] to-[#D4AF37] bg-clip-text text-4xl font-semibold text-transparent">
          Referral Program
        </h1>

        <p className="mt-3 text-sm text-zinc-400">
          Earn 5% rewards in RICH when users buy RichCoin through your referral
          link.
        </p>
      </div>

      <div className="rounded-[24px] border border-zinc-800 bg-[#10141d] p-5">
        <div className="mb-5 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4">
         <p className="text-base font-medium text-zinc-400">Rewards left to claim</p>

          <p className="mt-2 text-2xl font-semibold text-yellow-400">
            {loadingStats ? "..." : `${rewardsLeftRich.toLocaleString()} RICH`}
          </p>
        </div>

        <p className="mb-2 text-sm text-zinc-400">Your Referral Link</p>

        <div className="rounded-xl bg-[#090d15] p-3">
          <p className="break-all text-sm text-white">
            {referralLink || "Connect wallet to generate link"}
          </p>
        </div>

        <button
          type="button"
          onClick={copyLink}
          disabled={!address}
          className="mt-3 h-11 w-full rounded-xl bg-yellow-400 font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy Referral Link"}
        </button>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard
            title="Referral Count"
            value={loadingStats ? "..." : referralCount.toLocaleString()}
          />

          <StatCard
            title="Earned"
            value={loadingStats ? "..." : `${earnedRich.toLocaleString()} RICH`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#090d15] p-4">
      <p className="text-xs text-zinc-500">{title}</p>

      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
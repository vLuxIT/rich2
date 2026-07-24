"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  LineChart,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { erc20Abi, formatUnits, parseUnits, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";

import HealthRewardWalletCard from "@/components/rst/HealthRewardWalletCard";
import { useHealthRewardWallet } from "@/hooks/useHealthRewardWallet";
import {
  MONTHLY_PROFIT_ALLOCATOR_ADDRESS,
  RST_MANAGER_ADDRESS,
  RST_TOKEN_ADDRESS,
  RST_TREASURY_ADDRESS,
  monthlyProfitAllocatorAbi,
  rstManagerAbi,
  rstTokenAbi,
  rstTreasuryAbi,
} from "@/lib/rstContracts";
import { USDT_TOKEN } from "@/lib/token";

const USDT_DECIMALS = USDT_TOKEN.decimals;
const RST_DECIMALS = 18;
type PreviewSubscription =
  | readonly [taxUsdt: bigint, totalUsdt: bigint, rstAmount: bigint]
  | undefined;

function getReadableError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    details?: string;
    message?: string;
    cause?: {
      shortMessage?: string;
      details?: string;
      message?: string;
    };
  };

  return (
    err.shortMessage ||
    err.details ||
    err.cause?.shortMessage ||
    err.cause?.details ||
    err.message ||
    err.cause?.message ||
    "Transaction failed. Please check contract requirements."
  );
}

function toNumber(value?: bigint, decimals = USDT_DECIMALS) {
  if (value === undefined) return 0;
  return Number(formatUnits(value, decimals));
}

function formatUsd(value?: bigint | number, decimals = USDT_DECIMALS) {
  const numeric =
    typeof value === "bigint" ? toNumber(value, decimals) : Number(value || 0);

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
}


function formatWholeUsd(value?: bigint | number) {
  const numeric = typeof value === "bigint" ? Number(value) : Number(value || 0);

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
}

function formatRedemptionPoolUsd(value?: bigint) {
  if (value === undefined) return "$0.00";

  const one18 = BigInt("1000000000000000000");
  const one6 = BigInt("1000000");

  if (value >= one18) {
    return formatUsd(value, 18);
  }

  if (value >= one6) {
    return formatUsd(value, 6);
  }

  return formatUsd(Number(value));
}


function formatToken(value?: bigint, decimals = RST_DECIMALS, suffix = "") {
  if (value === undefined) return `0${suffix}`;

  const numeric = Number(formatUnits(value, decimals));

  return `${numeric.toLocaleString("en-US", {
    maximumFractionDigits: numeric >= 1000 ? 2 : 4,
  })}${suffix}`;
}

function formatCompact(value?: bigint, decimals = RST_DECIMALS, suffix = "") {
  if (value === undefined) return `0${suffix}`;

  const numeric = Number(formatUnits(value, decimals));

  return `${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(numeric)}${suffix}`;
}

function RstCoin({ size = "lg" }: { size?: "sm" | "lg" | "xl" }) {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-2xl",
    xl: "h-16 w-16 text-xl sm:h-20 sm:w-20 md:h-32 md:w-32 md:text-4xl",
  };

  return (
    <div
      className={[
        "relative grid shrink-0 place-items-center rounded-full border border-[#178CFF]/60 bg-[#061A44] font-black text-white shadow-[0_0_32px_rgba(18,80,255,0.35)]",
        sizes[size],
      ].join(" ")}
    >
      <div className="absolute inset-1 rounded-full border border-[#40C4FF]/30" />
      <span className="relative">RST</span>
    </div>
  );
}

function InfoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <HelpCircle size={13} className="text-[#7E8798]" />
    </span>
  );
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 140 36" className="mt-4 h-8 w-full opacity-80" fill="none">
      <path
        d="M2 28C13 25 20 29 30 24C40 19 45 26 55 20C67 13 72 18 82 15C93 12 101 20 111 13C122 5 130 11 138 7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070B12] px-4 py-5 sm:px-5 md:border-0 md:bg-transparent md:px-0 md:py-0">
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(18,80,255,0.25),transparent_50%)]" />

      <div className="relative z-10 flex items-start gap-3 sm:gap-4">
        <Link
          href="/"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0B0E14] text-white md:hidden"
        >
          <ArrowLeft size={20} />
        </Link>

        <RstCoin size="sm" />

        <div className="min-w-0 max-w-[225px] sm:max-w-none">
          <h1 className="text-lg font-black leading-tight text-white sm:text-xl md:text-[26px]">
            Revenue Share Token (RST)
          </h1>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#D4D8E2] sm:text-sm">
            Your Shareholder Dashboard
          </p>
          <p className="mt-4 hidden max-w-xl text-sm leading-6 text-[#A4AAB7] md:block">
            After subscribing, every holder receives access to a Shareholder
            Dashboard to monitor their investments and ecosystem performance.
          </p>
        </div>

        <div className="pointer-events-none absolute right-1 top-1/2 h-20 w-24 -translate-y-1/2 sm:right-0 sm:h-24 sm:w-40 md:h-40 md:w-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_50%,rgba(18,80,255,0.42),transparent_56%)]" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-8 md:right-20">
            <RstCoin size="xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  change,
  note,
  icon,
  color,
  compact = false,
}: {
  title: string;
  value: string;
  change: string;
  note: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "gold";
  compact?: boolean;
}) {
  const styles = {
    blue: {
      bg: "bg-[#1250FF]/12",
      text: "text-[#2287FF]",
      border: "border-[#1250FF]/35",
      stroke: "#2287FF",
    },
    green: {
      bg: "bg-[#19C46B]/12",
      text: "text-[#19C46B]",
      border: "border-[#19C46B]/35",
      stroke: "#19C46B",
    },
    purple: {
      bg: "bg-[#8B35FF]/12",
      text: "text-[#8B35FF]",
      border: "border-[#8B35FF]/35",
      stroke: "#8B35FF",
    },
    gold: {
      bg: "bg-[#FFC928]/12",
      text: "text-[#FFC928]",
      border: "border-[#FFC928]/35",
      stroke: "#FFC928",
    },
  }[color];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div
        className={[
          "grid h-11 w-11 place-items-center rounded-2xl border",
          styles.bg,
          styles.text,
          styles.border,
        ].join(" ")}
      >
        {icon}
      </div>

      <div className={compact ? "mt-4" : "mt-5"}>
        <p className="min-h-[38px] text-sm font-semibold leading-5 text-[#D4D8E2]">
          <InfoLabel>{title}</InfoLabel>
        </p>
        <p className="mt-3 break-words text-[26px] font-black leading-tight text-white md:text-[26px]">
          {value}
        </p>
        <p className="mt-2 text-sm font-bold text-[#19C46B]">{change}</p>
        <p className="mt-1 text-xs text-[#A4AAB7]">{note}</p>
      </div>

      {!compact ? <Sparkline color={styles.stroke} /> : null}
    </section>
  );
}

function MobilePortfolioValue({
  portfolioValue,
}: {
  portfolioValue: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,80,255,0.12),transparent_70%)]" />
      <div className="relative z-10">
        <p className="text-sm text-[#A4AAB7]">
          <InfoLabel>Your Shares Portfolio Value</InfoLabel>
        </p>
        <p className="mt-3 text-[28px] font-black text-white">
          {formatUsd(portfolioValue)}
        </p>
        <p className="mt-2 text-sm font-bold text-[#19C46B]">
          ▲ 24.56%{" "}
          <span className="font-normal text-[#A4AAB7]">vs last 30 days</span>
        </p>
      </div>
      <div className="absolute right-5 top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full bg-[#1250FF]/15 text-[#2287FF]">
        <BriefcaseBusiness size={34} />
      </div>
    </section>
  );
}

function HoldingsCard({
  rstBalance,
  currentOpv,
  portfolioValue,
}: {
  rstBalance?: bigint;
  currentOpv?: bigint;
  portfolioValue: number;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white">
          <InfoLabel>Your RST Holdings</InfoLabel>
        </h2>

        <Link
          href="/rst/subscriptions"
          className="hidden items-center gap-2 text-sm font-black text-[#2287FF] sm:inline-flex"
        >
          View All Subscriptions
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[210px_1fr]">
        <div className="flex flex-col items-center justify-center">
          <div className="relative grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(#168BFF_0_78%,#0E1728_78%_100%)] p-3 sm:h-36 sm:w-36">
            <div className="grid h-full w-full place-items-center rounded-full bg-[#10131A] text-center">
              <p className="text-2xl font-black text-white">
                {formatToken(rstBalance).replace(/\.00$/, "")}
              </p>
              <p className="text-sm text-[#D4D8E2]">RST</p>
              <p className="text-xs text-[#A4AAB7]">Total Holdings</p>
            </div>
          </div>
          <p className="mt-4 text-base font-black text-white">
            ≈ {formatUsd(portfolioValue)}
          </p>
          <p className="text-xs text-[#A4AAB7]">Portfolio Value</p>
        </div>

        <div className="divide-y divide-white/10">
          {[
            ["Current OPV", formatUsd(currentOpv), "text-white"],
            ["Current Value", formatUsd(portfolioValue), "text-[#2287FF]"],
            ["Unrealized Profit", "Calculated per subscription", "text-[#19C46B]"],
            ["Vesting Status", "Active Plans", "text-[#19C46B]"],
          ].map(([label, value, color]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3">
              <p className="text-sm text-[#A4AAB7]">{label}</p>
              <p className={["text-right text-sm font-black", color].join(" ")}>
                {value}
              </p>
            </div>
          ))}

          <Link
            href="/rst/subscriptions"
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1250FF]/20 bg-[#1250FF]/10 text-sm font-black text-[#2287FF]"
          >
            View RST Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PerformanceChart() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-base font-black text-white">
          <InfoLabel>Ecosystem Performance</InfoLabel>
        </h2>

        <div className="flex rounded-xl border border-white/10 bg-[#0B0F17] p-1 text-xs font-black text-[#A4AAB7]">
          {["7D", "30D", "90D", "1Y"].map((period) => (
            <button
              key={period}
              type="button"
              className={[
                "rounded-lg px-3 py-1.5",
                period === "30D" ? "bg-[#1250FF] text-white" : "",
              ].join(" ")}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-[#D4D8E2]">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-5 rounded-full bg-[#2287FF]" />
          OPV (USD)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-5 rounded-full bg-[#19C46B]" />
          Redemption Pool (USD)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-5 rounded-full bg-[#8B35FF]" />
          Portfolio Value (USD)
        </span>
      </div>

      <div className="relative h-56 overflow-hidden rounded-2xl bg-[#090E17] md:h-64">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_25%]" />
        <svg viewBox="0 0 820 260" className="absolute inset-0 h-full w-full" fill="none">
          <path d="M15 206C78 205 108 199 151 193C198 187 219 199 260 176C300 153 342 159 379 139C426 113 458 127 501 101C544 74 585 96 626 74C674 49 709 63 805 24" stroke="#8B35FF" strokeWidth="4" strokeLinecap="round" />
          <path d="M15 214C72 209 106 211 150 200C198 190 219 200 260 185C309 168 339 170 381 152C423 133 460 140 501 122C547 99 585 115 628 97C681 76 716 89 805 53" stroke="#19C46B" strokeWidth="4" strokeLinecap="round" />
          <path d="M15 218C78 215 108 219 151 211C196 203 219 216 260 207C305 196 342 205 379 187C424 169 463 176 501 156C547 132 585 150 626 139C672 126 709 137 805 103" stroke="#2287FF" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div className="absolute bottom-3 left-[18%] right-6 flex justify-between text-xs text-[#A4AAB7]">
          <span>Jun 7</span>
          <span>Jun 14</span>
          <span>Jun 21</span>
          <span>Jun 28</span>
          <span>Jul 5</span>
        </div>
      </div>
    </section>
  );
}

function ProfitHistory() {
  const rows = [
    ["OPV Appreciation", "5 Jul 2025, 12:00 PM", "+$215.50", "+10.24%", true],
    ["Redemption Pool Growth", "5 Jul 2025, 12:00 PM", "+$185.75", "+8.76%", true],
    ["Empowerment Payout", "30 Jun 2025, 12:00 PM", "+$125.00", "+6.12%", true],
    ["OPV Adjustment", "25 Jun 2025, 12:00 PM", "-$45.30", "-2.45%", false],
  ] as const;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-black text-white">
          <InfoLabel>Profit History</InfoLabel>
        </h2>

        <Link
          href="/rst/subscriptions"
          className="inline-flex items-center gap-2 text-sm font-black text-[#2287FF]"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="divide-y divide-white/10">
        {rows.map(([title, date, amount, change, credit]) => (
          <div key={`${title}-${date}`} className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <span
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  credit
                    ? "bg-[#19C46B]/12 text-[#19C46B]"
                    : "bg-[#8B35FF]/12 text-[#8B35FF]",
                ].join(" ")}
              >
                {credit ? <TrendingUp size={21} /> : <TrendingDown size={21} />}
              </span>

              <div>
                <p className="text-sm font-black text-white">{title}</p>
                <p className="mt-1 text-xs text-[#A4AAB7]">{date}</p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={[
                  "text-lg font-black md:text-sm",
                  credit ? "text-[#19C46B]" : "text-red-400",
                ].join(" ")}
              >
                {amount}
              </p>
              <p className="text-xs text-[#A4AAB7]">{change}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscribeCard({
  usdtAddress,
  usdtBalance,
  allowance,
  currentTermsHash,
  currentTermsURI,
  currentTermsVersion,
  minimumSubscription,
  managerInventory,
  onSuccess,
}: {
  usdtAddress: Address;
  usdtBalance?: bigint;
  allowance?: bigint;
  currentTermsHash?: `0x${string}`;
  currentTermsURI?: string;
  currentTermsVersion?: bigint;
  minimumSubscription?: bigint;
  managerInventory?: bigint;
  onSuccess?: () => void;
}) {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { address, isConnected } = useAccount();

  const [amount, setAmount] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState("");
  const [lastError, setLastError] = useState("");

  const capitalUsdt = useMemo(() => {
    if (!amount || Number(amount) <= 0) return undefined;

    try {
      return parseUnits(amount, USDT_DECIMALS);
    } catch {
      return undefined;
    }
  }, [amount]);

  const { data: previewData, isFetching: isPreviewLoading } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "previewSubscription",
    args: capitalUsdt ? [capitalUsdt] : undefined,
    query: {
      enabled: Boolean(capitalUsdt),
    },
  });

  const preview = previewData as PreviewSubscription;

  const taxUsdt = preview?.[0];
  const totalUsdt = preview?.[1];
  const rstAmount = preview?.[2];

  const managerMayNotHaveEnoughRst = Boolean(
    rstAmount && managerInventory !== undefined && managerInventory < rstAmount
  );

  const belowMinimum = Boolean(
    capitalUsdt && minimumSubscription && capitalUsdt < minimumSubscription
  );

  const insufficientUsdt = Boolean(
    totalUsdt && usdtBalance !== undefined && usdtBalance < totalUsdt
  );

  const needsApproval = Boolean(
    totalUsdt && allowance !== undefined && allowance < totalUsdt
  );

  const canSubmit = Boolean(
    isConnected &&
      address &&
      capitalUsdt &&
      totalUsdt &&
      currentTermsHash &&
      acceptedTerms &&
      !belowMinimum &&
      !insufficientUsdt &&
      !isPreviewLoading &&
      !isPending
  );

  function handleAmount(value: string) {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
      setLastError("");
    }
  }

  async function executeSubscriptionBatchAfterSubscribe(subscriptionTxHash: `0x${string}`) {
    const response = await fetch("/api/rst/execute-subscription-batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscriptionTxHash }),
    });

    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(json?.error || "Final confirmation failed.");
    }

    return json;
  }

  async function submit() {
    if (!canSubmit || !address || !capitalUsdt || !totalUsdt || !currentTermsHash) {
      return;
    }

    try {
      if (!publicClient) throw new Error("Wallet client is not ready.");

      setLastError("");

      if (needsApproval) {
        setStatus("Approving USDT...");
        const approveHash = await writeContractAsync({
          address: usdtAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [RST_MANAGER_ADDRESS, totalUsdt],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
      }

      setStatus("Checking subscription...");

      await publicClient.simulateContract({
        account: address,
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "subscribe",
        args: [capitalUsdt, currentTermsHash],
      });

      setStatus("Subscribing to RST...");

      const subscribeHash = await writeContractAsync({
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "subscribe",
        args: [capitalUsdt, currentTermsHash],
      });

      await publicClient.waitForTransactionReceipt({
        hash: subscribeHash,
        confirmations: 1,
      });

      try {
        setStatus("Confirming transaction...");
        await executeSubscriptionBatchAfterSubscribe(subscribeHash);
        toast.success("Success");
      } catch (batchError) {
        console.warn("Final confirmation failed:", batchError);
        toast.warning("Subscription successful. Final confirmation failed.");
      }

      setStatus("");
      setAmount("");
      setAcceptedTerms(false);
      onSuccess?.();
    } catch (error) {
      const message = getReadableError(error);

      setStatus("");
      setLastError(message);
      toast.error(message);
    }
  }

  return (
    <section className="rounded-2xl border border-[#1250FF]/20 bg-[#071224] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white">Subscribe to RST</h2>
          <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
            Minimum subscription is {formatUsd(minimumSubscription)}. All RST
            subscriptions are made using USDT.
          </p>
        </div>
        <RstCoin size="sm" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0D1118] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-[#A4AAB7]">Subscription Capital</span>
          <span className="text-xs text-[#A4AAB7]">
            Balance: {formatToken(usdtBalance, USDT_DECIMALS, " USDT")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={amount}
            onChange={(e) => handleAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="min-w-0 flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-[#606879]"
          />

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-sm font-black text-white">
            <Image
              src="/usdt.png"
              alt="USDT"
              width={26}
              height={26}
              className="rounded-full"
            />
            USDT
          </div>
        </div>

        {belowMinimum ? (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Minimum RST subscription is {formatUsd(minimumSubscription)}.
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D1118] p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#A4AAB7]">Tax / Fee</span>
          <span className="font-black text-white">{formatUsd(taxUsdt)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[#A4AAB7]">Total USDT Needed</span>
          <span className="font-black text-white">{formatUsd(totalUsdt)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[#A4AAB7]">You Receive</span>
          <span className="font-black text-[#2287FF]">
            {formatToken(rstAmount, RST_DECIMALS, " RST")}
          </span>
        </div>
      </div>

      {managerMayNotHaveEnoughRst ? (
        <p className="mt-3 rounded-xl bg-yellow-500/10 px-3 py-2 text-xs leading-5 text-yellow-200">
          Warning: RSTManager currently appears to hold less RST than this
          subscription needs. If the contract requires manager inventory, the
          subscription will fail until RST is funded or permissions are fixed.
        </p>
      ) : null}

      {lastError ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-300">
          {lastError}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D1118] p-4">
        <div className="flex items-start gap-3">
          <FileText size={20} className="mt-0.5 shrink-0 text-[#2287FF]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white">Terms & Conditions</p>
            <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
              Current terms version:{" "}
              {currentTermsVersion ? currentTermsVersion.toString() : "—"}. Users
              should review the official terms before submitting.
            </p>

            <div className="mt-3">
              {currentTermsURI ? (
                <a
                  href={currentTermsURI}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#1250FF]/30 bg-[#1250FF]/10 px-3 text-xs font-black text-[#2287FF]"
                >
                  <ExternalLink size={15} />
                  View Terms & Conditions
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black text-[#7E8798]"
                >
                  <Download size={15} />
                  Terms Not Available
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <span className="text-xs leading-5 text-[#D4D8E2]">
            I have read and accept the RST terms, risk notice, redemption
            policy, 90-day growth period, 5% health reward debit on withdrawals,
            and maximum return policy.
          </span>
        </label>
      </div>

      <ConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal }) => {
          const connected = account && chain;

          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B]"
              >
                <LockKeyhole size={18} />
                Connect Wallet to Subscribe
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                type="button"
                onClick={openChainModal}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-red-500 text-sm font-black text-white"
              >
                Wrong Network
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status ||
                (isPreviewLoading
                  ? "Calculating..."
                  : needsApproval
                    ? "Approve & Subscribe"
                    : "Subscribe to RST")}
              <ArrowRight size={17} />
            </button>
          );
        }}
      </ConnectButton.Custom>

      {insufficientUsdt ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">
          Insufficient USDT balance.
        </p>
      ) : null}
    </section>
  );
}

function SummaryCard() {
  return (
    <section className="hidden rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] xl:block">
      <h2 className="mb-5 text-base font-black text-white">
        Ecosystem Performance Summary
      </h2>

      <div className="space-y-4">
        {[
          ["Strong OPV Growth", "The Official Programme Value has grown consistently.", <LineChart key="a" size={21} />, "bg-[#1250FF]/12 text-[#2287FF]"],
          ["Redemption Pool Growth", "The redemption pool continues to grow.", <CircleDollarSign key="b" size={21} />, "bg-[#19C46B]/12 text-[#19C46B]"],
          ["Increasing Shareholders", "More investors are joining the ecosystem.", <Users key="c" size={21} />, "bg-[#FFC928]/12 text-[#FFC928]"],
          ["Sustainable Ecosystem", "Built for long-term growth and value.", <ShieldCheck key="d" size={21} />, "bg-[#8B35FF]/12 text-[#8B35FF]"],
        ].map(([title, text, icon, classes]) => (
          <div key={String(title)} className="flex gap-3">
            <span
              className={[
                "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                classes,
              ].join(" ")}
            >
              {icon}
            </span>

            <div>
              <p className="text-sm font-black text-white">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RstDashboard() {
  const { address } = useAccount();

  const healthWallet = useHealthRewardWallet(address);

  const { data: subscriptionPrice } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "subscriptionPriceUsdt",
  });

  const { data: currentOpv } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentOpvUsdt",
  });

  const { data: minimumSubscription } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "minimumSubscriptionUsdt",
  });

  const { data: currentTermsHash } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentTermsHash",
  });

  const { data: currentTermsURI } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentTermsURI",
  });

  const { data: currentTermsVersion } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentTermsVersion",
  });

  const { data: nextPlanId } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "nextPlanId",
  });

  const allPlanIds = useMemo(() => {
    const next = Number((nextPlanId as bigint | undefined) || BigInt(0));

    if (next <= 1) return [];

    return Array.from({ length: next - 1 }, (_, index) => BigInt(index + 1));
  }, [nextPlanId]);

  const allPlanReads = useReadContracts({
    contracts: allPlanIds.map((planId) => ({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerAbi,
      functionName: "plans",
      args: [planId],
    })),
    query: {
      enabled: allPlanIds.length > 0,
    },
  });

  const totalShareholders = useMemo(() => {
    const holders = new Set<string>();

    for (const result of allPlanReads.data || []) {
      const plan = result.result as
        | readonly [
            holder: `0x${string}`,
            rstAmount: bigint,
            initialCapitalUsdt: bigint,
            cumulativeGrossClaimsUsdt: bigint,
            subscribedAt: bigint,
            nextClaimAt: bigint,
            claimsReleased: bigint,
            terminationClaims: bigint,
            status: number,
            terminationMonthlyUsdt: bigint,
            terminationRemainderUsdt: bigint
          ]
        | undefined;

      const holder = plan?.[0];

      if (holder && holder !== "0x0000000000000000000000000000000000000000") {
        holders.add(holder.toLowerCase());
      }
    }

    return holders.size;
  }, [allPlanReads.data]);

  const { data: contractUsdtAddress } = useReadContract({
    address: MONTHLY_PROFIT_ALLOCATOR_ADDRESS,
    abi: monthlyProfitAllocatorAbi,
    functionName: "usdt",
  });

  const activeUsdtAddress =
    (contractUsdtAddress as Address | undefined) || (USDT_TOKEN.address as Address);

  const { data: redemptionPool } = useReadContract({
    address: RST_TREASURY_ADDRESS,
    abi: rstTreasuryAbi,
    functionName: "redemptionPoolBalance",
  });

  const { data: rstBalance, refetch: refetchRstBalance } = useReadContract({
    address: RST_TOKEN_ADDRESS,
    abi: rstTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const { data: rstTotalSupply } = useReadContract({
    address: RST_TOKEN_ADDRESS,
    abi: rstTokenAbi,
    functionName: "totalSupply",
  });

  const { data: managerInventory } = useReadContract({
    address: RST_TOKEN_ADDRESS,
    abi: rstTokenAbi,
    functionName: "balanceOf",
    args: [RST_MANAGER_ADDRESS],
  });

  const { data: usdtBalance } = useReadContract({
    address: activeUsdtAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: activeUsdtAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, RST_MANAGER_ADDRESS] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const portfolioValue = useMemo(() => {
    const rst = toNumber(rstBalance as bigint | undefined, RST_DECIMALS);
    const opv = toNumber(currentOpv as bigint | undefined, USDT_DECIMALS);

    return rst * opv;
  }, [rstBalance, currentOpv]);

  const distributed =
    (rstTotalSupply as bigint | undefined) !== undefined &&
    (managerInventory as bigint | undefined) !== undefined
      ? (rstTotalSupply as bigint) - (managerInventory as bigint)
      : undefined;


  function refreshAfterSubscribe() {
    void refetchRstBalance();
    void refetchAllowance();
  }

  return (
    <div className="-mx-2 space-y-4 sm:mx-0">
      <DashboardHero />

      <MobilePortfolioValue portfolioValue={portfolioValue} />

      <section className="grid gap-3 md:grid-cols-5">
        <div className="hidden md:block">
          <MetricCard
            title="Shares Portfolio Value"
            value={formatUsd(portfolioValue)}
            change="▲ 24.56%"
            note="vs last 30 days"
            icon={<LineChart size={23} />}
            color="blue"
          />
        </div>

        <MetricCard
          title="Official Programme Value (OPV)"
          value={formatUsd(currentOpv as bigint | undefined)}
          change="▲ Live"
          note={`Subscription price: ${formatUsd(subscriptionPrice as bigint | undefined)}`}
          icon={<BarChart3 size={23} />}
          color="blue"
          compact
        />

        <MetricCard
          title="Total Redemption Pool"
          value={formatRedemptionPoolUsd(redemptionPool as bigint | undefined)}
          change="▲ Live"
          note="from RSTTreasury"
          icon={<CircleDollarSign size={23} />}
          color="green"
          compact
        />

        <MetricCard
          title="Total RST Distributed"
          value={formatCompact(distributed, RST_DECIMALS, " RST")}
          change="▲ Live"
          note="supply minus manager inventory"
          icon={<PieChart size={23} />}
          color="purple"
          compact
        />

        <MetricCard
          title="Total Shareholders"
          value={totalShareholders.toLocaleString("en-US")}
          change="▲ Live"
          note="unique shareholder wallets"
          icon={<Users size={23} />}
          color="gold"
          compact
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <HoldingsCard
          rstBalance={rstBalance as bigint | undefined}
          currentOpv={currentOpv as bigint | undefined}
          portfolioValue={portfolioValue}
        />
        <SummaryCard />
      </section>

      <section className="grid gap-4">
        <div className="space-y-4">
          <SubscribeCard
            usdtAddress={activeUsdtAddress}
            usdtBalance={usdtBalance as bigint | undefined}
            allowance={usdtAllowance as bigint | undefined}
            currentTermsHash={currentTermsHash as `0x${string}` | undefined}
            currentTermsURI={currentTermsURI as string | undefined}
            currentTermsVersion={currentTermsVersion as bigint | undefined}
            minimumSubscription={minimumSubscription as bigint | undefined}
            managerInventory={managerInventory as bigint | undefined}
            onSuccess={refreshAfterSubscribe}
          />

          <HealthRewardWalletCard
            address={healthWallet.wallet?.address}
            isCreating={healthWallet.isCreating}
            error={healthWallet.error}
            onCreate={() => void healthWallet.createOrLoadWallet()}
          />
        </div>
      </section>
    </div>
  );
}

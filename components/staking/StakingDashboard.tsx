"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Gift, HelpCircle, LockKeyhole, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { useRicMarket } from "@/hooks/useRicMarket";
import { RICH_TOKEN } from "@/lib/token";
import { erc20Abi } from "@/lib/erc20Abi";
import { STAKING_CONTRACT, stakingAbi } from "@/lib/staking";
import StakeBox from "./StakeBox";
import StakingPlans from "./StakingPlans";

export type StakingPlan = {
  id: number;
  days: number;
  rewardPercent: string;
};

const RIC_DECIMALS = 18;

function formatRIC(value?: bigint) {
  if (!value) return "0";

  return Number(formatUnits(value, RIC_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function secondsToDays(seconds?: bigint) {
  if (!seconds) return 0;

  return Math.round(Number(seconds) / 86400);
}

function formatRewardPercent(value?: bigint) {
  if (!value) return "0%";

  const percent = Number(value) / 100;

  return `${percent.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}%`;
}

function InfoDot() {
  return <HelpCircle size={14} className="text-[#777F91]" />;
}

function BigMetricCard({
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 text-sm text-[#A4AAB7]">
        <span>{title}</span>
        <InfoDot />
      </div>

      <p className="mt-4 text-[26px] font-black leading-none text-white md:text-3xl">
        {value}
      </p>

      <p className="mt-3 text-sm text-[#A4AAB7]">{subtitle}</p>

      <div className="absolute right-5 top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full bg-[#123DDB]/15 text-[#1250FF]">
        {icon}
      </div>
    </div>
  );
}

function OverviewCell({
  title,
  value,
  note,
  icon,
  border = true,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={[
        "flex min-h-[132px] flex-col items-center justify-center px-3 text-center",
        border ? "border-l border-white/10" : "",
      ].join(" ")}
    >
      <p className="text-xs text-[#A4AAB7]">{title}</p>
      <p className="mt-3 text-lg font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-4 text-[#A4AAB7]">{note}</p>

      <div className="mt-4 grid h-10 w-10 place-items-center rounded-full">
        {icon}
      </div>
    </div>
  );
}

function SmallMetricCard({
  title,
  value,
  subtitle,
  helper,
  icon,
  green = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  helper?: string;
  icon: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 text-sm text-white">
        <span>{title}</span>
        <InfoDot />
      </div>

      <p
        className={[
          "mt-3 text-2xl font-black",
          green ? "text-[#19C46B]" : "text-[#FFC928]",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-[#A4AAB7]">{subtitle}</p>

      {helper ? (
        <div className="mt-5 border-t border-white/10 pt-3 text-xs text-[#A4AAB7]">
          {helper}
        </div>
      ) : null}

      <div className="absolute right-4 top-5">{icon}</div>
    </div>
  );
}

const featureCards = [
  {
    title: "Secure",
    text: "Your funds are safe with smart contracts",
    icon: <LockKeyhole size={24} />,
    color: "text-[#19C46B] bg-[#19C46B]/10",
  },
  {
    title: "Flexible",
    text: "Choose a plan that suits you",
    icon: <CalendarDays size={24} />,
    color: "text-[#1250FF] bg-[#1250FF]/10",
  },
  {
    title: "Easy Withdraw",
    text: "Unstake after the selected duration",
    icon: <Gift size={24} />,
    color: "text-[#8B35FF] bg-[#8B35FF]/10",
  },
];

export default function StakingDashboard() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: ricMarket } = useRicMarket();

  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>();
  const [stakeHash, setStakeHash] = useState<`0x${string}` | undefined>();
  const [txType, setTxType] = useState<"approve" | "stake" | null>(null);

  const autoStakeStartedRef = useRef(false);
  const stakeRedirectStartedRef = useRef(false);
  const pendingStakeAmountRef = useRef<bigint | undefined>(undefined);
  const pendingStakePlanRef = useRef<number | undefined>(undefined);
  const pendingStakeAmountTextRef = useRef("");
  const pendingStakePlanDaysRef = useRef<number | undefined>(undefined);

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isApprovalConfirming, isSuccess: approvalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
      query: {
        enabled: Boolean(approvalHash),
      },
    });

  const { isLoading: isStakeConfirming, isSuccess: stakeSuccess } =
    useWaitForTransactionReceipt({
      hash: stakeHash,
      query: {
        enabled: Boolean(stakeHash),
      },
    });

  const { data: ricBalance } = useBalance({
    address,
    token: RICH_TOKEN.address,
    query: {
      enabled: Boolean(address),
    },
  });

  const { data: plansData } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "getAllPlans",
  });

  const { data: stats } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "stakingStats",
  });

  const { data: minimumStakeRaw } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "minimumStake",
  });

  const { data: userStakeCount } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "getUserStakeCount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const amountIn =
    stakeAmount && Number(stakeAmount) > 0
      ? parseUnits(stakeAmount, RIC_DECIMALS)
      : undefined;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: RICH_TOKEN.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, STAKING_CONTRACT] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const typedPlansData = plansData as
    | readonly [readonly bigint[], readonly bigint[], readonly bigint[]]
    | undefined;

  const planIds = typedPlansData?.[0] || [];
  const durations = typedPlansData?.[1] || [];
  const rewardPercents = typedPlansData?.[2] || [];

  const plans: StakingPlan[] = planIds.map((id, index) => ({
    id: Number(id),
    days: secondsToDays(durations[index]),
    rewardPercent: formatRewardPercent(rewardPercents[index]),
  }));

  const activeSelectedPlanId = selectedPlanId ?? plans[0]?.id;
  const selectedPlan =
    plans.find((plan) => plan.id === activeSelectedPlanId) ||
    plans[0] ||
    undefined;

  const statsData = stats as readonly bigint[] | undefined;

  const rewardPoolRemaining = statsData?.[1];
  const rewardsDistributed = statsData?.[2];
  const rewardsReserved = statsData?.[3];
  const totalStaked = statsData?.[4];
  const activeStakeTotal = statsData?.[5];

  const minimumStake = minimumStakeRaw as bigint | undefined;
  const minimumStakeText = formatRIC(minimumStake);

  const ricUsd = ricMarket?.priceUsd || 0.04235;
  const totalStakedNumber = totalStaked
    ? Number(formatUnits(totalStaked, RIC_DECIMALS))
    : 0;
  const totalStakedUsd = totalStakedNumber * ricUsd;

  const rewardPoolNumber = rewardPoolRemaining
    ? Number(formatUnits(rewardPoolRemaining, RIC_DECIMALS))
    : 0;
  const rewardPoolUsd = rewardPoolNumber * ricUsd;

  const rewardsReservedNumber = rewardsReserved
    ? Number(formatUnits(rewardsReserved, RIC_DECIMALS))
    : 0;
  const rewardsReservedUsd = rewardsReservedNumber * ricUsd;

  const rewardsDistributedNumber = rewardsDistributed
    ? Number(formatUnits(rewardsDistributed, RIC_DECIMALS))
    : 0;
  const rewardsDistributedUsd = rewardsDistributedNumber * ricUsd;

  const hasAmount = Boolean(amountIn && amountIn > BigInt(0));

  const insufficientBalance = Boolean(
    amountIn && ricBalance?.value && amountIn > ricBalance.value
  );

  const belowMinimumStake = Boolean(
    amountIn && minimumStake && amountIn < minimumStake
  );

  const needsApproval = Boolean(
    amountIn && allowance !== undefined && allowance < amountIn
  );

  const isConfirming = isApprovalConfirming || isStakeConfirming;
  const txHash = stakeHash || approvalHash;
  const txSuccess = txType === "stake" ? stakeSuccess : approvalSuccess;

  async function approveRIC() {
    if (!amountIn || !selectedPlan) return;

    if (minimumStake && amountIn < minimumStake) {
      toast.error(`Minimum stake is ${minimumStakeText} RIC.`);
      return;
    }

    try {
      setTxType("approve");
      setApprovalHash(undefined);
      setStakeHash(undefined);
      autoStakeStartedRef.current = false;
      stakeRedirectStartedRef.current = false;

      pendingStakeAmountRef.current = amountIn;
      pendingStakePlanRef.current = selectedPlan.id;
      pendingStakeAmountTextRef.current = stakeAmount;
      pendingStakePlanDaysRef.current = selectedPlan.days;

      toast.loading("Waiting for RIC approval...", {
        id: "staking-approval",
      });

      const hash = await writeContractAsync({
        address: RICH_TOKEN.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_CONTRACT, amountIn],
      });

      setApprovalHash(hash);
    } catch (error) {
      toast.dismiss("staking-approval");
      toast.error("Approval was cancelled or failed.");
      console.error("Approve failed:", error);

      autoStakeStartedRef.current = false;
      pendingStakeAmountRef.current = undefined;
      pendingStakePlanRef.current = undefined;
      pendingStakeAmountTextRef.current = "";
      pendingStakePlanDaysRef.current = undefined;
    }
  }

  async function stakeRIC(amountOverride?: bigint, planOverride?: number) {
    const finalAmount = amountOverride || amountIn;
    const finalPlan = planOverride ?? selectedPlan?.id;

    if (!finalAmount || finalPlan === undefined) return;

    if (minimumStake && finalAmount < minimumStake) {
      toast.error(`Minimum stake is ${minimumStakeText} RIC.`);
      return;
    }

    try {
      setTxType("stake");

      toast.loading("Waiting for stake confirmation...", {
        id: "staking-stake",
      });

      const hash = await writeContractAsync({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "stake",
        args: [finalAmount, finalPlan as 0 | 1 | 2 | 3],
      });

      setStakeHash(hash);
      setStakeAmount("");

      pendingStakeAmountRef.current = undefined;
      pendingStakePlanRef.current = undefined;
    } catch (error) {
      toast.dismiss("staking-stake");
      toast.error("Stake transaction was cancelled or failed.");
      console.error("Stake failed:", error);
    }
  }

  useEffect(() => {
    if (!approvalSuccess) return;
    if (autoStakeStartedRef.current) return;

    autoStakeStartedRef.current = true;

    async function continueToStakeAfterApproval() {
      toast.dismiss("staking-approval");
      toast.success("RIC approved successfully.");

      await refetchAllowance();

      const approvedAmount = pendingStakeAmountRef.current;
      const approvedPlan = pendingStakePlanRef.current;

      if (!approvedAmount || approvedPlan === undefined) return;

      await stakeRIC(approvedAmount, approvedPlan);
    }

    void continueToStakeAfterApproval();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalSuccess, refetchAllowance]);

  useEffect(() => {
    if (!stakeSuccess) return;
    if (stakeRedirectStartedRef.current) return;

    stakeRedirectStartedRef.current = true;
    toast.dismiss("staking-stake");

    const amountText = pendingStakeAmountTextRef.current || "your";
    const planDays = pendingStakePlanDaysRef.current;

    toast.success(
      planDays
        ? `Successfully staked ${amountText} RIC into the ${planDays}-day plan.`
        : `Successfully staked ${amountText} RIC.`
    );

    const timer = setTimeout(() => {
      router.push("/user-stakes");
    }, 1500);

    return () => clearTimeout(timer);
  }, [stakeSuccess, router]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131A] px-5 py-5 md:bg-transparent md:p-0 md:border-0">
        <div className="flex items-start gap-4">
          <Link
            href="/"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0B0E14] text-white md:hidden"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white md:text-3xl">
              Stake RIC
            </h1>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[#A4AAB7] md:text-base">
              Stake your RichCoin (RIC) and earn high rewards
            </p>
          </div>

          <div className="absolute right-5 top-1/2 hidden h-24 w-24 -translate-y-1/2 md:block">
            <div className="absolute inset-0 rounded-full bg-[#FFC928]/20 blur-2xl" />
            <Image
              src="/rc.png"
              alt="RIC"
              fill
              sizes="96px"
              className="relative object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.6fr]">
        <BigMetricCard
          title="Total Staking Pool Balance"
          value={`${formatRIC(totalStaked)} RIC`}
          subtitle={`≈ ${formatUsd(totalStakedUsd)}`}
          icon={<CoinsIcon />}
        />

        <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">My Staking Overview</h2>

            <Link
              href="/user-stakes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#FFC928]"
            >
              My Stakes
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1118]">
            <OverviewCell
              title="Active Stakes"
              value={address ? String(Number(userStakeCount || 0)) : "0"}
              note={`≈ ${formatRIC(activeStakeTotal)} RIC active`}
              border={false}
              icon={
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#19C46B]/15 text-[#19C46B]">
                  <LockKeyhole size={20} />
                </span>
              }
            />
            <OverviewCell
              title="Staking Duration"
              value={selectedPlan ? `${selectedPlan.days} Days` : "—"}
              note="Selected plan"
              icon={
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1250FF]/15 text-[#4B7CFF]">
                  <CalendarDays size={20} />
                </span>
              }
            />
            <OverviewCell
              title="Rewards Reserved"
              value={`${formatRIC(rewardsReserved)} RIC`}
              note={`≈ ${formatUsd(rewardsReservedUsd)}`}
              icon={
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#8B35FF]/15 text-[#8B35FF]">
                  <TrendingUp size={20} />
                </span>
              }
            />
            <OverviewCell
              title="Next Claim In"
              value="After Lock"
              note="Based on plan"
              icon={
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F07B13]/15 text-[#F07B13]">
                  <Clock3 size={20} />
                </span>
              }
            />
          </div>
        </section>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <SmallMetricCard
          title="Daily Earnings"
          value={`${formatRIC(rewardsReserved ? rewardsReserved / BigInt(30) : undefined)} RIC`}
          subtitle={`≈ ${formatUsd(rewardsReservedUsd / 30)}`}
          helper="Earnings are calculated daily"
          green
          icon={
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#19C46B]/15 text-[#19C46B]">
              <TrendingUp size={30} />
            </span>
          }
        />

        <SmallMetricCard
          title="Available to Claim"
          value={`${formatRIC(rewardPoolRemaining)} RIC`}
          subtitle={`≈ ${formatUsd(rewardPoolUsd)}`}
          helper="Claim availability depends on your stakes"
          icon={
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#FFC928]/15 text-[#FFC928]">
              <Gift size={30} />
            </span>
          }
        />

        <SmallMetricCard
          title="Total Earnings"
          value={`${formatRIC(rewardsDistributed)} RIC`}
          subtitle={`≈ ${formatUsd(rewardsDistributedUsd)}`}
          helper="All time rewards distributed"
          icon={
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#8B35FF]/15 text-[#8B35FF]">
              <WalletIcon />
            </span>
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <StakingPlans
            plans={plans}
            selectedPlanId={activeSelectedPlanId}
            onSelectPlan={setSelectedPlanId}
          />

          <section className="hidden rounded-2xl border border-white/10 bg-[#10131A] p-4 md:grid md:grid-cols-3">
            {featureCards.map((feature, index) => (
              <div
                key={feature.title}
                className={[
                  "flex items-center gap-4 px-4",
                  index !== 0 ? "border-l border-white/10" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-12 w-12 shrink-0 place-items-center rounded-full",
                    feature.color,
                  ].join(" ")}
                >
                  {feature.icon}
                </span>

                <div>
                  <p className="text-sm font-bold text-white">{feature.title}</p>
                  <p className="mt-1 text-xs leading-4 text-[#A4AAB7]">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </div>

        <StakeBox
          stakeAmount={stakeAmount}
          setStakeAmount={setStakeAmount}
          balance={ricBalance?.formatted || "0"}
          selectedPlan={selectedPlan}
          hasAmount={hasAmount}
          insufficientBalance={insufficientBalance}
          belowMinimumStake={belowMinimumStake}
          minimumStakeText={minimumStakeText}
          needsApproval={needsApproval}
          isPending={isPending}
          isConfirming={isConfirming}
          txType={txType}
          isSuccess={txSuccess}
          txHash={txHash}
          onApprove={approveRIC}
          onStake={() => void stakeRIC()}
        />
      </section>

      <section className="grid rounded-2xl border border-white/10 bg-[#10131A] p-4 md:hidden md:grid-cols-3">
        {featureCards.map((feature, index) => (
          <div
            key={feature.title}
            className={[
              "flex items-center gap-3 py-3",
              index !== 0 ? "border-t border-white/10" : "",
            ].join(" ")}
          >
            <span
              className={[
                "grid h-12 w-12 shrink-0 place-items-center rounded-full",
                feature.color,
              ].join(" ")}
            >
              {feature.icon}
            </span>

            <div>
              <p className="text-sm font-bold text-white">{feature.title}</p>
              <p className="mt-1 text-xs leading-4 text-[#A4AAB7]">
                {feature.text}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none">
      <ellipse cx="24" cy="11" rx="13" ry="6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 11v18c0 3.3 5.8 6 13 6s13-2.7 13-6V11" stroke="currentColor" strokeWidth="3" />
      <path d="M11 20c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
      <path d="M11 29c0 3.3 5.8 6 13 6s13-2.7 13-6" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
      <path
        d="M10 15h25a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V20a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M12 15 31 8a4 4 0 0 1 5 3.8V15"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M32 27h9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

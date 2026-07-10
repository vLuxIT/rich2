"use client";

import { useEffect, useRef, useState } from "react";
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

import { RICH_TOKEN } from "@/lib/token";
import { erc20Abi } from "@/lib/erc20Abi";
import { STAKING_CONTRACT, stakingAbi } from "@/lib/staking";

import PoolStats from "./PoolStats";
import OverviewCards from "./OverviewCards";
import StakingPlans from "./StakingPlans";
import StakeBox from "./StakeBox";

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

export default function StakingDashboard() {
  const router = useRouter();
  const { address } = useAccount();

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

  const planIds = plansData?.[0] || [];
  const durations = plansData?.[1] || [];
  const rewardPercents = plansData?.[2] || [];

  const plans: StakingPlan[] = planIds.map((id, index) => ({
    id: Number(id),
    days: secondsToDays(durations[index]),
    rewardPercent: formatRewardPercent(rewardPercents[index]),
  }));

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) || plans[0] || undefined;

  const rewardPoolRemaining = stats?.[1];
  const rewardsDistributed = stats?.[2];
  const rewardsReserved = stats?.[3];
  const totalStaked = stats?.[4];
  const activeStakeTotal = stats?.[5];
  const activeStakerTotal = stats?.[6];

  const minimumStake = minimumStakeRaw as bigint | undefined;
  const minimumStakeText = formatRIC(minimumStake);

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
    <div className="mx-auto w-full max-w-[520px] pb-6 text-white">
      <div className="mb-6 flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Stake RIC</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Stake your RichCoin and earn rewards.
          </p>
        </div>

        <img
          src="/rc.png"
          alt="RIC"
          className="ml-auto h-20 w-20 rounded-full"
        />
      </div>

      <PoolStats
        rewardPoolRemaining={`${formatRIC(rewardPoolRemaining)} RIC`}
        totalStaked={`${formatRIC(totalStaked)} RIC`}
      />

      <OverviewCards
        userStakeCount={address ? `${Number(userStakeCount || 0)} Active` : "Connect"}
        activeStakers={Number(activeStakerTotal || 0).toLocaleString()}
        activeStakes={Number(activeStakeTotal || 0).toLocaleString()}
        rewardsReserved={`${formatRIC(rewardsReserved)} RIC`}
        rewardsPaid={`${formatRIC(rewardsDistributed)} RIC`}
      />

      <StakingPlans
        plans={plans}
        selectedPlanId={selectedPlan?.id}
        onSelectPlan={setSelectedPlanId}
      />

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
    </div>
  );
}

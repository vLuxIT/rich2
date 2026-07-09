"use client";

import { useEffect, useState } from "react";
import { Clock, Gift, Lock, TrendingUp } from "lucide-react";
import { formatUnits } from "viem";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { STAKING_CONTRACT, stakingAbi } from "@/lib/staking";

const RIC_DECIMALS = 18;

function formatRIC(value?: bigint) {
  if (!value) return "0";

  return Number(formatUnits(value, RIC_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatDate(timestamp?: bigint) {
  if (!timestamp) return "-";

  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCountdown(target?: bigint, currentTime = 0) {
  if (!target || !currentTime) return "-";

  const diff = Number(target) - Math.floor(currentTime / 1000);

  if (diff <= 0) return "Now";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}D ${hours}H ${mins}M`;
  if (hours > 0) return `${hours}H ${mins}M`;

  return `${mins}M`;
}

function getStakeValue(stake: unknown, index: number, key: string) {
  const arrayStake = stake as readonly unknown[];
  const objectStake = stake as Record<string, unknown>;

  if (Array.isArray(arrayStake)) return arrayStake[index];

  return objectStake?.[key];
}

export default function UserStakeCard({
  stakeId,
  userAddress,
}: {
  stakeId: number;
  userAddress: `0x${string}`;
}) {
  const [now, setNow] = useState(0);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [action, setAction] = useState<"claim" | "complete" | null>(null);

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  const { data: stakeRaw, refetch: refetchStake } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "getUserStake",
    args: [userAddress, BigInt(stakeId)],
  });

  const { data: claimableRaw, refetch: refetchClaimable } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "claimableReward",
    args: [userAddress, BigInt(stakeId)],
  });

  const { data: dailyRaw, refetch: refetchDaily } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "dailyEarning",
    args: [userAddress, BigInt(stakeId)],
  });

  const { data: nextClaimRaw, refetch: refetchNextClaim } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "nextClaimTime",
    args: [userAddress, BigInt(stakeId)],
  });

  const stake = stakeRaw as unknown;
  const claimable = claimableRaw as bigint | undefined;
  const daily = dailyRaw as bigint | undefined;
  const nextClaim = nextClaimRaw as bigint | undefined;

  useEffect(() => {
    const updateTime = () => {
      setNow(Date.now());
    };

    updateTime();

    const timer = setInterval(updateTime, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSuccess) return;

    void refetchStake();
    void refetchClaimable();
    void refetchDaily();
    void refetchNextClaim();
  }, [
    isSuccess,
    refetchStake,
    refetchClaimable,
    refetchDaily,
    refetchNextClaim,
  ]);

  if (!stake) return null;

  const amount = getStakeValue(stake, 0, "amount") as bigint;
  const plan = Number(getStakeValue(stake, 1, "plan") || 0);
  const endTime = getStakeValue(stake, 5, "endTime") as bigint;
  const totalReward = getStakeValue(stake, 6, "totalReward") as bigint;
  const rewardClaimed = getStakeValue(stake, 7, "rewardClaimed") as bigint;
  const principalClaimed = Boolean(getStakeValue(stake, 9, "principalClaimed"));

  const matured = now > 0 && Number(endTime) <= Math.floor(now / 1000);
  const claimReady = Boolean(claimable && claimable > BigInt(0));
  const completed = principalClaimed;

  async function claimRewards() {
    try {
      setAction("claim");

      const hash = await writeContractAsync({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "claimRewards",
        args: [BigInt(stakeId)],
      });

      setTxHash(hash);
    } catch (error) {
      console.error("Claim failed:", error);
    }
  }

  async function completeStake() {
    try {
      setAction("complete");

      const hash = await writeContractAsync({
        address: STAKING_CONTRACT,
        abi: stakingAbi,
        functionName: "completeStake",
        args: [BigInt(stakeId)],
      });

      setTxHash(hash);
    } catch (error) {
      console.error("Complete stake failed:", error);
    }
  }

  return (
    <div className="rounded-[24px] border border-zinc-800 bg-[#10141d] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Stake #{stakeId}</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatRIC(amount)} RIC
          </p>
        </div>

        <div className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-400">
          Plan #{plan}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          icon={<Gift size={16} />}
          label="Claimable"
          value={`${formatRIC(claimable)} RIC`}
          highlight
        />

        <MiniStat
          icon={<TrendingUp size={16} />}
          label="Daily Earning"
          value={`${formatRIC(daily)} RIC`}
        />

        <MiniStat
          icon={<Clock size={16} />}
          label="Next Claim"
          value={formatCountdown(nextClaim, now)}
        />

        <MiniStat
          icon={<Lock size={16} />}
          label="Matures"
          value={matured ? "Ready" : formatCountdown(endTime, now)}
        />
      </div>

      <div className="mt-4 rounded-[18px] bg-[#090d15] p-3 text-xs text-zinc-500">
        <div className="flex justify-between">
          <span>Total Reward</span>
          <span className="text-zinc-300">{formatRIC(totalReward)} RIC</span>
        </div>

        <div className="mt-2 flex justify-between">
          <span>Claimed</span>
          <span className="text-zinc-300">{formatRIC(rewardClaimed)} RIC</span>
        </div>

        <div className="mt-2 flex justify-between">
          <span>End Date</span>
          <span className="text-zinc-300">{formatDate(endTime)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={claimRewards}
          disabled={!claimReady || isPending || isConfirming}
          className={`h-11 rounded-[16px] text-sm font-semibold ${
            claimReady && !isPending && !isConfirming
              ? "bg-yellow-400 text-black hover:bg-yellow-300"
              : "cursor-not-allowed bg-zinc-800 text-zinc-500"
          }`}
        >
          Claim Rewards
        </button>

        <button
          type="button"
          onClick={completeStake}
          disabled={!matured || completed || isPending || isConfirming}
          className={`h-11 rounded-[16px] text-sm font-semibold ${
            matured && !completed && !isPending && !isConfirming
              ? "bg-green-400 text-black hover:bg-green-300"
              : "cursor-not-allowed bg-zinc-800 text-zinc-500"
          }`}
        >
          {completed ? "Capital Claimed" : "Claim Capital"}
        </button>
      </div>

      {txHash && (
        <div className="mt-4 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Stake Action</span>

            <span className="text-yellow-400">
              {isConfirming
                ? action === "claim"
                  ? "Claim Pending"
                  : "Capital Claim Pending"
                : isSuccess
                  ? "Confirmed"
                  : "Submitted"}
            </span>
          </div>

          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all text-xs text-yellow-400 hover:underline"
          >
            View on BscScan
          </a>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[16px] bg-[#090d15] p-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className={highlight ? "text-yellow-400" : "text-zinc-500"}>
          {icon}
        </span>

        <span className="text-xs">{label}</span>
      </div>

      <p
        className={`mt-2 text-sm font-semibold ${
          highlight ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

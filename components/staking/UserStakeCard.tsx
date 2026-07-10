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

function ordinal(day: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = day % 100;
  return `${day}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`;
}

function formatFullDateTime(timestamp?: bigint) {
  if (!timestamp) return "-";

  const date = new Date(Number(timestamp) * 1000);
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = ordinal(date.getDate());
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${month}, ${day}, ${year} ${hours}:${minutes}`;
}

function formatCountdownFromSeconds(seconds?: bigint, elapsedSeconds = 0) {
  if (seconds === undefined) return "-";

  const remaining = Math.max(Number(seconds) - elapsedSeconds, 0);

  if (remaining <= 0) return "Now";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  if (days > 0) return `${days}D ${hours}H ${mins}M`;
  if (hours > 0) return `${hours}H ${mins}M`;
  if (mins > 0) return `${mins}M ${secs}S`;

  return `${secs}S`;
}

function formatMaturityCountdown(target?: bigint, now = 0) {
  if (!target || !now) return "-";

  const diff = Number(target) - Math.floor(now / 1000);

  if (diff <= 0) return "Ready";

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
  const [claimCountdownStartedAt, setClaimCountdownStartedAt] = useState(0);
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

  const {
    data: secondsUntilNextClaimRaw,
    refetch: refetchSecondsUntilNextClaim,
  } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "secondsUntilNextClaim",
    args: [userAddress, BigInt(stakeId)],
  });

  const stake = stakeRaw as unknown;
  const claimable = claimableRaw as bigint | undefined;
  const daily = dailyRaw as bigint | undefined;
  const nextClaim = nextClaimRaw as bigint | undefined;
  const secondsUntilNextClaim = secondsUntilNextClaimRaw as bigint | undefined;

  useEffect(() => {
    const updateTime = () => {
      setNow(Date.now());
    };

    updateTime();

    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsUntilNextClaim === undefined) return;
    setClaimCountdownStartedAt(Date.now());
  }, [secondsUntilNextClaim]);

  useEffect(() => {
    if (!isSuccess) return;

    void refetchStake();
    void refetchClaimable();
    void refetchDaily();
    void refetchNextClaim();
    void refetchSecondsUntilNextClaim();
  }, [
    isSuccess,
    refetchStake,
    refetchClaimable,
    refetchDaily,
    refetchNextClaim,
    refetchSecondsUntilNextClaim,
  ]);

  if (!stake) return null;

  const amount = getStakeValue(stake, 0, "amount") as bigint;
  const plan = Number(getStakeValue(stake, 1, "plan") || 0);
  const endTime = getStakeValue(stake, 5, "endTime") as bigint;
  const totalReward = getStakeValue(stake, 6, "totalReward") as bigint;
  const rewardClaimed = getStakeValue(stake, 7, "rewardClaimed") as bigint;
  const principalClaimed = Boolean(getStakeValue(stake, 9, "principalClaimed"));

  const elapsedSeconds = claimCountdownStartedAt
    ? Math.floor((now - claimCountdownStartedAt) / 1000)
    : 0;

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
    <div className="rounded-[20px] border border-zinc-800 bg-[#10141d] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Stake #{stakeId}</p>
          <p className="mt-1 text-xl font-semibold">{formatRIC(amount)} RIC</p>
        </div>

        <div className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
          Plan #{plan}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          icon={<Gift size={15} />}
          label="Claimable"
          value={`${formatRIC(claimable)} RIC`}
          highlight
        />

        <MiniStat
          icon={<TrendingUp size={15} />}
          label="Daily Earning"
          value={`${formatRIC(daily)} RIC`}
        />

        <MiniStat
          icon={<Clock size={15} />}
          label="Next Claim In"
          value={formatCountdownFromSeconds(
            secondsUntilNextClaim,
            elapsedSeconds
          )}
        />

        <MiniStat
          icon={<Lock size={15} />}
          label="Matures In"
          value={formatMaturityCountdown(endTime, now)}
        />
      </div>

      <div className="mt-4 rounded-[16px] bg-[#090d15] p-3 text-xs text-zinc-500">
        <div className="flex justify-between">
          <span>Next Claim Time</span>
          <span className="text-right text-zinc-300">
            {formatFullDateTime(nextClaim)}
          </span>
        </div>

        <div className="mt-2 flex justify-between">
          <span>Total Reward</span>
          <span className="text-zinc-300">{formatRIC(totalReward)} RIC</span>
        </div>

        <div className="mt-2 flex justify-between">
          <span>Claimed</span>
          <span className="text-zinc-300">{formatRIC(rewardClaimed)} RIC</span>
        </div>

        <div className="mt-2 flex justify-between">
          <span>Capital Unlocks</span>
          <span className="text-right text-zinc-300">
            {formatFullDateTime(endTime)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={claimRewards}
          disabled={!claimReady || isPending || isConfirming}
          className={`h-10 rounded-[14px] text-xs font-semibold ${
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
          className={`h-10 rounded-[14px] text-xs font-semibold ${
            matured && !completed && !isPending && !isConfirming
              ? "bg-green-400 text-black hover:bg-green-300"
              : "cursor-not-allowed bg-zinc-800 text-zinc-500"
          }`}
        >
          {completed ? "Capital Claimed" : "Claim Capital"}
        </button>
      </div>

      {txHash && (
        <div className="mt-4 rounded-[16px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-3 text-xs">
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
            className="mt-2 block break-all text-[11px] text-yellow-400 hover:underline"
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
    <div className="rounded-[14px] bg-[#090d15] p-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className={highlight ? "text-yellow-400" : "text-zinc-500"}>
          {icon}
        </span>

        <span className="text-[11px]">{label}</span>
      </div>

      <p
        className={`mt-2 text-xs font-semibold ${
          highlight ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

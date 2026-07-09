"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";

import { STAKING_CONTRACT, stakingAbi } from "@/lib/staking";
import UserStakeCard from "./UserStakeCard";

export default function UserStakes() {
  const { address } = useAccount();

  const { data: stakeCount } = useReadContract({
    address: STAKING_CONTRACT,
    abi: stakingAbi,
    functionName: "getUserStakeCount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const stakeIds = useMemo(() => {
    const count = Number(stakeCount || 0);

    return Array.from({ length: count }, (_, index) => index);
  }, [stakeCount]);

  if (!address) {
    return (
      <div className="mt-6 rounded-[20px] border border-zinc-800 bg-[#10141d] p-5 text-center text-sm text-zinc-400">
        Connect wallet to view your stakes.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">My Stakes</h2>

      {stakeIds.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-zinc-800 bg-[#10141d] p-5 text-center text-sm text-zinc-400">
          You do not have any stakes yet.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {stakeIds.map((stakeId) => (
            <UserStakeCard
              key={stakeId}
              stakeId={stakeId}
              userAddress={address}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default function PoolStats({
  rewardPoolRemaining,
  totalStaked,
}: {
  rewardPoolRemaining: string;
  totalStaked: string;
}) {
  return (
    <div className="rounded-[22px] border border-zinc-800 bg-[#10141d] p-5">
      <p className="text-sm text-zinc-400">Reward Pool Balance</p>

      <p className="mt-3 text-3xl font-semibold">
        {rewardPoolRemaining}
      </p>

      <p className="mt-1 text-sm text-zinc-500">
        Total staked: {totalStaked}
      </p>
    </div>
  );
}
export default function PoolStats({
  rewardPoolRemaining,
  totalStaked,
}: {
  rewardPoolRemaining: string;
  totalStaked: string;
}) {
  return (
    <div className="rounded-[18px] border border-zinc-800 bg-[#10141d] p-4">
      <p className="text-xs text-zinc-400">Reward Pool Balance</p>

      <p className="mt-2 text-2xl font-semibold">{rewardPoolRemaining}</p>

      <p className="mt-1 text-xs text-zinc-500">
        Total staked: {totalStaked}
      </p>
    </div>
  );
}
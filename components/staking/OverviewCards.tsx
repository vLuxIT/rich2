import { Clock, Gift, Lock, TrendingUp, Wallet } from "lucide-react";

export default function OverviewCards({
  userStakeCount,
  activeStakers,
  activeStakes,
  rewardsReserved,
  rewardsPaid,
}: {
  userStakeCount: string;
  activeStakers: string;
  activeStakes: string;
  rewardsReserved: string;
  rewardsPaid: string;
}) {
  return (
    <>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Staking Overview</h2>
       <a href="/user-stakes" className="text-sm text-yellow-400">
  My Stakes →
</a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-[22px] border border-zinc-800 bg-[#10141d] p-4">
        <OverviewCard title="Your Stakes" value={userStakeCount} icon={<Lock />} />
        <OverviewCard title="Active Stakers" value={activeStakers} icon={<Wallet />} />
        <OverviewCard title="Active Stakes" value={activeStakes} icon={<TrendingUp />} />
        <OverviewCard title="Claim Interval" value="7 Days" icon={<Clock />} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoCard
          title="Rewards Reserved"
          value={rewardsReserved}
          note="Reserved for active stakes"
          icon={<TrendingUp />}
          green
        />

        <InfoCard
          title="Rewards Paid"
          value={rewardsPaid}
          note="Total rewards distributed"
          icon={<Gift />}
        />
      </div>
    </>
  );
}

function OverviewCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-[#090d15] p-3">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>

      <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
        {icon}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  note,
  icon,
  green = false,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-zinc-800 bg-[#10141d] p-4">
      <p className="text-sm text-zinc-400">{title}</p>

      <div className="mt-3 flex items-center justify-between">
        <p
          className={`text-2xl font-bold ${
            green ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {value}
        </p>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500">{note}</p>
    </div>
  );
}
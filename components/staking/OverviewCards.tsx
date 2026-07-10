import Link from "next/link";
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
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">My Staking Overview</h2>

        <Link href="/user-stakes" className="text-xs text-yellow-400">
          My Stakes →
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-[18px] border border-zinc-800 bg-[#10141d] p-3">
        <OverviewCard title="Your Stakes" value={userStakeCount} icon={<Lock size={16} />} />
        <OverviewCard title="Active Stakers" value={activeStakers} icon={<Wallet size={16} />} />
        <OverviewCard title="Active Stakes" value={activeStakes} icon={<TrendingUp size={16} />} />
        <OverviewCard title="Claim Interval" value="7 Days" icon={<Clock size={16} />} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoCard
          title="Rewards Reserved"
          value={rewardsReserved}
          note="For active stakes"
          icon={<TrendingUp size={18} />}
          green
        />

        <InfoCard
          title="Rewards Paid"
          value={rewardsPaid}
          note="Distributed rewards"
          icon={<Gift size={18} />}
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
    <div className="rounded-[14px] bg-[#090d15] p-3">
      <p className="text-[11px] text-zinc-500">{title}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>

      <div className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
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
    <div className="rounded-[18px] border border-zinc-800 bg-[#10141d] p-3">
      <p className="text-xs text-zinc-400">{title}</p>

      <div className="mt-2 flex items-center justify-between">
        <p
          className={`text-lg font-bold ${
            green ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {value}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-zinc-500">{note}</p>
    </div>
  );
}
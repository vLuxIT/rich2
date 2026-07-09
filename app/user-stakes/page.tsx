import UserStakes from "@/components/staking/UserStakes";

export default function UserStakesPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] pb-6 text-white">
      <h1 className="text-3xl font-semibold">My Stakes</h1>
      <p className="mt-2 text-sm text-zinc-400">
        View your active stakes, claim rewards, and withdraw capital when due.
      </p>

      <UserStakes />
    </div>
  );
}
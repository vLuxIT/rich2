import { Check } from "lucide-react";
import type { StakingPlan } from "./StakingDashboard";

export default function StakingPlans({
  plans,
  selectedPlanId,
  onSelectPlan,
}: {
  plans: StakingPlan[];
  selectedPlanId?: number;
  onSelectPlan: (id: number) => void;
}) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">Staking Plans</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {plans.length > 0 ? (
          plans.map((plan) => {
            const selected = plan.id === selectedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={`relative rounded-[18px] border bg-[#10141d] p-4 text-center transition ${
                  selected
                    ? "border-yellow-400"
                    : "border-zinc-800 hover:border-yellow-700"
                }`}
              >
                {selected && (
                  <span className="absolute left-3 top-0 -translate-y-1/2 rounded-full bg-yellow-400 px-3 py-0.5 text-[10px] font-semibold text-black">
                    Selected
                  </span>
                )}

                <p className="text-lg font-semibold">{plan.days} Days</p>

                <p className="text-xs text-zinc-500">Plan #{plan.id}</p>

                <p className="mt-4 text-3xl font-bold text-green-400">
                  {plan.rewardPercent}
                </p>

                <p className="mt-1 text-xs text-zinc-500">Total Rewards</p>

                <div className="mt-4 flex justify-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      selected
                        ? "border-green-400 bg-green-400 text-black"
                        : "border-zinc-500"
                    }`}
                  >
                    {selected && <Check size={14} />}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 rounded-[18px] border border-zinc-800 bg-[#10141d] p-4 text-center text-sm text-zinc-400">
            Loading staking plans...
          </div>
        )}
      </div>
    </>
  );
}
"use client";

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
      <h2 className="mt-4 text-sm font-semibold text-white">
        Staking Plans
      </h2>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {plans.length > 0 ? (
          plans.map((plan) => {
            const selected = plan.id === selectedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={`relative rounded-[14px] border bg-[#10141d] p-2.5 text-center transition-all duration-200 ${
                  selected
                    ? "border-yellow-400 shadow-[0_0_0_1px_rgba(250,204,21,.25)]"
                    : "border-zinc-800 hover:border-yellow-700"
                }`}
              >
                {selected && (
                  <span className="absolute left-2 top-0 -translate-y-1/2 rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-semibold text-black">
                    Selected
                  </span>
                )}

                <p className="text-sm font-semibold text-white">
                  {plan.days} Days
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Plan #{plan.id}
                </p>

                <p className="mt-2 text-2xl font-bold text-green-400">
                  {plan.rewardPercent}
                </p>

                <p className="mt-1 text-[10px] text-zinc-500">
                  Total Reward
                </p>

                <div className="mt-2 flex justify-center">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                      selected
                        ? "border-green-400 bg-green-400 text-black"
                        : "border-zinc-500"
                    }`}
                  >
                    {selected && <Check size={10} strokeWidth={3} />}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 rounded-[14px] border border-zinc-800 bg-[#10141d] p-3 text-center text-xs text-zinc-400">
            Loading staking plans...
          </div>
        )}
      </div>
    </>
  );
}

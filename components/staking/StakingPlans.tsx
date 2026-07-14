"use client";

import { CalendarDays, Check } from "lucide-react";
import type { StakingPlan } from "./StakingDashboard";

function getMonthLabel(days: number) {
  if (days <= 31) return "1 Month";
  if (days <= 95) return "3 Months";
  if (days <= 190) return "6 Months";
  return "12 Months";
}

function getAccent(index: number, selected: boolean) {
  if (selected) {
    return "border-[#FFC928] shadow-[0_0_0_1px_rgba(255,201,40,0.35)]";
  }

  const accents = [
    "border-[#19C46B]/40 hover:border-[#19C46B]",
    "border-[#1250FF]/40 hover:border-[#1250FF]",
    "border-[#8B35FF]/40 hover:border-[#8B35FF]",
    "border-[#FFC928]/40 hover:border-[#FFC928]",
  ];

  return accents[index % accents.length];
}

export default function StakingPlans({
  plans,
  selectedPlanId,
  onSelectPlan,
}: {
  plans: StakingPlan[];
  selectedPlanId?: number;
  onSelectPlan: (id: number) => void;
}) {
  const recommendedPlanId = plans[plans.length - 1]?.id;

  return (
    <section>
      <h2 className="mb-3 text-base font-black text-white md:text-lg">Staking Plans</h2>

      {plans.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {plans.map((plan, index) => {
            const selected = plan.id === selectedPlanId;
            const recommended = plan.id === recommendedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={[
                  "relative min-h-[150px] rounded-2xl border bg-[#10131A] p-3 text-center transition-all duration-200 md:min-h-[160px] md:p-4",
                  getAccent(index, selected),
                ].join(" ")}
              >
                {recommended ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFC928] px-3 py-1 text-[9px] font-black text-[#05070B] md:text-[10px]">
                    Recommended
                  </span>
                ) : null}

                <div
                  className={[
                    "mx-auto grid h-10 w-10 place-items-center rounded-full border md:h-11 md:w-11",
                    selected
                      ? "border-[#19C46B] bg-[#19C46B]/10 text-[#19C46B]"
                      : "border-white/20 bg-white/[0.03] text-[#A4AAB7]",
                  ].join(" ")}
                >
                  <CalendarDays size={20} />
                </div>

                <p className="mt-3 text-base font-black text-white md:mt-4 md:text-lg">
                  {plan.days} Days
                </p>

                <p className="mt-1 text-xs text-[#A4AAB7] md:text-sm">
                  ({getMonthLabel(plan.days)})
                </p>

                <p className="mt-3 text-xl font-black text-[#19C46B] md:mt-4 md:text-2xl">
                  {plan.rewardPercent}
                </p>

                <p className="mt-1 text-[11px] text-[#A4AAB7] md:text-xs">
                  Total Rewards
                </p>

                <span
                  className={[
                    "mx-auto mt-3 grid h-7 w-7 place-items-center rounded-full border md:mt-4",
                    selected
                      ? "border-[#19C46B] bg-[#19C46B] text-[#05070B]"
                      : "border-[#A4AAB7] text-transparent",
                  ].join(" ")}
                >
                  <Check size={17} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#10131A] p-5 text-sm text-[#A4AAB7]">
          Loading staking plans...
        </div>
      )}
    </section>
  );
}

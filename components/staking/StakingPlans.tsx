"use client";

import { Check, CalendarDays } from "lucide-react";
import type { StakingPlan } from "./StakingDashboard";

function getMonthLabel(days: number) {
  if (days <= 31) return "1 Month";
  if (days <= 95) return "3 Months";
  if (days <= 190) return "6 Months";
  return "12 Months";
}

function getAccent(index: number, selected: boolean) {
  if (selected) return "border-[#FFC928] shadow-[0_0_0_1px_rgba(255,201,40,0.35)]";

  const accents = [
    "border-[#FFC928]/40 hover:border-[#FFC928]",
    "border-[#1250FF]/40 hover:border-[#1250FF]",
    "border-[#8B35FF]/40 hover:border-[#8B35FF]",
    "border-[#F59E0B]/40 hover:border-[#F59E0B]",
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
  return (
    <section>
      <h2 className="mb-3 text-lg font-black text-white">Staking Plans</h2>

      {plans.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {plans.map((plan, index) => {
            const selected = plan.id === selectedPlanId;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={[
                  "relative min-h-[168px] rounded-2xl border bg-[#10131A] p-4 text-center transition-all duration-200",
                  getAccent(index, selected),
                ].join(" ")}
              >
                {index === 0 ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFC928] px-3 py-1 text-[10px] font-black text-[#05070B]">
                    Recommended
                  </span>
                ) : null}

                <div
                  className={[
                    "mx-auto grid h-11 w-11 place-items-center rounded-full border",
                    selected
                      ? "border-[#19C46B] bg-[#19C46B]/10 text-[#19C46B]"
                      : "border-white/20 bg-white/[0.03] text-[#A4AAB7]",
                  ].join(" ")}
                >
                  <CalendarDays size={22} />
                </div>

                <p className="mt-4 text-lg font-black text-white">
                  {plan.days} Days
                </p>

                <p className="mt-1 text-sm text-[#A4AAB7]">
                  ({getMonthLabel(plan.days)})
                </p>

                <p className="mt-4 text-2xl font-black text-[#19C46B]">
                  {plan.rewardPercent}
                </p>

                <p className="mt-1 text-xs text-[#A4AAB7]">Total Rewards</p>

                <span
                  className={[
                    "mx-auto mt-4 grid h-7 w-7 place-items-center rounded-full border",
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

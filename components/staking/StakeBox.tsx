import type { StakingPlan } from "./StakingDashboard";

function cleanNumber(value: string) {
  return value.replace(/,/g, "");
}

function formatNumber(value: string | number) {
  const num = Number(value);

  if (!value || Number.isNaN(num)) return "0";

  return num.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

export default function StakeBox({
  stakeAmount,
  setStakeAmount,
  balance,
  selectedPlan,
  hasAmount,
  insufficientBalance,
  belowMinimumStake,
  minimumStakeText,
  needsApproval,
  isPending,
  isConfirming,
  txType,
  isSuccess,
  txHash,
  onApprove,
  onStake,
}: {
  stakeAmount: string;
  setStakeAmount: (value: string) => void;
  balance: string;
  selectedPlan?: StakingPlan;
  hasAmount: boolean;
  insufficientBalance: boolean;
  belowMinimumStake: boolean;
  minimumStakeText: string;
  needsApproval: boolean;
  isPending: boolean;
  isConfirming: boolean;
  txType: "approve" | "stake" | null;
  isSuccess: boolean;
  txHash?: `0x${string}`;
  onApprove: () => void;
  onStake: () => void;
}) {
  function handleAmountChange(value: string) {
    const clean = cleanNumber(value);

    if (clean === "" || /^[0-9]*\.?[0-9]*$/.test(clean)) {
      setStakeAmount(clean);
    }
  }

  function useMax() {
    setStakeAmount(balance || "0");
  }

  const disabled = isPending || isConfirming;

  let buttonText = "Enter Amount";
  let buttonAction: (() => void) | undefined;
  let buttonDisabled = true;

  if (insufficientBalance) {
    buttonText = "Insufficient RIC Balance";
  } else if (belowMinimumStake) {
    buttonText = `Minimum ${minimumStakeText} RIC`;
  } else if (hasAmount && needsApproval) {
    buttonText = disabled ? "Approving..." : "Approve RIC";
    buttonAction = onApprove;
    buttonDisabled = disabled;
  } else if (hasAmount && !needsApproval) {
    buttonText = disabled ? "Staking..." : "Stake RIC";
    buttonAction = onStake;
    buttonDisabled = disabled;
  }

  return (
    <div className="mt-5 rounded-[20px] border border-zinc-800 bg-[#10141d] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Stake Amount</h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            Selected:{" "}
            {selectedPlan
              ? `${selectedPlan.days} days / ${selectedPlan.rewardPercent}`
              : "None"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Minimum stake: {minimumStakeText} RIC
          </p>
        </div>

        <button
          type="button"
          onClick={useMax}
          className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400 hover:bg-yellow-400/20"
        >
          MAX
        </button>
      </div>

      <div className="rounded-[16px] bg-[#090d15] p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>You stake</span>
          <span>Balance: {formatNumber(balance)} RIC</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={stakeAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[24px] font-semibold text-white outline-none"
          />

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-sm font-semibold text-white">
            <img src="/rc.png" alt="RIC" className="h-6 w-6 rounded-full" />
            <span>RIC</span>
          </div>
        </div>
      </div>

      {belowMinimumStake && hasAmount && (
        <p className="mt-2 text-xs text-yellow-400">
          Minimum stake is {minimumStakeText} RIC.
        </p>
      )}

      <button
        type="button"
        onClick={buttonAction}
        disabled={buttonDisabled}
        className={`mt-4 h-11 w-full rounded-[16px] text-sm font-semibold ${
          buttonDisabled
            ? "cursor-not-allowed bg-gradient-to-r from-[#D4AF37]/50 via-[#FFD700]/50 to-[#FFB300]/50 text-black/50"
            : "bg-yellow-400 text-black hover:bg-yellow-300"
        }`}
      >
        {buttonText}
      </button>

      {txHash && (
        <div className="mt-3 rounded-[16px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Transaction</span>

            <span className="text-yellow-400">
              {isConfirming
                ? txType === "approve"
                  ? "Approval Pending"
                  : "Stake Pending"
                : isSuccess
                  ? "Confirmed"
                  : "Submitted"}
            </span>
          </div>

          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block break-all text-[11px] text-yellow-400 hover:underline"
          >
            View on BscScan
          </a>
        </div>
      )}
    </div>
  );
}

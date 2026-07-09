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
    <div className="mt-6 rounded-[24px] border border-zinc-800 bg-[#10141d] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Stake Amount</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Selected plan:{" "}
            {selectedPlan
              ? `${selectedPlan.days} days / ${selectedPlan.rewardPercent}`
              : "None"}
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

      <div className="rounded-[18px] bg-[#090d15] p-3">
        <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
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
            className="min-w-0 flex-1 bg-transparent text-[26px] font-semibold text-white outline-none"
          />

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-sm font-semibold text-white">
            <img
              src="/rc.png"
              alt="RIC"
              className="h-7 w-7 rounded-full"
            />
            <span>RIC</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={buttonAction}
        disabled={buttonDisabled}
        className={`mt-5 h-12 w-full rounded-[18px] text-base font-semibold ${
          buttonDisabled
            ? "cursor-not-allowed bg-gradient-to-r from-[#D4AF37]/50 via-[#FFD700]/50 to-[#FFB300]/50 text-black/50"
            : "bg-yellow-400 text-black hover:bg-yellow-300"
        }`}
      >
        {buttonText}
      </button>

      {txHash && (
        <div className="mt-4 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4 text-sm">
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
            className="mt-3 block break-all text-xs text-yellow-400 hover:underline"
          >
            View on BscScan
          </a>
        </div>
      )}
    </div>
  );
}
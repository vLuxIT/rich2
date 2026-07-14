import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ExternalLink, LockKeyhole } from "lucide-react";

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
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div>
        <h2 className="text-lg font-black text-white md:text-xl">Stake RIC Now</h2>
        <p className="mt-2 text-xs leading-5 text-[#A4AAB7] md:text-sm">
          Connect your wallet, enter an amount, choose a plan, and stake.
        </p>
      </div>

      <div className="relative mx-auto my-5 h-24 w-40 md:h-28 md:w-44">
        <div className="absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 rounded-full bg-[#FFC928]/10 blur-2xl" />
        <img
          src="/rc.png"
          alt="RIC"
          className="absolute left-1/2 top-2 h-20 w-20 -translate-x-1/2 object-contain md:h-24 md:w-24"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0D1118] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-[#A4AAB7] md:text-sm">You stake</span>
          <button
            type="button"
            onClick={useMax}
            className="rounded-full bg-[#FFC928]/10 px-3 py-1 text-[11px] font-bold text-[#FFC928] md:text-xs"
          >
            MAX
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={stakeAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="min-w-0 flex-1 bg-transparent text-xl font-black text-white outline-none placeholder:text-[#606879] md:text-2xl"
          />

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-xs font-bold text-white md:text-sm">
            <img src="/rc.png" alt="RIC" className="h-6 w-6 rounded-full md:h-7 md:w-7" />
            RIC
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-[#A4AAB7] md:text-xs">
          <span>Balance: {formatNumber(balance)} RIC</span>
          <span>Min: {minimumStakeText} RIC</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D1118] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A4AAB7] md:text-sm">Selected Plan</span>
          <span className="text-xs font-bold text-white md:text-sm">
            {selectedPlan
              ? `${selectedPlan.days} Days / ${selectedPlan.rewardPercent}`
              : "None"}
          </span>
        </div>

        {belowMinimumStake && hasAmount ? (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Minimum stake is {minimumStakeText} RIC.
          </p>
        ) : null}
      </div>

      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, openChainModal }) => {
          const connected = account && chain;

          if (!connected) {
            return (
              <button
                type="button"
                onClick={openConnectModal}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-bold text-[#05070B] hover:bg-yellow-300 md:text-base"
              >
                <LockKeyhole size={18} />
                Connect Wallet to Stake
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                type="button"
                onClick={openChainModal}
                className="mt-5 h-12 w-full rounded-xl bg-red-500 text-sm font-bold text-white md:text-base"
              >
                Wrong Network
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={buttonAction}
              disabled={buttonDisabled}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-bold text-[#05070B] hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
            >
              <LockKeyhole size={18} />
              {buttonText}
            </button>
          );
        }}
      </ConnectButton.Custom>

      {txHash ? (
        <div className="mt-4 rounded-2xl border border-[#FFC928]/20 bg-[#FFC928]/10 p-3 text-sm">
          <p className="text-white">
            Transaction{" "}
            {isConfirming
              ? txType === "approve"
                ? "Approval Pending"
                : "Stake Pending"
              : isSuccess
                ? "Confirmed"
                : "Submitted"}
          </p>

          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#FFC928]"
          >
            View on BscScan
            <ExternalLink size={13} />
          </a>
        </div>
      ) : null}
    </section>
  );
}

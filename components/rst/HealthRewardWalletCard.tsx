"use client";

import { Copy, Gift, Wallet } from "lucide-react";

export default function HealthRewardWalletCard({
  address,
  isCreating,
  error,
  onCreate,
}: {
  address?: string | null;
  isCreating: boolean;
  error?: string | null;
  onCreate: () => void;
}) {
  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#19C46B]/12 text-[#19C46B]">
          <Gift size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-white">
            Health Rewards Wallet
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
            This wallet receives the 5% health reward part from RST profit
            claims. Only the address is shown.
          </p>
        </div>
      </div>

      {address ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D1118] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-[#A4AAB7]">
            <Wallet size={15} />
            Wallet Address
          </div>

          <p className="break-all text-sm font-semibold leading-6 text-white">
            {address}
          </p>

          <button
            type="button"
            onClick={copyAddress}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-xs font-black text-[#05070B]"
          >
            <Copy size={16} />
            Copy Address
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Gift size={17} />
          {isCreating ? "Creating..." : "Create Health Rewards Wallet"}
        </button>
      )}

      {error ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}

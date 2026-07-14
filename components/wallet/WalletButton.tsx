"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

type WalletButtonProps = {
  className?: string;
  fullWidth?: boolean;
};

export default function WalletButton({
  className = "",
  fullWidth = false,
}: WalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={[
                fullWidth ? "w-full" : "",
                "h-10 rounded-xl bg-[#FFC928] px-5 text-sm font-bold text-[#05070B] transition hover:bg-yellow-300",
                "md:h-10 md:px-5",
                className,
              ].join(" ")}
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={[
                fullWidth ? "w-full" : "",
                "h-10 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-400",
                className,
              ].join(" ")}
            >
              Wrong Network
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className={[
              fullWidth ? "w-full" : "",
              "flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#10131A] px-4 text-sm font-bold text-white transition hover:border-[#FFC928]/40 hover:bg-white/[0.06]",
              className,
            ].join(" ")}
          >
            <span className="h-2 w-2 rounded-full bg-[#19C46B]" />

            <span className="max-w-[120px] truncate">
              {account.displayName}
            </span>

            {account.displayBalance ? (
              <span className="hidden text-xs font-medium text-[#A4AAB7] xl:inline">
                {account.displayBalance}
              </span>
            ) : null}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
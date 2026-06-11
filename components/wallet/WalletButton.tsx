"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletButton({
  fullWidth = false,
}: {
  fullWidth?: boolean;
}) {
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

        const buttonClass = fullWidth
          ? "h-14 w-full rounded-[20px] bg-yellow-400 text-lg font-semibold text-black hover:bg-yellow-300 transition"
          : "rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition";

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={buttonClass}
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
              className={
                fullWidth
                  ? "h-14 w-full rounded-[20px] bg-red-500 text-lg font-semibold text-white"
                  : "rounded-xl bg-red-500 px-4 py-2 font-semibold text-white"
              }
            >
              Wrong Network
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className={buttonClass}
          >
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
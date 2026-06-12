"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const DAPP_URL =
  typeof window !== "undefined"
    ? window.location.href
    : "https://yourdomain.com";

function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openMetaMask() {
  const url = DAPP_URL.replace(/^https?:\/\//, "");
  window.location.href = `https://metamask.app.link/dapp/${url}`;
}

function openTrustWallet() {
  window.location.href = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(
    DAPP_URL
  )}`;
}

function openOkxWallet() {
  window.location.href = `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(
    DAPP_URL
  )}`;
}

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
          ? "h-14 w-full rounded-[20px] bg-yellow-400 text-lg font-semibold text-black transition hover:bg-yellow-300"
          : "rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black transition hover:bg-yellow-300";

        if (!connected) {
          if (isMobileBrowser() && fullWidth) {
            return (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openMetaMask}
                  className={buttonClass}
                >
                  Open in MetaMask
                </button>

                <button
                  type="button"
                  onClick={openTrustWallet}
                  className={buttonClass}
                >
                  Open in Trust Wallet
                </button>

                <button
                  type="button"
                  onClick={openOkxWallet}
                  className={buttonClass}
                >
                  Open in OKX Wallet
                </button>

                <button
                  type="button"
                  onClick={openConnectModal}
                  className="h-12 w-full rounded-[18px] border border-zinc-700 text-sm font-medium text-zinc-300"
                >
                  Other Wallets
                </button>
              </div>
            );
          }

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
              Switch to BSC
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
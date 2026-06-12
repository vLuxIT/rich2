"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getDappUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function openMetaMask() {
  const url = getDappUrl().replace(/^https?:\/\//, "");
  window.location.href = `https://metamask.app.link/dapp/${url}`;
}

function openTrustWallet() {
  window.location.href = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(
    getDappUrl()
  )}`;
}

function openOkxWallet() {
  window.location.href = `https://www.okx.com/download?deeplink=${encodeURIComponent(
    `okx://wallet/dapp/details?dappUrl=${encodeURIComponent(getDappUrl())}`
  )}`;
}

function openBitgetWallet() {
  window.location.href = `https://bkcode.vip?action=dapp&url=${encodeURIComponent(
    getDappUrl()
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
          if (isMobileBrowser()) {
            return (
              <div className={fullWidth ? "w-full space-y-3" : "relative"}>
                <button
                  type="button"
                  onClick={openMetaMask}
                  className={buttonClass}
                >
                  Open Wallet
                </button>

                {fullWidth && (
                  <>
                    <button type="button" onClick={openTrustWallet} className={buttonClass}>
                      Open Trust Wallet
                    </button>

                    <button type="button" onClick={openOkxWallet} className={buttonClass}>
                      Open OKX Wallet
                    </button>

                    <button type="button" onClick={openBitgetWallet} className={buttonClass}>
                      Open Bitget Wallet
                    </button>

                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="h-12 w-full rounded-[18px] border border-zinc-700 text-sm font-medium text-zinc-300"
                    >
                      Other Wallets
                    </button>
                  </>
                )}
              </div>
            );
          }

          return (
            <button type="button" onClick={openConnectModal} className={buttonClass}>
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
          <button type="button" onClick={openAccountModal} className={buttonClass}>
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { X } from "lucide-react";

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
  const deepLink = `okx://wallet/dapp/details?dappUrl=${encodeURIComponent(
    getDappUrl()
  )}`;

  window.location.href = `https://www.okx.com/download?deeplink=${encodeURIComponent(
    deepLink
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
  const [showMobileWallets, setShowMobileWallets] = useState(false);

  return (
    <>
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
                <button
                  type="button"
                  onClick={() => setShowMobileWallets(true)}
                  className={buttonClass}
                >
                  Connect Wallet
                </button>
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

      {showMobileWallets && (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <div className="fixed inset-0 z-[9999] flex items-end bg-black/70 px-4 pb-6">
              <div className="w-full rounded-[24px] border border-zinc-800 bg-[#10141d] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Choose Wallet
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowMobileWallets(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={openMetaMask}
                    className="flex h-13 w-full items-center justify-center rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300"
                  >
                    Open MetaMask
                  </button>

                  <button
                    type="button"
                    onClick={openTrustWallet}
                    className="flex h-13 w-full items-center justify-center rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300"
                  >
                    Open Trust Wallet
                  </button>

                  <button
                    type="button"
                    onClick={openOkxWallet}
                    className="flex h-13 w-full items-center justify-center rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300"
                  >
                    Open OKX Wallet
                  </button>

                  <button
                    type="button"
                    onClick={openBitgetWallet}
                    className="flex h-13 w-full items-center justify-center rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300"
                  >
                    Open Bitget Wallet
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileWallets(false);
                      openConnectModal?.();
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-[18px] border border-zinc-700 text-sm font-medium text-zinc-300 hover:border-yellow-400 hover:text-yellow-400"
                  >
                    WalletConnect / Other Wallets
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-zinc-500">
                  If your wallet does not open, copy the site link and open it
                  inside your wallet browser.
                </p>
              </div>
            </div>
          )}
        </ConnectButton.Custom>
      )}
    </>
  );
}
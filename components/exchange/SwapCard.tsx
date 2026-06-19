"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, maxUint256, parseUnits } from "viem";
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Settings,
  X,
} from "lucide-react";

import { RICH_TOKEN, USDT_TOKEN, type SwapToken } from "@/lib/token";
import {
  PANCAKE_V2_ROUTER,
  pancakeV2RouterAbi,
} from "@/lib/pancake";
import { erc20Abi } from "@/lib/erc20Abi";

function cleanNumber(value: string) {
  return value.replace(/,/g, "");
}

function formatNumber(value: string | number) {
  const num = Number(value);

  if (!value || Number.isNaN(num)) return "";

  return num.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

function formatQuote(value: string | number) {
  const num = Number(value);

  if (!value || Number.isNaN(num)) return "";

  if (num > 0 && num < 0.000001) {
    return num.toLocaleString("en-US", {
      maximumFractionDigits: 12,
    });
  }

  return num.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

export default function SwapCard() {
  const { address } = useAccount();

  const [payToken, setPayToken] = useState<SwapToken>(USDT_TOKEN);
  const [receiveToken, setReceiveToken] = useState<SwapToken>(RICH_TOKEN);
  const [payAmount, setPayAmount] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState("5.0");
  const [deadlineMinutes, setDeadlineMinutes] = useState("10");

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"approve" | "swap">("swap");
  const [referralRecorded, setReferralRecorded] = useState(false);
  const [autoSwapStarted, setAutoSwapStarted] = useState(false);

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
      query: {
        enabled: Boolean(txHash),
      },
    });

  const { data: payTokenBalance } = useBalance({
    address,
    token: payToken.address,
    query: {
      enabled: Boolean(address),
    },
  });

  const { data: receiveTokenBalance } = useBalance({
    address,
    token: receiveToken.address,
    query: {
      enabled: Boolean(address),
    },
  });

  const userBalance = Number(payTokenBalance?.formatted || 0);
  const numericPayAmount = Number(cleanNumber(payAmount));

  const amountIn =
    payAmount && numericPayAmount > 0
      ? parseUnits(payAmount, payToken.decimals)
      : undefined;

  const path = [payToken.address, receiveToken.address] as const;

  const { data: quoteData, isLoading: isQuoteLoading } = useReadContract({
    abi: pancakeV2RouterAbi,
    address: PANCAKE_V2_ROUTER,
    functionName: "getAmountsOut",
    args: amountIn ? [amountIn, path] : undefined,
    query: {
      enabled: Boolean(amountIn),
    },
  });

  const receiveAmount =
    quoteData && quoteData.length > 1
      ? formatUnits(quoteData[quoteData.length - 1], receiveToken.decimals)
      : "";

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: payToken.address,
    functionName: "allowance",
    args: address ? [address, PANCAKE_V2_ROUTER] : undefined,
    query: {
      enabled: Boolean(address && amountIn),
    },
  });

  const needsApproval = Boolean(
    amountIn && allowance !== undefined && allowance < amountIn
  );

async function executeSwap() {
  try {
    if (!address || !amountIn || !quoteData || quoteData.length < 2) {
      return;
    }

    setTxType("swap");

    const outputAmount = quoteData[quoteData.length - 1];

    const slippageBps = BigInt(Math.floor(Number(slippage) * 100));
    const bps = BigInt(10000);

    const isSellingRich =
      payToken.symbol === "RIC" &&
      receiveToken.symbol === "USDT";

    const amountOutMin = isSellingRich
      ? BigInt(0)
      : (outputAmount * (bps - slippageBps)) / bps;

    const deadline = BigInt(
      Math.floor(Date.now() / 1000) +
        Number(deadlineMinutes || "20") * 60
    );

    const hash = await writeContractAsync({
      abi: pancakeV2RouterAbi,
      address: PANCAKE_V2_ROUTER,
      functionName: isSellingRich
        ? "swapExactTokensForTokensSupportingFeeOnTransferTokens"
        : "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, path, address, deadline],
    });

    setTxHash(hash);
    setShowTxModal(true);
  } catch (error) {
    console.error("Swap failed:", error);
  }
}

  useEffect(() => {
    if (!isTxSuccess || !txHash) return;

    let cancelled = false;

  async function handleConfirmedTx() {
  await refetchAllowance();

  if (txType === "approve") {
    if (!autoSwapStarted && !cancelled) {
      console.log("Approval confirmed. Starting swap...");
      setAutoSwapStarted(true);
      await executeSwap();
    }

    return;
  }

  if (txType !== "swap") {
    console.log("Skipping referral: txType is not swap");
    return;
  }

  if (referralRecorded) {
    console.log("Skipping referral: already recorded");
    return;
  }

  if (!address) {
    console.log("Skipping referral: no wallet address");
    return;
  }

  const pendingReferrer = localStorage.getItem(
    "richcoin_pending_referrer"
  );

  console.log("Pending referrer:", pendingReferrer);
  console.log("Buyer:", address);
  console.log("Swap txHash:", txHash);
  console.log("Pay token:", payToken.symbol);
  console.log("Receive token:", receiveToken.symbol);

  if (!pendingReferrer) {
    console.log("Skipping referral: no pending referrer");
    return;
  }

  const isBuySwap =
    payToken.symbol === "USDT" &&
    receiveToken.symbol === "RIC";

  console.log("isBuySwap:", isBuySwap);

  if (!isBuySwap) {
    console.log("Skipping referral: not a USDT → RIC buy");
    return;
  }

  if (
    pendingReferrer.toLowerCase() ===
    address.toLowerCase()
  ) {
    console.log("Skipping referral: self-referral");
    return;
  }

  try {
    console.log("Sending referral record request...");

    const response = await fetch("/api/referral/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyer: address,
        referrer: pendingReferrer,
        txHash,
        amountRich: receiveAmount,
      }),
    });

    const result = await response.json();

    console.log("Referral API status:", response.status);
    console.log("Referral API response:", result);

    if (!response.ok) {
      console.error(
        "Referral API failed:",
        response.status,
        result
      );
      return;
    }

    console.log("Referral recorded successfully");

    if (!cancelled) {
      setReferralRecorded(true);
    }
  } catch (error) {
    console.error("Failed to record referral:", error);
  }
}

    void handleConfirmedTx();

    return () => {
      cancelled = true;
    };
  }, [
    isTxSuccess,
    txHash,
    txType,
    autoSwapStarted,
    referralRecorded,
    address,
    payToken.symbol,
    receiveToken.symbol,
    receiveAmount,
    refetchAllowance,
  ]);

  useEffect(() => {
    if (!showTxModal || !txHash || isTxSuccess) return;

    const timeout = setTimeout(() => {
      setShowTxModal(false);

      alert(
        "Transaction is taking longer than expected. It may still confirm later. Please check your wallet or BscScan."
      );
    }, 20000);

    return () => clearTimeout(timeout);
  }, [showTxModal, txHash, isTxSuccess]);

  function handlePayAmountChange(value: string) {
    const clean = cleanNumber(value);

    if (clean === "" || /^[0-9]*\.?[0-9]*$/.test(clean)) {
      setPayAmount(clean);
      setReferralRecorded(false);
      setAutoSwapStarted(false);
    }
  }

  function switchTokens() {
    const oldPayToken = payToken;

    setPayToken(receiveToken);
    setReceiveToken(oldPayToken);
    setPayAmount("");
    setReferralRecorded(false);
    setAutoSwapStarted(false);
  }

  async function approveToken() {
    try {
      setTxType("approve");
      setAutoSwapStarted(false);

      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: payToken.address,
        functionName: "approve",
        args: [PANCAKE_V2_ROUTER, maxUint256],
      });

      setTxHash(hash);
      setShowTxModal(true);
    } catch (error) {
      console.error("Approval failed:", error);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[440px] rounded-[24px] border border-zinc-800 bg-[#10141d] p-4 shadow-none md:p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-medium">Swap</h2>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="text-zinc-300 hover:text-yellow-400"
          >
            <Settings size={24} />
          </button>
        </div>

        <TokenBox
          label="You pay"
          token={payToken}
          amount={payAmount}
          setAmount={handlePayAmountChange}
          balance={payTokenBalance?.formatted}
          showMax
          onMax={() => {
            if (payTokenBalance?.formatted) {
              setPayAmount(payTokenBalance.formatted);
              setReferralRecorded(false);
              setAutoSwapStarted(false);
            }
          }}
          estimate={
            payAmount ? `≈ ${formatNumber(payAmount)} ${payToken.symbol}` : ""
          }
        />

        <div className="relative z-50 my-2 flex justify-center">
          <button
            type="button"
            onClick={switchTokens}
            className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#10141d] bg-[#202838] text-zinc-300 hover:bg-[#2a3448]"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        <TokenBox
          label="You receive"
          token={receiveToken}
          amount={receiveAmount ? formatQuote(receiveAmount) : ""}
          setAmount={() => {}}
          balance={receiveTokenBalance?.formatted}
          disabled
          estimate={
            isQuoteLoading
              ? "Fetching quote..."
              : receiveAmount
                ? `≈ ${formatNumber(receiveAmount)} ${receiveToken.symbol}`
                : ""
          }
        />

        {receiveAmount && (
          <div className="mt-4 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Route</span>

              <span className="flex items-center gap-1 rounded-full border border-yellow-600/20 bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-400">
              ⚡
                RichCoinDex
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-zinc-500">Rate</span>

              <span className="text-zinc-300">
                1 {payToken.symbol} ={" "}
                {numericPayAmount > 0
                  ? formatQuote(Number(receiveAmount) / numericPayAmount)
                  : "0"}{" "}
                {receiveToken.symbol}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-zinc-500">Slippage</span>

              <span className="text-yellow-400">{slippage}%</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-zinc-500">Deadline</span>

              <span className="text-zinc-300">{deadlineMinutes} mins</span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-zinc-500">LP Fee</span>

              <span className="text-zinc-300">0.25%</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="mt-4 flex w-full items-center justify-between text-sm"
        >
          <span className="text-zinc-400">Slippage Tolerance</span>
          <span className="font-medium text-yellow-400">{slippage}%</span>
        </button>

        <SwapActionButton
          payAmount={payAmount}
          userBalance={userBalance}
          hasQuote={Boolean(receiveAmount)}
          isQuoteLoading={isQuoteLoading}
          needsApproval={needsApproval}
          isPending={isPending}
          isTxConfirming={isTxConfirming}
          autoSwapStarted={autoSwapStarted}
          onApprove={approveToken}
          onSwap={executeSwap}
        />
      </div>

      {showSettings && (
        <SettingsModal
          slippage={slippage}
          setSlippage={setSlippage}
          deadlineMinutes={deadlineMinutes}
          setDeadlineMinutes={setDeadlineMinutes}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTxModal && (
        <TransactionModal
          hash={txHash}
          isSuccess={isTxSuccess}
          txType={txType}
          autoSwapStarted={autoSwapStarted}
          onClose={() => setShowTxModal(false)}
        />
      )}
    </>
  );
}

function SwapActionButton({
  payAmount,
  userBalance,
  hasQuote,
  isQuoteLoading,
  needsApproval,
  isPending,
  isTxConfirming,
  autoSwapStarted,
  onApprove,
  onSwap,
}: {
  payAmount: string;
  userBalance: number;
  hasQuote: boolean;
  isQuoteLoading: boolean;
  needsApproval: boolean;
  isPending: boolean;
  isTxConfirming: boolean;
  autoSwapStarted: boolean;
  onApprove: () => void;
  onSwap: () => void;
}) {
  const numericPayAmount = Number(cleanNumber(payAmount));

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal }) => {
        const connected = account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="mt-5 h-12 w-full rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300"
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
              className="mt-5 h-12 w-full rounded-[18px] bg-red-500 text-base font-semibold text-white"
            >
              Wrong Network
            </button>
          );
        }

        if (!payAmount || numericPayAmount <= 0) {
          return (
            <button
              type="button"
              disabled
              className="mt-5 h-12 w-full cursor-not-allowed rounded-[18px] bg-gradient-to-r from-[#D4AF37]/50 via-[#FFD700]/50 to-[#FFB300]/50 text-base font-semibold text-black/50"
            >
              Enter Amount
            </button>
          );
        }

        if (numericPayAmount > userBalance) {
          return (
            <button
              type="button"
              disabled
              className="mt-5 h-12 w-full cursor-not-allowed rounded-[18px] bg-yellow-400/50 text-base font-semibold text-black/50"
            >
              Insufficient Balance
            </button>
          );
        }

        if (isQuoteLoading) {
          return (
            <button
              type="button"
              disabled
              className="mt-5 h-12 w-full cursor-wait rounded-[18px] bg-yellow-400/60 text-base font-semibold text-black/60"
            >
              Fetching Quote...
            </button>
          );
        }

        if (!hasQuote) {
          return (
            <button
              type="button"
              disabled
              className="mt-5 h-12 w-full cursor-not-allowed rounded-[18px] bg-yellow-400/50 text-base font-semibold text-black/50"
            >
              No Route Found
            </button>
          );
        }

        if (needsApproval) {
          return (
            <button
              type="button"
              onClick={onApprove}
              disabled={isPending || isTxConfirming || autoSwapStarted}
              className="mt-5 h-12 w-full rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {isPending || isTxConfirming || autoSwapStarted
                ? "Preparing Swap..."
                : "Approve & Swap"}
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={onSwap}
            disabled={isPending || isTxConfirming}
            className="mt-5 h-12 w-full rounded-[18px] bg-yellow-400 text-base font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {isPending || isTxConfirming ? "Swapping..." : "Swap"}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

function TokenBox({
  label,
  token,
  amount,
  setAmount,
  balance,
  disabled = false,
  estimate = "",
  showMax = false,
  onMax,
}: {
  label: string;
  token: SwapToken;
  amount: string;
  setAmount: (value: string) => void;
  balance?: string;
  disabled?: boolean;
  estimate?: string;
  showMax?: boolean;
  onMax?: () => void;
}) {
  return (
    <div className="rounded-[18px] bg-[#090d15] p-3">
      <div className="mb-4 flex items-center justify-between text-zinc-500">
        <span className="text-sm">{label}</span>

        <div className="flex items-center gap-2 text-xs">
          <span>Balance: {balance ? formatNumber(balance) : "0.0000"}</span>

          {showMax && balance && Number(balance) > 0 && (
            <button
              type="button"
              onClick={onMax}
              className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400 hover:bg-yellow-400/20"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={disabled}
            className="w-full bg-transparent text-[26px] font-semibold text-white outline-none disabled:cursor-not-allowed"
          />

          {estimate && (
            <p className="mt-1 text-xs text-zinc-500">{estimate}</p>
          )}
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-sm font-semibold text-white"
        >
          <img
            src={token.logo}
            alt={token.symbol}
            className="h-7 w-7 rounded-full"
          />

          <span>{token.symbol}</span>

          <ChevronDown size={16} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

function SettingsModal({
  slippage,
  setSlippage,
  deadlineMinutes,
  setDeadlineMinutes,
  onClose,
}: {
  slippage: string;
  setSlippage: (value: string) => void;
  deadlineMinutes: string;
  setDeadlineMinutes: (value: string) => void;
  onClose: () => void;
}) {
  const slippageOptions = ["0.1", "0.5", "1.0"];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[28px] bg-[#17171c]">
        <div className="flex items-center justify-between bg-black px-5 py-4">
          <h3 className="text-2xl font-normal">Settings</h3>

          <button type="button" onClick={onClose} className="text-yellow-400">
            <X size={28} />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-3 text-xs font-medium text-yellow-400">
            SWAPS & LIQUIDITY
          </p>

          <div>
            <p className="mb-4 text-base font-normal">Slippage Tolerance</p>

            <div className="flex flex-wrap items-center gap-2">
              {slippageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSlippage(option)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    slippage === option
                      ? "bg-yellow-400 text-black"
                      : "bg-black text-yellow-400"
                  }`}
                >
                  {option}%
                </button>
              ))}

              <div className="flex items-center gap-2">
                <input
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 rounded-full bg-[#20202B] px-3 py-2 text-center text-sm outline-none"
                />

                <span className="text-sm text-yellow-400">%</span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <span className="text-base font-normal">Tx deadline (mins)</span>

            <input
              value={deadlineMinutes}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "" || /^[0-9]*$/.test(value)) {
                  setDeadlineMinutes(value);
                }
              }}
              className="w-20 rounded-full bg-[#20202B] px-3 py-2 text-center text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-7 h-11 w-full rounded-xl bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionModal({
  hash,
  isSuccess,
  txType,
  autoSwapStarted,
  onClose,
}: {
  hash?: `0x${string}`;
  isSuccess: boolean;
  txType: "approve" | "swap";
  autoSwapStarted: boolean;
  onClose: () => void;
}) {
  const successTitle =
    txType === "approve" ? "Approval Successful" : "Swap Successful";

  const pendingTitle =
    txType === "approve"
      ? autoSwapStarted
        ? "Starting Swap"
        : "Approval Pending"
      : "Swap Pending";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-[380px] rounded-[24px] border border-zinc-800 bg-[#10141d] p-5 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400">
          {isSuccess && txType === "swap" ? (
            <CheckCircle2 size={30} />
          ) : (
            <Loader2 size={30} className="animate-spin" />
          )}
        </div>

        <h3 className="text-xl font-semibold">
          {isSuccess && txType === "swap" ? successTitle : pendingTitle}
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          {isSuccess && txType === "swap"
            ? "Your swap has been confirmed on BNB Smart Chain."
            : txType === "approve" && autoSwapStarted
              ? "Approval confirmed. Please confirm the swap transaction in your wallet."
              : "Your transaction has been submitted. Waiting for confirmation."}
        </p>

        {hash && (
          <a
            href={`https://bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-yellow-700/40 bg-yellow-500/10 px-4 py-3 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20"
          >
            View Tx Receipt
            <ExternalLink size={14} />
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-11 w-full rounded-xl bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
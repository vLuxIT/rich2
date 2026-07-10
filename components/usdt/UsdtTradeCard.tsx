"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

type Mode = "buy" | "sell";

declare global {
  interface Window {
    ramp?: {
      initialize: (config: Record<string, unknown>) => void;
    };
  }
}

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

function generateReference() {
  return `richcoin-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function UsdtTradeCard({ mode }: { mode: Mode }) {
  const { address } = useAccount();

  const [isBuy, setIsBuy] = useState(mode === "buy");
  const [payAmount, setPayAmount] = useState("");
  const [widgetError, setWidgetError] = useState("");

  const rate = 1500;
  const numericPayAmount = Number(cleanNumber(payAmount));

  const receiveAmount =
    payAmount && numericPayAmount > 0
      ? isBuy
        ? numericPayAmount / rate
        : numericPayAmount * rate
      : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.ramp) return;

    const existingScript = document.querySelector(
      'script[src="https://d309lcjd52k0i0.cloudfront.net/ramp.js"]'
    );

    if (existingScript) return;

    const script = document.createElement("script");

    script.src = "https://d309lcjd52k0i0.cloudfront.net/ramp.js";
    script.async = true;

    script.onerror = () => {
      setWidgetError("Unable to load Ramp widget.");
    };

    document.body.appendChild(script);
  }, []);

  function handlePayAmountChange(value: string) {
    const clean = cleanNumber(value);

    if (clean === "" || /^[0-9]*\.?[0-9]*$/.test(clean)) {
      setPayAmount(clean);
      setWidgetError("");
    }
  }

  function switchMode() {
    setIsBuy(!isBuy);
    setPayAmount("");
    setWidgetError("");
  }

  function openQuidaxWidget() {
    const publicKey = process.env.NEXT_PUBLIC_QUIDAX_RAMP_PUBLIC_KEY;

    if (!publicKey) {
      setWidgetError("Missing Quidax public key.");
      return;
    }

    if (!window.ramp) {
      setWidgetError("Quidax widget is still loading. Please try again.");
      return;
    }

    if (!payAmount || numericPayAmount <= 0) {
      setWidgetError("Enter an amount first.");
      return;
    }

    if (isBuy && !address) {
      setWidgetError("Connect wallet first so USDT can be sent to your address.");
      return;
    }

    window.ramp.initialize({
      public_key: publicKey,
      reference: generateReference(),
      from_currency: isBuy ? "ngn" : "usdt",
      to_currency: isBuy ? "usdt" : "ngn",
      from_amount: cleanNumber(payAmount),
      mode: isBuy ? "buy" : "sell",
      network: "BEP20",
      ...(isBuy && address ? { address } : {}),

      onClose(ref: unknown) {
        console.log("Quidax Ramp closed:", ref);
      },

      onReceiveWalletDetails(walletDetails: unknown) {
        console.log("Quidax wallet details:", walletDetails);
      },

      onSuccess(transaction: unknown) {
        console.log("Quidax transaction successful:", transaction);
      },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center bg-[#0F1117] text-white">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-[#FFF4B0] via-[#FFD700] to-[#D4AF37] bg-clip-text text-4xl font-semibold text-transparent">
          {isBuy ? "Buy USDT" : "Sell USDT"}
        </h1>

        <p className="mt-3 text-sm text-zinc-400">
          {isBuy
            ? "Pay with Naira and receive USDT."
            : "Sell USDT and receive Naira."}
        </p>
      </div>

      <div className="mb-4 w-full max-w-[440px]">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/buy-usdt"
            className={`rounded-xl border py-2.5 text-center text-sm font-medium transition hover:border-yellow-400 ${
              isBuy
                ? "border-yellow-500 bg-yellow-400 text-black"
                : "border-zinc-800 bg-zinc-900 text-white"
            }`}
          >
            Buy USDT
          </Link>

          <Link
            href="/sell-usdt"
            className={`rounded-xl border py-2.5 text-center text-sm font-medium transition hover:border-yellow-400 ${
              !isBuy
                ? "border-yellow-500 bg-yellow-400 text-black"
                : "border-zinc-800 bg-zinc-900 text-white"
            }`}
          >
            Sell USDT
          </Link>
        </div>
      </div>

      <div className="w-full max-w-[440px] rounded-[24px] border border-zinc-800 bg-[#10141d] p-4 md:p-5">
        <CurrencyBox
          label="You pay"
          currency={isBuy ? "NGN" : "USDT"}
          placeholder="0.0"
          value={payAmount}
          onChange={handlePayAmountChange}
          estimate={
            payAmount
              ? isBuy
                ? `≈ ₦${formatNumber(numericPayAmount)}`
                : `≈ ${formatNumber(numericPayAmount)} USDT`
              : ""
          }
        />

        <div className="my-2 flex justify-center">
          <button
            type="button"
            onClick={switchMode}
            className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#10141d] bg-[#202838] text-zinc-300 hover:bg-[#2a3448]"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        <CurrencyBox
          label="You receive"
          currency={isBuy ? "USDT" : "NGN"}
          placeholder="0.0"
          value={receiveAmount ? String(receiveAmount) : ""}
          disabled
          estimate={
            receiveAmount
              ? isBuy
                ? `≈ ${formatNumber(receiveAmount)} USDT`
                : `≈ ₦${formatNumber(receiveAmount)}`
              : ""
          }
        />

        <div className="mt-4 rounded-[18px] border border-yellow-700/40 bg-gradient-to-br from-[#1c1708] via-[#15110a] to-[#0f0f0f] p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Route</span>

            <span className="rounded-full border border-yellow-600/20 bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-400">
              ⚡ Richcoin Ramp
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-zinc-500">Rate</span>

            <span className="text-zinc-300">
              1 USDT = ₦{rate.toLocaleString()}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-zinc-500">Network</span>

            <span className="text-zinc-300">BEP-20</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-zinc-500">Provider</span>

            <span className="text-yellow-400">Richcoin</span>
          </div>
        </div>

        {widgetError && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {widgetError}
          </p>
        )}

        <button
          type="button"
          onClick={openQuidaxWidget}
          disabled={!payAmount || numericPayAmount <= 0}
          className={`mt-5 h-12 w-full rounded-[18px] text-base font-semibold ${
            !payAmount || numericPayAmount <= 0
              ? "cursor-not-allowed bg-gradient-to-r from-[#D4AF37]/50 via-[#FFD700]/50 to-[#FFB300]/50 text-black/50"
              : "bg-yellow-400 text-black hover:bg-yellow-300"
          }`}
        >
          {!payAmount || numericPayAmount <= 0
            ? "Enter Amount"
            : isBuy
              ? "Continue to Buy USDT"
              : "Continue to Sell USDT"}
        </button>
      </div>
    </div>
  );
}

function CurrencyBox({
  label,
  currency,
  placeholder,
  value = "",
  onChange,
  disabled = false,
  estimate = "",
}: {
  label: string;
  currency: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  estimate?: string;
}) {
  const logo = currency === "USDT" ? "/usdt.png" : "/naira.png";

  return (
    <div className="rounded-[18px] bg-[#090d15] p-3">
      <div className="mb-4 flex items-center justify-between text-zinc-500">
        <span className="text-sm">{label}</span>
        <span className="text-xs">{currency}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className="w-full bg-transparent text-[26px] font-semibold text-white outline-none disabled:cursor-not-allowed"
          />

          {estimate && <p className="mt-1 text-xs text-zinc-500">{estimate}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#202838] px-3 py-2 text-sm font-semibold text-white">
          <img
            src={logo}
            alt={currency}
            className="h-7 w-7 rounded-full object-cover"
          />

          <span>{currency}</span>
        </div>
      </div>
    </div>
  );
}
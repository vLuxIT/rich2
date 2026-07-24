"use client";

import { formatUnits } from "viem";
import { useReadContract } from "wagmi";

import { RST_MANAGER_ADDRESS, rstManagerAbi } from "@/lib/rstContracts";
import { USDT_TOKEN } from "@/lib/token";

export function useRstMarket() {
  const currentOpv = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentOpvUsdt",
  });

  const subscriptionPrice = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "subscriptionPriceUsdt",
  });

  const priceRaw =
    (currentOpv.data as bigint | undefined) ||
    (subscriptionPrice.data as bigint | undefined);

  const priceUsd =
    priceRaw !== undefined
      ? Number(formatUnits(priceRaw, USDT_TOKEN.decimals))
      : null;

  return {
    priceRaw,
    priceUsd,
    currentOpvRaw: currentOpv.data as bigint | undefined,
    subscriptionPriceRaw: subscriptionPrice.data as bigint | undefined,
    isLoading: currentOpv.isLoading || subscriptionPrice.isLoading,
    isError: currentOpv.isError || subscriptionPrice.isError,
    refetch: () => {
      void currentOpv.refetch();
      void subscriptionPrice.refetch();
    },
  };
}

export function formatRstUsd(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

export function formatRstPairPrice(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.000";
  }

  if (value >= 1) return value.toFixed(3);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

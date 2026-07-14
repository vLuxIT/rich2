"use client";

import { useQuery } from "@tanstack/react-query";

type RicMarket = {
  priceUsd: number;
  change24h: number;
  liquidityUsd: number;
  pairAddress?: string;
  dexId?: string;
  updatedAt: string;
};

async function fetchRicMarket(): Promise<RicMarket | null> {
  const res = await fetch("/api/market/ric", {
    cache: "no-store",
  });

  const json = await res.json();

  if (!json?.ok) {
    return null;
  }

 return {
  priceUsd: Number(json.priceUsd || 0),
  change24h: Number(json.change24h || 0),
  liquidityUsd: Number(json.liquidityUsd || 0),
  pairAddress: json.pairAddress,
  dexId: json.dexId,
  updatedAt: json.updatedAt,
};
}

export function useRicMarket() {
  const query = useQuery({
    queryKey: ["ric-market"],
    queryFn: fetchRicMarket,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function formatUsd(value?: number | null) {
  if (!value) return "$0.0000";

  if (value < 0.01) {
    return `$${value.toFixed(6)}`;
  }

  return `$${value.toFixed(4)}`;
}

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return "+0.00%";

  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

export function formatCompactUsd(value?: number | null) {
  if (!value) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
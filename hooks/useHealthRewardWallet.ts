"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type HealthRewardWallet = {
  walletId: string;
  address: string;
  chain: string;
  ownerWallet: string;
  purpose: "health_rewards";
  createdAt: string;
};

async function fetchExistingHealthWallet(ownerWallet: string) {
  const response = await fetch(
    `/api/wallets/create?ownerWallet=${encodeURIComponent(
      ownerWallet
    )}&purpose=health_rewards`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const json = await response.json();

  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || "Failed to load health rewards wallet");
  }

  if (!json.exists) return null;

  return {
    walletId: json.walletId,
    address: json.address,
    chain: json.chain,
    ownerWallet: json.ownerWallet,
    purpose: json.purpose,
    createdAt: json.createdAt,
  } as HealthRewardWallet;
}

async function createOrLoadHealthWallet(ownerWallet: string) {
  const response = await fetch("/api/wallets/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerWallet,
      purpose: "health_rewards",
    }),
  });

  const json = await response.json();

  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || "Failed to create health rewards wallet");
  }

  return {
    walletId: json.walletId,
    address: json.address,
    chain: json.chain,
    ownerWallet: json.ownerWallet,
    purpose: json.purpose,
    createdAt: json.createdAt,
  } as HealthRewardWallet;
}

export function useHealthRewardWallet(ownerWallet?: string) {
  const queryClient = useQueryClient();
  const normalizedOwnerWallet = ownerWallet?.toLowerCase();

  const query = useQuery({
    queryKey: ["health-reward-wallet", normalizedOwnerWallet],
    queryFn: () => fetchExistingHealthWallet(normalizedOwnerWallet as string),
    enabled: Boolean(normalizedOwnerWallet),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: () => createOrLoadHealthWallet(normalizedOwnerWallet as string),
    onSuccess: (wallet) => {
      queryClient.setQueryData(
        ["health-reward-wallet", normalizedOwnerWallet],
        wallet
      );
    },
  });

  return {
    wallet: query.data ?? null,
    isLoading: query.isLoading,
    isCreating: mutation.isPending,
    error:
      (query.error instanceof Error ? query.error.message : null) ||
      (mutation.error instanceof Error ? mutation.error.message : null),
    createOrLoadWallet: mutation.mutateAsync,
    refetch: query.refetch,
  };
}

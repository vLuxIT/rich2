"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const { address } = useAccount();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (!ref) return;

    const referrer = ref.toLowerCase();
    const connectedWallet = address?.toLowerCase();

    if (connectedWallet && referrer === connectedWallet) {
      console.log("Self-referral ignored");
      return;
    }

    localStorage.setItem("richcoin_pending_referrer", ref);

    console.log("Pending referrer saved:", ref);
  }, [searchParams, address]);

  return null;
}
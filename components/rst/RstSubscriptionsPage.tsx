"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Gift,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatUnits, parseAbi, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";

import HealthRewardWalletCard from "@/components/rst/HealthRewardWalletCard";
import { useHealthRewardWallet } from "@/hooks/useHealthRewardWallet";
import {
  RIC_CLAIM_PROCESSOR_ADDRESS,
  RST_MANAGER_ADDRESS,
  RST_TOKEN_ADDRESS,
  ricClaimProcessorAbi,
  rstManagerAbi,
  rstTokenAbi,
} from "@/lib/rstContracts";
import { PANCAKE_V2_ROUTER } from "@/lib/pancake";
import { USDT_TOKEN } from "@/lib/token";

const USDT_DECIMALS = USDT_TOKEN.decimals;
const RST_DECIMALS = 18;
const CLAIM_TAX_BPS = BigInt(250);
const BPS_DENOMINATOR = BigInt(10000);
const SLIPPAGE_BPS = BigInt(9500);
const TERMINATION_TOTAL_MONTHS = 12;

const pancakeQuoteAbi = parseAbi([
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
]);

type PlanTuple = readonly [
  holder: Address,
  rstAmount: bigint,
  initialCapitalUsdt: bigint,
  cumulativeGrossClaimsUsdt: bigint,
  subscribedAt: bigint,
  nextClaimAt: bigint,
  claimsReleased: bigint,
  terminationClaims: bigint,
  status: number,
  terminationMonthlyUsdt: bigint,
  terminationRemainderUsdt: bigint
];

type ClaimPreview = readonly [
  releases: bigint,
  grossUsdt: bigint,
  remainingCap: bigint
];

function getReadableError(error: unknown) {
  const err = error as {
    shortMessage?: string;
    details?: string;
    message?: string;
    cause?: {
      shortMessage?: string;
      details?: string;
      message?: string;
    };
  };

  return (
    err.shortMessage ||
    err.details ||
    err.cause?.shortMessage ||
    err.cause?.details ||
    err.message ||
    err.cause?.message ||
    "Transaction failed. Please check contract requirements."
  );
}

function toNumber(value?: bigint, decimals = USDT_DECIMALS) {
  if (value === undefined) return 0;
  return Number(formatUnits(value, decimals));
}

function formatUsd(value?: bigint | number, decimals = USDT_DECIMALS) {
  const numeric =
    typeof value === "bigint" ? toNumber(value, decimals) : Number(value || 0);

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  });
}

function formatToken(value?: bigint, decimals = RST_DECIMALS, suffix = "") {
  if (value === undefined) return `0${suffix}`;

  const numeric = Number(formatUnits(value, decimals));

  return `${numeric.toLocaleString("en-US", {
    maximumFractionDigits: numeric >= 1000 ? 2 : 4,
  })}${suffix}`;
}

function formatDate(timestamp?: bigint) {
  if (!timestamp || timestamp <= BigInt(0)) return "Controlled by contract";

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(Number(timestamp) * 1000);
}

function getStatusLabel(status: number) {
  if (status === 1) return "Terminated";
  if (status === 2) return "Completed";
  return "Active";
}

function daysSince(timestamp?: bigint) {
  if (!timestamp) return 0;

  const ms = Number(timestamp) * 1000;
  const diff = Date.now() - ms;

  return Math.max(Math.floor(diff / 86_400_000), 0);
}

function portfolioValue(rstAmount?: bigint, currentOpv?: bigint) {
  return (
    toNumber(rstAmount, RST_DECIMALS) *
    toNumber(currentOpv, USDT_DECIMALS)
  );
}

function maxReturn(initialCapital?: bigint) {
  if (!initialCapital) return BigInt(0);
  return initialCapital * BigInt(10);
}

function remainingReturn(initialCapital?: bigint, paid?: bigint) {
  const maximum = maxReturn(initialCapital);
  const totalPaid = paid || BigInt(0);

  if (maximum <= totalPaid) return BigInt(0);

  return maximum - totalPaid;
}

function getTerminationClaims(plan?: PlanTuple) {
  if (!plan) return 0;
  return Math.min(Number(plan[7] || BigInt(0)), TERMINATION_TOTAL_MONTHS);
}

function getNextTerminationGross(plan?: PlanTuple) {
  if (!plan) return BigInt(0);

  const status = Number(plan[8] || 0);
  if (status !== 1) return BigInt(0);

  const claimsReleased = getTerminationClaims(plan);
  if (claimsReleased >= TERMINATION_TOTAL_MONTHS) return BigInt(0);

  const monthly = plan[9] || BigInt(0);
  const remainder = plan[10] || BigInt(0);

  if (claimsReleased === TERMINATION_TOTAL_MONTHS - 1) {
    return monthly + remainder;
  }

  return monthly;
}

function getRemainingTerminationCapital(plan?: PlanTuple) {
  if (!plan) return BigInt(0);

  const claimsReleased = getTerminationClaims(plan);
  if (claimsReleased >= TERMINATION_TOTAL_MONTHS) return BigInt(0);

  const monthly = plan[9] || BigInt(0);
  const remainder = plan[10] || BigInt(0);
  const remainingMonthlyClaims = TERMINATION_TOTAL_MONTHS - claimsReleased;

  return monthly * BigInt(remainingMonthlyClaims) + remainder;
}

function StatLine({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <p className="text-sm text-[#A4AAB7]">{label}</p>
      <p
        className={[
          "text-right text-sm font-black",
          green ? "text-[#19C46B]" : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function DisconnectedHealthWalletCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#19C46B]/12 text-[#19C46B]">
          <Gift size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-white">
            Health Rewards Wallet
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
            Connect your wallet to view or create your Health Rewards Wallet.
          </p>
        </div>
      </div>

      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            type="button"
            onClick={openConnectModal}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B]"
          >
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    </section>
  );
}

function ContractCard({
  planId,
  plan,
  currentOpv,
  preview,
  healthWalletAddress,
  swapPath,
  onClaim,
  onTerminate,
  onClaimTerminationCapital,
  isActionPending,
}: {
  planId: bigint;
  plan?: PlanTuple;
  currentOpv?: bigint;
  preview?: ClaimPreview;
  healthWalletAddress?: string;
  swapPath?: readonly Address[];
  onClaim: (planId: bigint, preview?: ClaimPreview) => void | Promise<void>;
  onTerminate: (planId: bigint) => void | Promise<void>;
  onClaimTerminationCapital: (planId: bigint, plan?: PlanTuple) => void | Promise<void>;
  isActionPending: boolean;
}) {
  const rawStatus = Number(plan?.[8] || 0);
  const status = getStatusLabel(rawStatus);
  const initialCapital = plan?.[2];
  const totalPaid = plan?.[3];
  const maximum = maxReturn(initialCapital);
  const remaining = remainingReturn(initialCapital, totalPaid);
  const portfolio = portfolioValue(plan?.[1], currentOpv);
  const claimableGross = preview?.[1] || BigInt(0);
  const availableReleases = preview?.[0] || BigInt(0);
  const terminationClaims = getTerminationClaims(plan);
  const monthlyCapital = plan?.[9] || BigInt(0);
  const nextTerminationGross = getNextTerminationGross(plan);
  const remainingTerminationCapital = getRemainingTerminationCapital(plan);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#2287FF]">
            Contract #{planId.toString().padStart(3, "0")}
          </p>
          <p className="mt-1 text-xs text-[#A4AAB7]">
            Days Since Subscription: {daysSince(plan?.[4]).toLocaleString()} Days
          </p>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-black",
            status === "Active"
              ? "bg-[#19C46B]/10 text-[#19C46B]"
              : status === "Completed"
                ? "bg-[#2287FF]/10 text-[#2287FF]"
                : "bg-red-500/10 text-red-300",
          ].join(" ")}
        >
          {status}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0D1118] p-4">
          <StatLine label="Shares Capital" value={formatUsd(initialCapital)} />
          <StatLine label="Current OPV" value={formatUsd(currentOpv)} />
          <StatLine label="Portfolio Value" value={formatUsd(portfolio)} green />
          <StatLine
            label="RST Amount"
            value={formatToken(plan?.[1], RST_DECIMALS, " RST")}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0D1118] p-4">
          <StatLine label="Total Profit Paid" value={formatUsd(totalPaid)} />
          <StatLine label="Maximum Return" value={formatUsd(maximum)} />
          <StatLine label="Remaining Return" value={formatUsd(remaining)} />
          <StatLine label="Status" value={status} green={status === "Active"} />
        </div>
      </div>

      {status === "Active" ? (
        <>
          <div className="mt-4 rounded-2xl border border-[#1250FF]/20 bg-[#071224] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white">Profit Claim Preview</p>
                <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
                  Available monthly releases: {availableReleases.toString()}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
                  Next Claim Date: {formatDate(plan?.[5])}
                </p>
              </div>

              <p className="text-right text-lg font-black text-[#19C46B]">
                {formatUsd(claimableGross)}
              </p>
            </div>

            <button
              type="button"
              disabled={
                isActionPending ||
                claimableGross <= BigInt(0) ||
                !healthWalletAddress ||
                !swapPath?.length
              }
              onClick={() => onClaim(planId, preview)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Gift size={17} />
              {isActionPending ? "Processing..." : "Claim Profit"}
            </button>

            {!healthWalletAddress ? (
              <p className="mt-3 text-xs leading-5 text-[#A4AAB7]">
                Create your Health Rewards Wallet before claiming profit.
              </p>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 shrink-0 text-red-300" size={22} />
              <div>
                <p className="text-sm font-black text-white">Termination Policy</p>
                <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
                  Voluntary termination forfeits future revenue-share rights.
                  Initial capital is then claimable monthly across 12 capital
                  repayments, not all at once.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isActionPending}
              onClick={() => onTerminate(planId)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 text-sm font-black text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldAlert size={17} />
              {isActionPending ? "Processing..." : "Terminate Contract"}
            </button>
          </div>
        </>
      ) : null}

      {status === "Terminated" ? (
        <div className="mt-4 rounded-2xl border border-[#FFC928]/20 bg-[#171103] p-4">
          <div className="mb-4 flex items-start gap-3">
            <Clock3 className="mt-0.5 shrink-0 text-[#FFC928]" size={22} />
            <div>
              <p className="text-sm font-black text-white">
                Termination Capital Schedule
              </p>
              <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
                Capital repayment is monthly across 12 claims. This is not a
                one-time full capital withdrawal.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0D1118] p-4">
            <StatLine
              label="Monthly Capital Claim"
              value={formatUsd(monthlyCapital)}
            />
            <StatLine
              label="Capital Claims Released"
              value={`${terminationClaims} / ${TERMINATION_TOTAL_MONTHS}`}
            />
            <StatLine
              label="Next Monthly Claim"
              value={formatUsd(nextTerminationGross)}
              green={nextTerminationGross > BigInt(0)}
            />
            <StatLine
              label="Remaining Capital"
              value={formatUsd(remainingTerminationCapital)}
            />
            <StatLine
              label="Next Claim Date"
              value={formatDate(plan?.[5])}
            />
          </div>

          <button
            type="button"
            disabled={
              isActionPending ||
              nextTerminationGross <= BigInt(0) ||
              !swapPath?.length
            }
            onClick={() => onClaimTerminationCapital(planId, plan)}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFC928] text-sm font-black text-[#05070B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet size={17} />
            {isActionPending ? "Processing..." : "Claim Monthly Capital"}
          </button>
        </div>
      ) : null}

      {status === "Completed" ? (
        <div className="mt-4 rounded-2xl border border-[#2287FF]/20 bg-[#1250FF]/10 p-4">
          <p className="text-sm font-black text-white">Contract Completed</p>
          <p className="mt-1 text-xs leading-5 text-[#A4AAB7]">
            This contract has reached completion based on the RST programme
            rules.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default function RstSubscriptionsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const healthWallet = useHealthRewardWallet(isConnected ? address : undefined);

  const { data: currentOpv } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "currentOpvUsdt",
  });

  const { data: rstBalance } = useReadContract({
    address: RST_TOKEN_ADDRESS,
    abi: rstTokenAbi,
    functionName: "balanceOf",
    args: isConnected && address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const { data: planIdsData, refetch: refetchPlanIds } = useReadContract({
    address: RST_MANAGER_ADDRESS,
    abi: rstManagerAbi,
    functionName: "getHolderPlans",
    args: isConnected && address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const { data: swapPathData } = useReadContract({
    address: RIC_CLAIM_PROCESSOR_ADDRESS,
    abi: ricClaimProcessorAbi,
    functionName: "getSwapPath",
  });

  const planIds = isConnected
    ? ((planIdsData || []) as readonly bigint[])
    : [];
  const swapPath = (swapPathData || []) as readonly Address[];

  const planReads = useReadContracts({
    contracts: planIds.map((planId) => ({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerAbi,
      functionName: "plans",
      args: [planId],
    })),
    query: {
      enabled: planIds.length > 0,
    },
  });

  const previewReads = useReadContracts({
    contracts: planIds.map((planId) => ({
      address: RST_MANAGER_ADDRESS,
      abi: rstManagerAbi,
      functionName: "previewClaim",
      args: [planId],
    })),
    query: {
      enabled: planIds.length > 0,
    },
  });

  function refetchPlanData() {
    void refetchPlanIds();
    void planReads.refetch();
    void previewReads.refetch();
  }

  async function getMinRicOut(grossUsdt: bigint) {
    if (!publicClient) throw new Error("Wallet client is not ready.");
    if (!swapPath.length) throw new Error("Claim swap path is not configured.");
    if (grossUsdt <= BigInt(0)) throw new Error("Nothing available to claim.");

    const taxUsdt = (grossUsdt * CLAIM_TAX_BPS) / BPS_DENOMINATOR;
    const usdtToSwap = grossUsdt - taxUsdt;

    if (usdtToSwap <= BigInt(0)) {
      throw new Error("Claim amount is too small after tax.");
    }

    const amounts = (await publicClient.readContract({
      address: PANCAKE_V2_ROUTER,
      abi: pancakeQuoteAbi,
      functionName: "getAmountsOut",
      args: [usdtToSwap, swapPath],
    })) as bigint[];

    const quotedRic = amounts[amounts.length - 1];

    return (quotedRic * SLIPPAGE_BPS) / BPS_DENOMINATOR;
  }

  async function claim(planId: bigint, preview?: ClaimPreview) {
    try {
      if (!publicClient) throw new Error("Wallet client is not ready.");
      if (!address) throw new Error("Connect wallet first.");
      if (!healthWallet.wallet?.address) {
        throw new Error("Create your Health Rewards Wallet first.");
      }
      if (!preview || preview[1] <= BigInt(0)) {
        throw new Error("Nothing available to claim for this contract.");
      }

      const minRicOut = await getMinRicOut(preview[1]);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

      await publicClient.simulateContract({
        account: address,
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "claim",
        args: [
          planId,
          healthWallet.wallet.address as Address,
          minRicOut,
          deadline,
        ],
      });

      const hash = await writeContractAsync({
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "claim",
        args: [
          planId,
          healthWallet.wallet.address as Address,
          minRicOut,
          deadline,
        ],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      toast.success("RST profit claimed.");
      refetchPlanData();
    } catch (error) {
      toast.error(getReadableError(error));
    }
  }

  async function terminatePlan(planId: bigint) {
    try {
      if (!publicClient) throw new Error("Wallet client is not ready.");
      if (!address) throw new Error("Connect wallet first.");

      const confirmed = window.confirm(
        "Terminate this RST contract? Future revenue-share rights for this contract will be forfeited. Initial capital becomes claimable monthly over 12 capital repayments, not all at once."
      );

      if (!confirmed) return;

      await publicClient.simulateContract({
        account: address,
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "terminate",
        args: [planId],
      });

      const hash = await writeContractAsync({
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "terminate",
        args: [planId],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      toast.success("RST contract terminated. Monthly capital claims are now available according to the contract schedule.");
      refetchPlanData();
    } catch (error) {
      toast.error(getReadableError(error));
    }
  }

  async function claimTerminationCapital(planId: bigint, plan?: PlanTuple) {
    try {
      if (!publicClient) throw new Error("Wallet client is not ready.");
      if (!address) throw new Error("Connect wallet first.");

      const grossUsdt = getNextTerminationGross(plan);

      if (grossUsdt <= BigInt(0)) {
        throw new Error("No monthly termination capital is available to claim.");
      }

      const minRicOut = await getMinRicOut(grossUsdt);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

      await publicClient.simulateContract({
        account: address,
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "claimTerminationCapital",
        args: [planId, minRicOut, deadline],
      });

      const hash = await writeContractAsync({
        address: RST_MANAGER_ADDRESS,
        abi: rstManagerAbi,
        functionName: "claimTerminationCapital",
        args: [planId, minRicOut, deadline],
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      toast.success("Monthly termination capital claimed.");
      refetchPlanData();
    } catch (error) {
      toast.error(getReadableError(error));
    }
  }

  async function copyAddress() {
    if (!healthWallet.wallet?.address) return;
    await navigator.clipboard.writeText(healthWallet.wallet.address);
    toast.success("Health Rewards Wallet copied.");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-[#10131A] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/rst"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0B0E14] text-white"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h1 className="text-2xl font-black text-white">
                My RST Subscriptions
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#A4AAB7]">
                View all your RST contracts, returns, claim status, termination
                schedule, and health rewards wallet.
              </p>
            </div>
          </div>

          <Link
            href="/rst"
            className="hidden items-center gap-2 rounded-xl border border-[#1250FF]/25 bg-[#1250FF]/10 px-4 py-3 text-sm font-black text-[#2287FF] sm:inline-flex"
          >
            Dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
          <Wallet className="text-[#2287FF]" size={24} />
          <p className="mt-4 text-xs text-[#A4AAB7]">RST Holdings</p>
          <p className="mt-2 text-xl font-black text-white">
            {formatToken(rstBalance as bigint | undefined, RST_DECIMALS, " RST")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
          <FileText className="text-[#FFC928]" size={24} />
          <p className="mt-4 text-xs text-[#A4AAB7]">Contracts</p>
          <p className="mt-2 text-xl font-black text-white">{planIds.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
          <TrendingUp className="text-[#19C46B]" size={24} />
          <p className="mt-4 text-xs text-[#A4AAB7]">Current OPV</p>
          <p className="mt-2 text-xl font-black text-white">
            {formatUsd(currentOpv as bigint | undefined)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10131A] p-4">
          <CheckCircle2 className="text-[#8B35FF]" size={24} />
          <p className="mt-4 text-xs text-[#A4AAB7]">Claim Path</p>
          <p className="mt-2 text-xl font-black text-white">
            {swapPath.length ? "Ready" : "Not Set"}
          </p>
        </div>
      </section>

      {isConnected ? (
        <>
          <HealthRewardWalletCard
            address={healthWallet.wallet?.address}
            isCreating={healthWallet.isCreating}
            error={healthWallet.error}
            onCreate={() => void healthWallet.createOrLoadWallet()}
          />

          {healthWallet.wallet?.address ? (
            <button
              type="button"
              onClick={copyAddress}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black text-[#D4D8E2]"
            >
              <Copy size={16} />
              Copy Health Rewards Wallet
            </button>
          ) : null}
        </>
      ) : (
        <DisconnectedHealthWalletCard />
      )}

      {!isConnected ? (
        <section className="rounded-2xl border border-white/10 bg-[#10131A] p-8 text-center">
          <ShieldAlert className="mx-auto text-[#7E8798]" size={44} />
          <p className="mt-4 text-lg font-black text-white">
            Connect wallet to view subscriptions
          </p>
          <p className="mt-2 text-sm text-[#A4AAB7]">
            Your RST contracts and Health Rewards Wallet are linked to your connected wallet.
          </p>
        </section>
      ) : planIds.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-[#10131A] p-8 text-center">
          <ShieldAlert className="mx-auto text-[#7E8798]" size={44} />
          <p className="mt-4 text-lg font-black text-white">
            No RST subscriptions yet
          </p>
          <p className="mt-2 text-sm text-[#A4AAB7]">
            Subscribe to RST to create your first shareholder contract.
          </p>
          <Link
            href="/rst"
            className="mx-auto mt-5 flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-[#FFC928] px-5 text-sm font-black text-[#05070B]"
          >
            Subscribe Now
            <ArrowRight size={16} />
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {planIds.map((planId, index) => {
            const plan = planReads.data?.[index]?.result as PlanTuple | undefined;
            const preview = previewReads.data?.[index]?.result as
              | ClaimPreview
              | undefined;

            return (
              <ContractCard
                key={planId.toString()}
                planId={planId}
                plan={plan}
                currentOpv={currentOpv as bigint | undefined}
                preview={preview}
                healthWalletAddress={healthWallet.wallet?.address}
                swapPath={swapPath}
                onClaim={claim}
                onTerminate={terminatePlan}
                onClaimTerminationCapital={claimTerminationCapital}
                isActionPending={isPending}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

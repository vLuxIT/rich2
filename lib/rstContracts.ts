"use client";

import { parseAbi, type Address } from "viem";

export const RST_TOKEN_ADDRESS =
  "0x0Cdd0f508865c266168b0011956a013a1883F450" as Address;

export const RIC_ALLOCATION_ROUTER_ADDRESS =
  "0x8fA5bFBF9af322216a7f4DC5849f4832eb08A55E" as Address;

export const RST_TREASURY_ADDRESS =
  "0x40c9497B35002C3Eb5b4096810644b81C220359D" as Address;

export const RIC_CLAIM_PROCESSOR_ADDRESS =
  "0x8B867A8A031654ded045EBf7d08e53F146Bc62E2" as Address;

export const RST_MANAGER_ADDRESS =
  "0x36D2C7a9759dae8C860d799e35C95e5Dba7b89FF" as Address;

export const MONTHLY_PROFIT_ALLOCATOR_ADDRESS =
  "0x91751086c557AC215BDc699969AdE293D3F1E30A" as Address;

export const rstTokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address user) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfersRestricted() view returns (bool)",
  "function PROGRAM_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
]);

export const rstManagerAbi = parseAbi([
  "function subscriptionPriceUsdt() view returns (uint256)",
  "function currentOpvUsdt() view returns (uint256)",
  "function minimumSubscriptionUsdt() view returns (uint256)",
  "function lockPeriod() view returns (uint256)",
  "function currentTermsHash() view returns (bytes32)",
  "function currentTermsURI() view returns (string)",
  "function currentTermsVersion() view returns (uint256)",
  "function nextPlanId() view returns (uint256)",

  "function previewSubscription(uint256 capitalUsdt) view returns (uint256 taxUsdt, uint256 totalUsdt, uint256 rstAmount)",
  "function subscribe(uint256 capitalUsdt, bytes32 acceptedTermsHash)",

  "function getHolderPlans(address user) view returns (uint256[] memory)",
  "function plans(uint256 planId) view returns (address holder, uint256 rstAmount, uint256 initialCapitalUsdt, uint256 cumulativeGrossClaimsUsdt, uint256 subscribedAt, uint256 nextClaimAt, uint256 claimsReleased, uint256 terminationClaims, uint8 status, uint256 terminationMonthlyUsdt, uint256 terminationRemainderUsdt)",
  "function previewClaim(uint256 planId) view returns (uint256 releases, uint256 grossUsdt, uint256 remainingCap)",

  "function claim(uint256 planId, address healthRewardWallet, uint256 minRicOut, uint256 deadline)",
  "function terminate(uint256 planId)",
  "function claimTerminationCapital(uint256 planId, uint256 minRicOut, uint256 deadline)",

  "event Subscribed(address indexed holder, uint256 indexed planId, uint256 capitalUsdt, uint256 rstAmount)",
  "event ClaimProcessed(uint256 indexed planId, address indexed holder, uint256 releases, uint256 grossUsdt, uint256 taxUsdt, uint256 usdtSwapped, uint256 ricReceived, uint256 healthRic, uint256 holderRic)",
]);

export const rstTreasuryAbi = parseAbi([
  "function redemptionPoolBalance() view returns (uint256)",
  "function treasuryUsdtBalance() view returns (uint256)",
  "function isRedemptionPoolFullyBacked() view returns (bool)",
  "function ecosystemWallet() view returns (address)",
  "function vluxWallet() view returns (address)",
  "function supplementWallet() view returns (address)",
  "function ricRouter() view returns (address)",
]);

export const ricAllocationRouterAbi = parseAbi([
  "function pendingSubscriptionUsdt() view returns (uint256)",
  "function pendingMonthlyUsdt() view returns (uint256)",
  "function getSwapPath() view returns (address[] memory)",
  "function burnAddress() view returns (address)",
  "function referralAddress() view returns (address)",
  "function stakingAddress() view returns (address)",
  "function dexRouter() view returns (address)",
  "function executeSubscriptionBatch(uint256 amount, uint256 minRicOut, uint256 deadline)",
  "function executeMonthlyBatch(uint256 amount, uint256 minRicOut, uint256 deadline)",
]);

export const ricClaimProcessorAbi = parseAbi([
  "function taxWallet() view returns (address)",
  "function treasury() view returns (address)",
  "function dexRouter() view returns (address)",
  "function getSwapPath() view returns (address[] memory)",
  "function CLAIM_TAX_BPS() view returns (uint256)",
  "function HEALTH_REWARD_BPS() view returns (uint256)",
]);

export const monthlyProfitAllocatorAbi = parseAbi([
  "function usdt() view returns (address)",
  "function treasury() view returns (address)",
  "function ricRouter() view returns (address)",
  "function periodProcessed(bytes32 periodId) view returns (bool)",
  "function allocate(bytes32 periodId, uint256 amount)",
]);

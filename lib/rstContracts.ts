"use client";

import { parseAbi, type Address } from "viem";

export const RST_TOKEN_ADDRESS =
  "0x0dba32d68a0604f53f39a3660831322e955911fa" as Address;

export const RIC_ALLOCATION_ROUTER_ADDRESS =
  "0x5ff664dab40a564252c7dbdc5079e12dff6b110e" as Address;

export const RST_TREASURY_ADDRESS =
  "0x12c9409fa0a017c2c5e19a4bd4645e88f44ceac7" as Address;

export const RIC_CLAIM_PROCESSOR_ADDRESS =
  "0xeFEd4E99c6634B1CbD0300B6764f2A2167AaB4B5" as Address;

export const RST_MANAGER_ADDRESS =
  "0x8f570a9234633fd4f2778015f38916a28b841c94" as Address;

export const MONTHLY_PROFIT_ALLOCATOR_ADDRESS =
  "0x23581745533bD9b96dF2ac7ec461258C3b27B173" as Address;

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

export const STAKING_CONTRACT =
  "0x0AEB766D0Ea9E87a879fC1dE466BEa42aB17E420" as const;

export const stakingAbi = [
  {
    inputs: [],
    name: "getAllPlans",
    outputs: [
      { internalType: "uint8[]", name: "ids", type: "uint8[]" },
      { internalType: "uint256[]", name: "durations", type: "uint256[]" },
      { internalType: "uint256[]", name: "rewardPercents", type: "uint256[]" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingStats",
    outputs: [
      { internalType: "uint256", name: "rewardPoolFunded", type: "uint256" },
      { internalType: "uint256", name: "rewardPoolRemaining", type: "uint256" },
      { internalType: "uint256", name: "rewardsDistributed", type: "uint256" },
      { internalType: "uint256", name: "rewardsReserved", type: "uint256" },
      { internalType: "uint256", name: "totalStaked", type: "uint256" },
      { internalType: "uint256", name: "activeStakeTotal", type: "uint256" },
      { internalType: "uint256", name: "activeStakerTotal", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumStake",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "MINIMUM_STAKE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CLAIM_INTERVAL",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserStakeCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "stakeId", type: "uint256" },
    ],
    name: "getUserStake",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint8", name: "plan", type: "uint8" },
          { internalType: "uint256", name: "rewardPercent", type: "uint256" },
          { internalType: "uint256", name: "duration", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "uint256", name: "totalReward", type: "uint256" },
          { internalType: "uint256", name: "rewardClaimed", type: "uint256" },
          { internalType: "uint256", name: "lastClaimTime", type: "uint256" },
          { internalType: "bool", name: "principalClaimed", type: "bool" },
        ],
        internalType: "struct RichcoinStaking.StakePosition",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "stakeId", type: "uint256" },
    ],
    name: "claimableReward",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "stakeId", type: "uint256" },
    ],
    name: "dailyEarning",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "stakeId", type: "uint256" },
    ],
    name: "nextClaimTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "stakeId", type: "uint256" },
    ],
    name: "secondsUntilNextClaim",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint8", name: "plan", type: "uint8" },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
    name: "completeStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

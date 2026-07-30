import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseAbi,
  parseGwei,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAKING_CONTRACT =
  "0x0AEB766D0Ea9E87a879fC1dE466BEa42aB17E420" as Address;

const RIC_CONTRACT =
  "0x4e739DBC37f8B46dbb23C72F523cfb989EA85bf4" as Address;

const TRANSFER_WALLET =
  "0xe9ac421ea456660C730BB96639B0f63D9BEFE61C" as Address;

const RIC_DECIMALS = 18;
const MIN_RIC_BALANCE = BigInt(1_000_000) * BigInt(10) ** BigInt(RIC_DECIMALS);

const stakingRewardPoolAbi = parseAbi([
  "function fundRewardPool(uint256 amount)",
]);

const DEFAULT_GAS_PRICE_GWEI = "0.05";

const DEFAULT_BATCH_GAS_LIMIT = BigInt(
  process.env.RST_BATCH_GAS_LIMIT || "2000000"
);

const MAX_BATCH_GAS_LIMIT = BigInt(
  process.env.RST_BATCH_MAX_GAS_LIMIT || "5000000"
);

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getRpcUrl() {
  const rpcUrl = process.env.BSC_RPC_URL;

  if (!rpcUrl) {
    throw new Error("Missing BSC_RPC_URL.");
  }

  return rpcUrl;
}

function getPrivateKey() {
  const privateKey = process.env.STAKING_REWARD_FUNDER_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Missing STAKING_REWARD_FUNDER_PRIVATE_KEY.");
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error("STAKING_REWARD_FUNDER_PRIVATE_KEY must start with 0x.");
  }

  return privateKey as Hex;
}

function getLegacyGasPrice() {
  return parseGwei(process.env.BSC_GAS_PRICE_GWEI || DEFAULT_GAS_PRICE_GWEI);
}

function formatRic(value: bigint) {
  return formatUnits(value, RIC_DECIMALS);
}

async function getSafeGasLimit({
  estimateGas,
  label,
}: {
  estimateGas: () => Promise<bigint>;
  label: string;
}) {
  let gasLimit = DEFAULT_BATCH_GAS_LIMIT;

  try {
    const estimatedGas = await estimateGas();
    const estimatedWithBuffer = (estimatedGas * BigInt(130)) / BigInt(100);

    if (
      estimatedWithBuffer > DEFAULT_BATCH_GAS_LIMIT &&
      estimatedWithBuffer <= MAX_BATCH_GAS_LIMIT
    ) {
      gasLimit = estimatedWithBuffer;
    }
  } catch (error) {
    console.warn(
      `Could not estimate ${label} gas. Using RST_BATCH_GAS_LIMIT.`,
      error
    );
  }

  return gasLimit;
}

async function assertFunderHasEnoughBnb({
  publicClient,
  funder,
  gasPrice,
  totalGasLimit,
}: {
  publicClient: ReturnType<typeof createPublicClient>;
  funder: Address;
  gasPrice: bigint;
  totalGasLimit: bigint;
}) {
  const balance = await publicClient.getBalance({ address: funder });
  const required = gasPrice * totalGasLimit;

  if (balance < required) {
    throw new Error(
      `Staking reward funder needs more BNB. Funder ${funder} has ${formatUnits(
        balance,
        18
      )} BNB, but this route reserves about ${formatUnits(
        required,
        18
      )} BNB for gas. Fund the STAKING_REWARD_FUNDER_PRIVATE_KEY wallet or reduce BSC_GAS_PRICE_GWEI / RST_BATCH_GAS_LIMIT.`
    );
  }

  return {
    balance,
    required,
  };
}

export async function GET() {
  try {
    const rpcUrl = getRpcUrl();
    const account = privateKeyToAccount(getPrivateKey());
    const gasPrice = getLegacyGasPrice();

    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(rpcUrl),
    });

    const ricBalance = await publicClient.readContract({
      address: RIC_CONTRACT,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });

    if (ricBalance < MIN_RIC_BALANCE) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: "RIC balance is below 1,000,000. No transaction was sent.",
        funder: account.address,
        ricBalanceRaw: ricBalance.toString(),
        ricBalanceFormatted: formatRic(ricBalance),
        minimumRicRequired: "1000000",
      });
    }

    const fundAmount = (ricBalance * BigInt(80)) / BigInt(100);
    const transferAmount = ricBalance - fundAmount;

    const allowance = await publicClient.readContract({
      address: RIC_CONTRACT,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, STAKING_CONTRACT],
    });

    const needsApproval = allowance < fundAmount;

    const approvalGasLimit = needsApproval
      ? await getSafeGasLimit({
          label: "RIC approval",
          estimateGas: () =>
            publicClient.estimateContractGas({
              account,
              address: RIC_CONTRACT,
              abi: erc20Abi,
              functionName: "approve",
              args: [STAKING_CONTRACT, fundAmount],
              gasPrice,
            }),
        })
      : BigInt(0);

    const fundGasLimit = await getSafeGasLimit({
      label: "fundRewardPool",
      estimateGas: () =>
        publicClient.estimateContractGas({
          account,
          address: STAKING_CONTRACT,
          abi: stakingRewardPoolAbi,
          functionName: "fundRewardPool",
          args: [fundAmount],
          gasPrice,
        }),
    });

    const transferGasLimit = await getSafeGasLimit({
      label: "RIC transfer",
      estimateGas: () =>
        publicClient.estimateContractGas({
          account,
          address: RIC_CONTRACT,
          abi: erc20Abi,
          functionName: "transfer",
          args: [TRANSFER_WALLET, transferAmount],
          gasPrice,
        }),
    });

    const totalGasLimit = approvalGasLimit + fundGasLimit + transferGasLimit;

    const funderGas = await assertFunderHasEnoughBnb({
      publicClient,
      funder: account.address,
      gasPrice,
      totalGasLimit,
    });

    const txHashes: {
      approval?: Hex;
      fundRewardPool?: Hex;
      transfer?: Hex;
    } = {};

    if (needsApproval) {
      await publicClient.simulateContract({
        account,
        address: RIC_CONTRACT,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_CONTRACT, fundAmount],
        gas: approvalGasLimit,
        gasPrice,
      });

      const approvalHash = await walletClient.writeContract({
        address: RIC_CONTRACT,
        abi: erc20Abi,
        functionName: "approve",
        args: [STAKING_CONTRACT, fundAmount],
        gas: approvalGasLimit,
        gasPrice,
      });

      txHashes.approval = approvalHash;

      await publicClient.waitForTransactionReceipt({
        hash: approvalHash,
        confirmations: 1,
      });
    }

    await publicClient.simulateContract({
      account,
      address: STAKING_CONTRACT,
      abi: stakingRewardPoolAbi,
      functionName: "fundRewardPool",
      args: [fundAmount],
      gas: fundGasLimit,
      gasPrice,
    });

    const fundHash = await walletClient.writeContract({
      address: STAKING_CONTRACT,
      abi: stakingRewardPoolAbi,
      functionName: "fundRewardPool",
      args: [fundAmount],
      gas: fundGasLimit,
      gasPrice,
    });

    txHashes.fundRewardPool = fundHash;

    const fundReceipt = await publicClient.waitForTransactionReceipt({
      hash: fundHash,
      confirmations: 1,
    });

    await publicClient.simulateContract({
      account,
      address: RIC_CONTRACT,
      abi: erc20Abi,
      functionName: "transfer",
      args: [TRANSFER_WALLET, transferAmount],
      gas: transferGasLimit,
      gasPrice,
    });

    const transferHash = await walletClient.writeContract({
      address: RIC_CONTRACT,
      abi: erc20Abi,
      functionName: "transfer",
      args: [TRANSFER_WALLET, transferAmount],
      gas: transferGasLimit,
      gasPrice,
    });

    txHashes.transfer = transferHash;

    const transferReceipt = await publicClient.waitForTransactionReceipt({
      hash: transferHash,
      confirmations: 1,
    });

    const finalRicBalance = await publicClient.readContract({
      address: RIC_CONTRACT,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });

    return jsonResponse({
      ok: true,
      skipped: false,
      funder: account.address,
      ricContract: RIC_CONTRACT,
      stakingContract: STAKING_CONTRACT,
      transferWallet: TRANSFER_WALLET,
      initialRicBalanceRaw: ricBalance.toString(),
      initialRicBalanceFormatted: formatRic(ricBalance),
      fundRewardPoolAmountRaw: fundAmount.toString(),
      fundRewardPoolAmountFormatted: formatRic(fundAmount),
      transferAmountRaw: transferAmount.toString(),
      transferAmountFormatted: formatRic(transferAmount),
      finalRicBalanceRaw: finalRicBalance.toString(),
      finalRicBalanceFormatted: formatRic(finalRicBalance),
      approvalNeeded: needsApproval,
      txHashes,
      receipts: {
        fundRewardPool: {
          status: fundReceipt.status,
          blockNumber: fundReceipt.blockNumber.toString(),
          gasUsed: fundReceipt.gasUsed.toString(),
        },
        transfer: {
          status: transferReceipt.status,
          blockNumber: transferReceipt.blockNumber.toString(),
          gasUsed: transferReceipt.gasUsed.toString(),
        },
      },
      gas: {
        gasPriceWei: gasPrice.toString(),
        approvalGasLimit: approvalGasLimit.toString(),
        fundGasLimit: fundGasLimit.toString(),
        transferGasLimit: transferGasLimit.toString(),
        totalGasLimit: totalGasLimit.toString(),
        funderBalanceBnb: formatUnits(funderGas.balance, 18),
        reservedGasBnb: formatUnits(funderGas.required, 18),
      },
    });
  } catch (error) {
    console.error("staking fund reward pool failed:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Staking reward pool funding failed.",
      },
      500
    );
  }
}

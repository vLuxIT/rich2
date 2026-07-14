import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, erc20Abi, formatUnits, http, isAddress } from "viem";
import { bsc } from "viem/chains";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address || !isAddress(address)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Valid wallet address is required",
        },
        { status: 400 }
      );
    }

    const ricTokenAddress = process.env.RIC_TOKEN_ADDRESS;

    if (!ricTokenAddress || !isAddress(ricTokenAddress)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Valid RIC_TOKEN_ADDRESS env value is required",
        },
        { status: 500 }
      );
    }

    const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    const [balanceRaw, decimals, symbol] = await Promise.all([
      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }),

      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),

      publicClient.readContract({
        address: ricTokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ]);

    return NextResponse.json({
      ok: true,
      wallet: address,
      token: ricTokenAddress,
      symbol,
      decimals,
      balanceRaw: balanceRaw.toString(),
      balance: formatUnits(balanceRaw, decimals),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch RIC balance";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
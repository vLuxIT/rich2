import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";

const rpcUrl = process.env.BSC_RPC_URL;

if (!rpcUrl) {
  throw new Error("Missing BSC_RPC_URL");
}

export const bscClient = createPublicClient({
  chain: bsc,
  transport: http(rpcUrl),
});
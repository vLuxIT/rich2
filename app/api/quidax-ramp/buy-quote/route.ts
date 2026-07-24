import { getBuyQuote } from "@/lib/quidax-ramp";
import { fail, ok, positiveAmount } from "@/lib/quidax-route-utils";
import type { RampNetwork } from "@/lib/quidax-types";

export const runtime = "nodejs";

const ALLOWED_NETWORKS = new Set<RampNetwork>([
  "celo", "polygon", "erc20", "bep20", "lsk",
  "solana", "base", "ton", "trc20",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fiatAmount = positiveAmount(
      url.searchParams.get("fiat_amount"),
      "fiat_amount",
    );
    const network = (
      url.searchParams.get("token_network") || "bep20"
    ).toLowerCase() as RampNetwork;

    if (!ALLOWED_NETWORKS.has(network)) {
      return Response.json(
        { success: false, error: "Unsupported token_network" },
        { status: 400 },
      );
    }

    const data = await getBuyQuote({
      currency: "ngn",
      token: "usdt",
      fiat_amount: fiatAmount,
      token_network: network,
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

import { getSellQuote } from "@/lib/quidax-ramp";
import { fail, ok, positiveAmount } from "@/lib/quidax-route-utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenAmount = positiveAmount(
      url.searchParams.get("token_amount"),
      "token_amount",
    );

    const data = await getSellQuote({
      token: "usdt",
      currency: "ngn",
      token_amount: tokenAmount,
      token_network: "bep20",
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

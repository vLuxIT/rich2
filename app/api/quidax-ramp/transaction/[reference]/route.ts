import {
  getOffRampTransaction,
  getOnRampTransaction,
} from "@/lib/quidax-ramp";
import { fail, ok } from "@/lib/quidax-route-utils";

export const runtime = "nodejs";

type Context = { params: Promise<{ reference: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { reference } = await context.params;
    const type = new URL(request.url).searchParams.get("type");

    if (type !== "buy" && type !== "sell") {
      return Response.json(
        { success: false, error: 'Query parameter "type" must be "buy" or "sell"' },
        { status: 400 },
      );
    }

    const data =
      type === "buy"
        ? await getOnRampTransaction(reference)
        : await getOffRampTransaction(reference);

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

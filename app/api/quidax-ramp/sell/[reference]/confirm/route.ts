import { confirmOffRamp } from "@/lib/quidax-ramp";
import { fail, ok } from "@/lib/quidax-route-utils";

export const runtime = "nodejs";

type Context = { params: Promise<{ reference: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const { reference } = await context.params;
    const data = await confirmOffRamp(reference);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

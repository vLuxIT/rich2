import { getRampBanks } from "@/lib/quidax-ramp";
import { fail, ok } from "@/lib/quidax-route-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getRampBanks("NG");
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

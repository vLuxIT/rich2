import { addOffRampBankAccount } from "@/lib/quidax-ramp";
import {
  fail,
  objectValue,
  ok,
  requiredString,
} from "@/lib/quidax-route-utils";

export const runtime = "nodejs";

type Context = { params: Promise<{ reference: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { reference } = await context.params;
    const input = objectValue(await request.json(), "body");

    const data = await addOffRampBankAccount(reference, {
      bank_code: requiredString(input.bank_code, "bank_code"),
      account_number: requiredString(input.account_number, "account_number"),
      currency_code: "ngn",
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

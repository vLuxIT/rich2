import { initiateOffRamp } from "@/lib/quidax-ramp";
import {
  fail,
  objectValue,
  ok,
  positiveAmount,
  requiredString,
} from "@/lib/quidax-route-utils";
import type { InitiateOffRampBody, QuidaxCustomer } from "@/lib/quidax-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = objectValue(await request.json(), "body");
    const customerInput = objectValue(input.customer, "customer");

    const customer: QuidaxCustomer = {
      ...customerInput,
      first_name: requiredString(customerInput.first_name, "customer.first_name"),
      last_name: requiredString(customerInput.last_name, "customer.last_name"),
    } as QuidaxCustomer;

    const body: InitiateOffRampBody = {
      from_currency: "usdt",
      to_currency: "ngn",
      from_amount: positiveAmount(input.from_amount, "from_amount"),
      network: "bep20",
      merchant_reference: requiredString(
        input.merchant_reference,
        "merchant_reference",
      ),
      customer,
    };

    const data = await initiateOffRamp(body);
    return ok(data, 201);
  } catch (error) {
    return fail(error);
  }
}

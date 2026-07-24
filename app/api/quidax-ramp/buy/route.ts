import { initiateOnRamp } from "@/lib/quidax-ramp";
import {
  fail,
  objectValue,
  ok,
  positiveAmount,
  requiredString,
} from "@/lib/quidax-route-utils";
import type {
  InitiateOnRampBody,
  QuidaxCustomer,
  QuidaxWalletAddress,
} from "@/lib/quidax-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = objectValue(await request.json(), "body");
    const customerInput = objectValue(input.customer, "customer");
    const walletInput = objectValue(input.wallet_address, "wallet_address");

    const customer: QuidaxCustomer = {
      ...customerInput,
      first_name: requiredString(customerInput.first_name, "customer.first_name"),
      last_name: requiredString(customerInput.last_name, "customer.last_name"),
    } as QuidaxCustomer;

    const walletAddress: QuidaxWalletAddress = {
      ...walletInput,
      address: requiredString(walletInput.address, "wallet_address.address"),
      network: "bep20",
    } as QuidaxWalletAddress;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.address)) {
      return Response.json(
        { success: false, error: "wallet_address.address must be a valid EVM address" },
        { status: 400 },
      );
    }

    const body: InitiateOnRampBody = {
      from_currency: "ngn",
      to_currency: "usdt",
      from_amount: positiveAmount(input.from_amount, "from_amount"),
      merchant_reference: requiredString(
        input.merchant_reference,
        "merchant_reference",
      ),
      customer,
      wallet_address: walletAddress,
    };

    const data = await initiateOnRamp(body);
    return ok(data, 201);
  } catch (error) {
    return fail(error);
  }
}

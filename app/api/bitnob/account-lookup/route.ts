import { NextResponse } from "next/server";
import { bitnobRequest } from "@/lib/bitnob";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { accountNumber, bankCode } = body;

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { message: "accountNumber and bankCode are required" },
        { status: 400 }
      );
    }

    const data = await bitnobRequest("/api/payouts/account-lookup", {
      method: "POST",
      body: {
        account_number: accountNumber,
        bank_code: bankCode,
        country: "NG",
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Account lookup API error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify account",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { bitnobRequest } from "@/lib/bitnob";

export async function GET() {
  try {
    const data = await bitnobRequest("/api/payouts/banks/NG");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Banks API error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch banks",
      },
      { status: 500 }
    );
  }
}
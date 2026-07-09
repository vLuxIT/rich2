import { NextResponse } from "next/server";
import { quidaxRequest } from "@/lib/quidax";

export async function GET() {
  try {
    const response = await quidaxRequest(
      "/merchants/custodial/banks?country=NG"
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Quidax test error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
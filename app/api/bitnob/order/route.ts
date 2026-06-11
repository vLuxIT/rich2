import { NextResponse } from "next/server";
import { bitnobRequest } from "@/lib/bitnob";

export async function GET() {
  try {
    const data = await bitnobRequest("/api/whoami");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Whoami failed",
      },
      { status: 500 }
    );
  }
}
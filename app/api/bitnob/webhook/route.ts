import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Bitnob integration is not active yet" },
    { status: 501 }
  );
}
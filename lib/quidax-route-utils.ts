import { NextResponse } from "next/server";
import { QuidaxApiError, errorMessage } from "@/lib/quidax-errors";

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: unknown): NextResponse {
  if (error instanceof QuidaxApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        quidaxStatus: error.status,
        details: error.details,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { success: false, error: errorMessage(error) },
    { status: 500 },
  );
}

export function requiredString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QuidaxApiError(`${field} is required`, 400);
  }
  return value.trim();
}

export function positiveAmount(value: unknown, field: string): string {
  const amount = requiredString(
    typeof value === "number" ? String(value) : value,
    field,
  );

  if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
    throw new QuidaxApiError(`${field} must be a positive amount`, 400);
  }

  return amount;
}

export function objectValue(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new QuidaxApiError(`${field} must be an object`, 400);
  }
  return value as Record<string, unknown>;
}

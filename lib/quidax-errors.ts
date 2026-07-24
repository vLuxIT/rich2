export type QuidaxErrorDetails = unknown;

export class QuidaxApiError extends Error {
  readonly status: number;
  readonly details: QuidaxErrorDetails;

  constructor(message: string, status = 500, details: QuidaxErrorDetails = null) {
    super(message);
    this.name = "QuidaxApiError";
    this.status = status;
    this.details = details;
  }
}

export function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return "Unexpected Quidax API error";
}

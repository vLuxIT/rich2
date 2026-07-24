import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { QuidaxApiError } from "@/lib/quidax-errors";
import type {
  AddBankAccountBody,
  BuyQuoteQuery,
  InitiateOffRampBody,
  InitiateOnRampBody,
  SellQuoteQuery,
} from "@/lib/quidax-types";

const DEFAULT_RAMP_BASE_URL = "https://ramp-be.quidax.io/api/v1";

function rampConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.QUIDAX_API_KEY?.trim();
  const baseUrl = (
    process.env.QUIDAX_RAMP_BASE_URL?.trim() || DEFAULT_RAMP_BASE_URL
  ).replace(/\/+$/, "");

  if (!apiKey) {
    throw new QuidaxApiError("Missing QUIDAX_API_KEY", 500);
  }

  return { apiKey, baseUrl };
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function quidaxRampFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiKey, baseUrl } = rampConfig();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${apiKey}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const record =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : null;

    const message =
      (record && typeof record.message === "string" && record.message) ||
      (record && typeof record.error === "string" && record.error) ||
      `Quidax Ramp request failed with status ${response.status}`;

    throw new QuidaxApiError(message, response.status, payload);
  }

  return payload as T;
}

function queryString(values: Record<string, string>): string {
  return new URLSearchParams(values).toString();
}

export function getBuyQuote<T = unknown>(query: BuyQuoteQuery): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/purchase_quotes/buy?${queryString(query)}`,
  );
}

export function getSellQuote<T = unknown>(query: SellQuoteQuery): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/purchase_quotes/sell?${queryString(query)}`,
  );
}

export function initiateOnRamp<T = unknown>(
  body: InitiateOnRampBody,
): Promise<T> {
  return quidaxRampFetch<T>(
    "merchants/custodial/on_ramp_transactions/initiate",
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function confirmOnRamp<T = unknown>(
  merchantReference: string,
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/custodial/on_ramp_transactions/${encodeURIComponent(merchantReference)}/confirm`,
    { method: "POST" },
  );
}

export function initiateOffRamp<T = unknown>(
  body: InitiateOffRampBody,
): Promise<T> {
  return quidaxRampFetch<T>(
    "merchants/custodial/off_ramp_transactions/initiate",
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function addOffRampBankAccount<T = unknown>(
  merchantReference: string,
  body: AddBankAccountBody,
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/custodial/off_ramp_transactions/${encodeURIComponent(merchantReference)}/bank_account`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function confirmOffRamp<T = unknown>(
  merchantReference: string,
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/custodial/off_ramp_transactions/${encodeURIComponent(merchantReference)}/confirm`,
    { method: "POST" },
  );
}

export function getRampBanks<T = unknown>(
  country: "NG" | "GH" = "NG",
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/custodial/banks?${queryString({ country })}`,
  );
}

export function getOnRampTransaction<T = unknown>(
  reference: string,
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/on_ramp_transaction/${encodeURIComponent(reference)}`,
  );
}

export function getOffRampTransaction<T = unknown>(
  reference: string,
): Promise<T> {
  return quidaxRampFetch<T>(
    `merchants/off_ramp_transaction/${encodeURIComponent(reference)}`,
  );
}

export function verifyRampWebhook(
  rawBody: string,
  suppliedSignature: string | null,
): boolean {
  const secret = process.env.QUIDAX_RAMP_WEBHOOK_SECRET?.trim();
  if (!secret || !suppliedSignature) return false;

  const calculated = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(calculated, "utf8");
  const received = Buffer.from(suppliedSignature.trim(), "utf8");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

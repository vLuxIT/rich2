import "server-only";

import { QuidaxApiError } from "@/lib/quidax-errors";

const DEFAULT_BASE_URL =
  "https://openapi.quidax.io/exchange-open-api/api/v1";

function config(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.QUIDAX_API_KEY?.trim();
  const baseUrl = (
    process.env.QUIDAX_BASE_URL?.trim() || DEFAULT_BASE_URL
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

export async function quidaxFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { apiKey, baseUrl } = config();
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
    const message =
      typeof payload === "object" &&
      payload !== null &&
      typeof (payload as Record<string, unknown>).message === "string"
        ? String((payload as Record<string, unknown>).message)
        : `Quidax request failed with status ${response.status}`;

    throw new QuidaxApiError(message, response.status, payload);
  }

  return payload as T;
}

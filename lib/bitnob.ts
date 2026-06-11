import crypto from "crypto";

const BITNOB_BASE_URL =
  process.env.BITNOB_BASE_URL || "https://api.bitnob.com";

const CLIENT_ID = process.env.BITNOB_CLIENT_ID;
const CLIENT_SECRET = process.env.BITNOB_SECRET_KEY;

function generateAuthHeaders(payload: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing Bitnob credentials in .env.local");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const stringToSign = `${CLIENT_ID}:${timestamp}:${nonce}:${payload}`;

  const signature = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(stringToSign)
    .digest("hex");

  return {
    "Content-Type": "application/json",
    "X-Auth-Client": CLIENT_ID,
    "X-Auth-Timestamp": timestamp,
    "X-Auth-Nonce": nonce,
    "X-Auth-Signature": signature,
  };
}

export async function bitnobRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  }
): Promise<T> {
  const method = options?.method || "GET";
  const payload = options?.body ? JSON.stringify(options.body) : "";

  const response = await fetch(`${BITNOB_BASE_URL}${path}`, {
    method,
    headers: generateAuthHeaders(payload),
    body: method === "GET" ? undefined : payload,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Bitnob API Error:", data);

    throw new Error(
      data?.detail ||
        data?.message ||
        data?.error ||
        "Bitnob request failed"
    );
  }

  return data as T;
}
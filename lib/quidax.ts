const QUIDAX_BASE_URL: string =
  process.env.QUIDAX_BASE_URL ?? "https://ramp-be.quidax.io/api/v1";

export async function quidaxRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const privateKey = process.env.QUIDAX_SECRET_KEY;

  if (!privateKey) {
    throw new Error("Missing QUIDAX_SECRET_KEY");
  }

  const response = await fetch(`${QUIDAX_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "private-Key": privateKey,
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Quidax API Error:", data);
    throw new Error(data?.message || data?.error || "Quidax request failed");
  }

  return data as T;
}
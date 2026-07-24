import { verifyRampWebhook } from "@/lib/quidax-ramp";

export const runtime = "nodejs";

/**
 * IMPORTANT:
 * Persist the event to your database before returning 200 in production.
 * Add idempotency using the Quidax event/transaction reference.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-ramp-signature");

  if (!verifyRampWebhook(rawBody, signature)) {
    return Response.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // TODO: save `event`, update local transaction status, and deduplicate.
  console.info("Verified Quidax Ramp webhook", event);

  // Quidax requires an HTTP 200 acknowledgement.
  return Response.json({ success: true });
}

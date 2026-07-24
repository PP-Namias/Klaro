import crypto from "crypto";
import type { NextRequest } from "next/server";

import { env } from "~/env";

function setCorsHeaders(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
}

export const OPTIONS = () => {
  const res = new Response(null, { status: 204 });
  setCorsHeaders(res);
  return res;
};

/**
 * Validate Cal.com webhook signature (HMAC-SHA256)
 * Cal.com signs all webhooks with the shared secret
 */
function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) {
    console.warn("Missing X-Cal-Signature-256 header");
    return false;
  }

  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

export const POST = async (req: NextRequest) => {
  try {
    // Read body as string first for signature verification
    const bodyString = await req.text();
    const signature = req.headers.get("x-cal-signature-256");

    // Verify webhook signature if secret is configured
    if (env.CAL_COM_WEBHOOK_SECRET) {
      const isValid = validateWebhookSignature(
        bodyString,
        signature,
        env.CAL_COM_WEBHOOK_SECRET,
      );

      if (!isValid) {
        console.error("Invalid Cal.com webhook signature");
        const res = new Response(
          JSON.stringify({
            error: "Unauthorized",
            details: "Invalid webhook signature",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
        setCorsHeaders(res);
        return res;
      }
    }

    // Parse body string as JSON (can't call req.json() again after req.text())
    const payload = JSON.parse(bodyString);
    const {
      eventId,
      eventTitle,
      eventDescription,
      startTime,
      endTime,
      attendees,
    } = payload;

    // Log webhook for debugging
    console.log("Cal.com webhook received:", {
      eventId,
      eventTitle,
      startTime,
      endTime,
      attendees,
    });

    // Optional: Store webhook data for audit/tracking
    if (!eventId) {
      const res = new Response(
        JSON.stringify({
          error: "Missing eventId in webhook",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
      setCorsHeaders(res);
      return res;
    }

    // If you want to track Cal.com bookings separately, create a calComEvent table.
    // For now, just acknowledge the webhook.
    const responseBody = {
      success: true,
      message: "Webhook received and processed",
      eventId,
    };

    const res = new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    console.error("POST /api/scheduling/webhook error:", err);
    const res = new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
    setCorsHeaders(res);
    return res;
  }
};

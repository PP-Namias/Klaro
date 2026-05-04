import type { NextRequest } from "next/server";
import { db } from "@klaro/db";
import { booking as bookingTable } from "@klaro/db/schema";
import { eq } from "drizzle-orm";

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

export const POST = async (req: NextRequest) => {
  try {
    const payload = await req.json();
    const { eventId, eventTitle, eventDescription, startTime, endTime, attendees } = payload;

    // Log webhook for debugging
    console.log("Cal.com webhook received:", {
      eventId,
      eventTitle,
      startTime,
      endTime,
      attendees,
    });

    // Optional: Store webhook data for audit/tracking
    // In a production system, you'd validate the webhook signature first
    if (!eventId) {
      const res = new Response(
        JSON.stringify({
          error: "Missing eventId in webhook",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
      }
    );
    setCorsHeaders(res);
    return res;
  }
};

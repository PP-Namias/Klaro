/* eslint-disable no-restricted-properties, @typescript-eslint/prefer-nullish-coalescing */

import type { NextRequest } from "next/server";

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

const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY;
const CAL_COM_BASE_URL = process.env.CAL_COM_BASE_URL || "https://api.cal.com";

export const POST = async (req: NextRequest) => {
  try {
    if (!CAL_COM_API_KEY) {
      const res = new Response(
        JSON.stringify({
          error: "Cal.com API key not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
      setCorsHeaders(res);
      return res;
    }

    const body = await req.json();
    const { eventTypeId, userName } = body;

    if (!eventTypeId) {
      const res = new Response(
        JSON.stringify({
          error: "eventTypeId is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
      setCorsHeaders(res);
      return res;
    }

    // Generate Cal.com booking link (server-side only, no API key in URL)
    // Format: https://cal.com/{username}/event-type
    const bookingLink = `${CAL_COM_BASE_URL}/api/v2/event-types/${eventTypeId}`;

    const responseBody = {
      url: `https://cal.com/${userName || "booking"}/${eventTypeId}`,
      bookingPage: bookingLink,
    };

    const res = new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    console.error("POST /api/scheduling/create error:", err);
    const res = new Response(
      JSON.stringify({
        error: "Failed to create scheduling link",
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

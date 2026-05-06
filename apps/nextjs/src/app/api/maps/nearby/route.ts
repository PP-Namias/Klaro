import type { NextRequest } from "next/server";

import { appRouter, createTRPCContext } from "@klaro/api";

import { auth } from "~/auth/server";
import { searchNearbySchema } from "@klaro/validators";

const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};

export const OPTIONS = () => {
  const response = new Response(null, { status: 204 });
  setCorsHeaders(response);
  return response;
};

const handle = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);

    const fromQuery = Object.fromEntries(url.searchParams.entries());

    // If POST with JSON body, merge body over query params
    let body = {} as Record<string, unknown>;
    if (req.method === "POST") {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch (err) {
        // ignore JSON parse errors and rely on query params
      }
    }

    const rawInput = {
      latitude: fromQuery.latitude ?? body.latitude,
      longitude: fromQuery.longitude ?? body.longitude,
      radiusKm: fromQuery.radiusKm ?? body.radiusKm ?? 10,
      limit: fromQuery.limit ?? body.limit ?? 20,
      facilityType: fromQuery.facilityType ?? body.facilityType,
      ownership: fromQuery.ownership ?? body.ownership,
      philHealthOnly:
        fromQuery.philHealthOnly ?? body.philHealthOnly ?? false,
    } as Record<string, unknown>;

    const input = searchNearbySchema.parse({
      latitude: Number(rawInput.latitude),
      longitude: Number(rawInput.longitude),
      radiusKm: Number(rawInput.radiusKm),
      limit: Number(rawInput.limit),
      facilityType: rawInput.facilityType as string | undefined,
      ownership: rawInput.ownership as "public" | "private" | undefined,
      philHealthOnly: rawInput.philHealthOnly === true || rawInput.philHealthOnly === "true",
    });

    const ctx = await createTRPCContext({ auth, headers: req.headers });

    const caller = appRouter.createCaller(ctx);

    const results = await caller.facilities.searchNearby(input);

    const response = new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    setCorsHeaders(response);
    return response;
  } catch (err: any) {
    const message = err?.message ?? String(err);
    const response = new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(response);
    return response;
  }
};

export { handle as GET, handle as POST };

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */

import type { NextRequest } from "next/server";

import { appRouter, createTRPCContext } from "@klaro/api";
import { searchNearbySchema } from "@klaro/validators";

import { auth } from "~/auth/server";

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

const parseBoolean = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

export const parseNearbyInput = (
  fromQuery: Record<string, unknown>,
  body: Record<string, unknown>,
) =>
  searchNearbySchema.parse({
    latitude: Number(fromQuery.latitude ?? body.latitude),
    longitude: Number(fromQuery.longitude ?? body.longitude),
    radiusKm: Number(fromQuery.radiusKm ?? body.radiusKm ?? 10),
    limit: Number(fromQuery.limit ?? body.limit ?? 20),
    facilityType: (fromQuery.facilityType ?? body.facilityType) as
      | string
      | undefined,
    ownership: (fromQuery.ownership ?? body.ownership) as
      | "public"
      | "private"
      | undefined,
    philHealthOnly: parseBoolean(
      fromQuery.philHealthOnly ?? body.philHealthOnly,
    ),
    textSearch: (fromQuery.textSearch ?? body.textSearch) as string | undefined,
    specialty: (fromQuery.specialty ?? body.specialty) as string | undefined,
    emergencyOnly: parseBoolean(fromQuery.emergencyOnly ?? body.emergencyOnly),
  });

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

    const input = parseNearbyInput(fromQuery, body);

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

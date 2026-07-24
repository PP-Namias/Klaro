/* eslint-disable turbo/no-undeclared-env-vars, no-restricted-properties */

import type { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { db } from "@klaro/db";

import { assertSession } from "~/lib/session-validation";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  try {
    // require authentication
    const session = await assertSession();

    const doc = await db.query.document.findFirst({
      where: (document, { eq }) => eq(document.id, id),
    });

    if (!doc) {
      const res = new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
      setCorsHeaders(res);
      return res;
    }

    // verify ownership
    if (doc.userId !== session.userId) {
      const res = new Response(
        JSON.stringify({
          error: "Forbidden",
          details: "You do not have permission to access this document",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
      setCorsHeaders(res);
      return res;
    }

    const body = {
      id: doc.id,
      userId: doc.userId,
      fileName: doc.fileName,
      url: doc.storageUrl,
      mimeType: doc.mimeType,
      size: doc.fileSize,
      createdAt: doc.createdAt.toISOString(),
    };

    const res = new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    // Handle auth errors specifically
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      const res = new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
      setCorsHeaders(res);
      return res;
    }

    console.error("GET /api/uploads/:id error:", err);
    const res = new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
    setCorsHeaders(res);
    return res;
  }
};

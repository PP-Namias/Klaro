import type { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@klaro/db";
import { document as documentTable } from "@klaro/db/schema";
import { eq } from "drizzle-orm";

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
  { params }: { params: { id: string } }
) => {
  const { id } = params;

  try {
    const doc = await db.query.document.findFirst({
      where: eq(documentTable.id, id),
    });

    if (!doc) {
      const res = new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
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
    console.error("GET /api/uploads/:id error:", err);
    const res = new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  }
};

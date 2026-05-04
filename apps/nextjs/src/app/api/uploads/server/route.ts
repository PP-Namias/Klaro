import type { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@klaro/db";
import { document as documentTable } from "@klaro/db/schema";

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      const res = new Response(
        JSON.stringify({ error: "No file provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(res);
      return res;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const res = new Response(
        JSON.stringify({ error: "File size exceeds 50MB limit" }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(res);
      return res;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const res = new Response(
        JSON.stringify({
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF",
        }),
        {
          status: 415,
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(res);
      return res;
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "klaro/uploads",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    const cloudinaryUrl = (uploadResponse as any)?.secure_url;
    if (!cloudinaryUrl) {
      throw new Error("Failed to get Cloudinary URL");
    }

    // Save to DB
    const doc = await db
      .insert(documentTable)
      .values({
        userId: userId || "guest",
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageUrl: cloudinaryUrl,
        status: "uploaded",
      })
      .returning();

    const savedDoc = doc[0];
    const body = {
      id: savedDoc.id,
      userId: savedDoc.userId,
      fileName: savedDoc.fileName,
      url: savedDoc.storageUrl,
      mimeType: savedDoc.mimeType,
      size: savedDoc.fileSize,
      createdAt: savedDoc.createdAt.toISOString(),
    };

    const res = new Response(JSON.stringify(body), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    console.error("POST /api/uploads/server error:", err);
    const res = new Response(
      JSON.stringify({
        error: "Failed to upload file",
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

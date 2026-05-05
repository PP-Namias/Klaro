import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@klaro/db";
import { analysis, document as documentTable } from "@klaro/db/schema";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "~/lib/rate-limit";
import { assertSession } from "~/lib/session-validation";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const DIALECTS = ["Filipino", "Bisaya", "Ilocano"] as const;

/**
 * POST /api/documents/scan
 * 
 * Unified document scanning endpoint that accepts a file (image/PDF),
 * creates a document record, and triggers OCR processing.
 * 
 * Accepts: multipart/form-data with 'file' field
 * Returns: { id, analysisId, status, message }
 */
export async function POST(request: NextRequest) {
  try {
    const { allowed, remaining, resetAt } = checkRateLimit(
      `scan:${request.headers.get("x-forwarded-for") || "unknown"}`,
      RATE_LIMITS.uploads.server.maxRequests,
      RATE_LIMITS.uploads.server.windowMs,
    );

    if (!allowed) {
      return rateLimitResponse(remaining, resetAt);
    }

    // Validate auth
    const session = await assertSession();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' field in request" },
        { status: 400 }
      );
    }

    const dialectInput = formData.get("dialect");
    if (typeof dialectInput === "string" && dialectInput.length > 0) {
      if (!DIALECTS.includes(dialectInput as (typeof DIALECTS)[number])) {
        return NextResponse.json(
          { error: "Invalid dialect. Allowed: Filipino, Bisaya, Ilocano" },
          { status: 400 }
        );
      }
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "klaro/scan",
        },
        (error, result) => {
          if (error) {
            reject(new Error("Cloudinary upload failed"));
            return;
          }

          resolve(result);
        },
      );
      stream.end(buffer);
    });

    const cloudinaryUrl = (uploadResponse as { secure_url?: string })?.secure_url;
    if (!cloudinaryUrl) {
      throw new Error("Failed to get Cloudinary URL");
    }

    const [doc] = await db
      .insert(documentTable)
      .values({
        userId: session.userId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageUrl: cloudinaryUrl,
        status: "uploaded",
      })
      .returning();

    if (!doc) {
      throw new Error("Failed to create document record");
    }

    const [docAnalysis] = await db
      .insert(analysis)
      .values({
        documentId: doc.id,
        userId: session.userId,
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        id: doc.id,
        analysisId: docAnalysis?.id ?? null,
        status: "uploaded",
        message: "Document received. Processing will begin shortly.",
        fileName: doc.fileName,
        fileSize: doc.fileSize,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("POST /api/documents/scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/scan
 * Returns metadata about the scan endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/documents/scan",
    method: "POST",
    description: "Upload and scan medical documents (images/PDFs)",
    contentType: "multipart/form-data",
    fields: {
      file: {
        type: "file",
        required: true,
        description: "Medical document file (JPEG, PNG, WebP, PDF)",
        maxSize: "50MB",
      },
    },
    response: {
      id: "UUID of created document",
      analysisId: "UUID of created analysis record",
      status: "Document processing status",
      message: "Human-readable status message",
      fileName: "Original file name",
      fileSize: "File size in bytes",
    },
  });
}

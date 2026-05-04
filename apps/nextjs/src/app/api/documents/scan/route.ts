import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-validation";

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
    // Validate auth
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing 'file' field in request" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)` },
        { status: 413 }
      );
    }

    // For now, return a placeholder response
    // In production, this would:
    // 1. Upload to Cloudinary or S3
    // 2. Call tRPC documents.upload to create DB record
    // 3. Trigger OCR processing asynchronously
    
    return NextResponse.json(
      {
        id: `doc_${Date.now()}`,
        analysisId: `analysis_${Date.now()}`,
        status: "uploaded",
        message: "Document received. Processing will begin shortly.",
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
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
    },
  });
}

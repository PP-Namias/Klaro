/**
 * Unified document parser module
 * Routes files to appropriate parser based on MIME and magic bytes
 * Supports: PDF, DOCX, PPTX, images (PNG/JPG/etc)
 */

import { isPdf, convertPdfToImages } from "./pdfConversion";
import { isDocx, parseDocxToText } from "./docxParser";
import { isPptx, parsePptxToText } from "./pptxParser";

export type DocumentKind = "pdf" | "docx" | "pptx" | "image" | "unknown";

export interface UnifiedParseResult {
  kind: DocumentKind;
  success: boolean;
  text: string;
  confidence?: number;
  images?: { base64: string; pageNumber: number }[];
  error?: string;
  warnings: string[];
  sanitizedError?: string;
}

export function detectKind(buffer: Buffer, mimeType?: string): DocumentKind {
  if (mimeType) {
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "docx";
    if (mimeType.includes("presentationml") || mimeType.includes("ms-powerpoint")) return "pptx";
    if (mimeType.startsWith("image/")) return "image";
  }
  if (isPdf(buffer)) return "pdf";
  // DOCX/PPTX share ZIP header - distinguish via internal path hints
  const sample = buffer.subarray(0, 2000).toString("utf-8");
  if (isDocx(buffer) && sample.includes("word/")) return "docx";
  if (isPptx(buffer) && sample.includes("ppt/")) return "pptx";
  if (isDocx(buffer)) return "docx";
  if (isPptx(buffer)) return "pptx";
  // image magic
  if (buffer.length >= 8) {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
    if (isPng || isJpg || isGif) return "image";
  }
  return "unknown";
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  opts: { mimeType?: string; fileName?: string } = {},
): Promise<UnifiedParseResult> {
  const kind = detectKind(buffer, opts.mimeType);

  try {
    if (kind === "pdf") {
      const pdfRes = await convertPdfToImages(buffer);
      if (!pdfRes.success) {
        return {
          kind: "pdf",
          success: false,
          text: "",
          error: pdfRes.error,
          sanitizedError: sanitizePdfError(pdfRes.error),
          warnings: [pdfRes.error || "pdf_conversion_failed"],
        };
      }
      // For now return first page image base64; OCR will handle extraction
      const images = pdfRes.pages.map((p) => ({ base64: p.base64, pageNumber: p.pageNumber }));
      return {
        kind: "pdf",
        success: true,
        text: "",
        images,
        warnings: [],
      };
    }

    if (kind === "docx") {
      const res = await parseDocxToText(buffer);
      return {
        kind: "docx",
        success: res.success,
        text: res.text,
        error: res.error,
        sanitizedError: res.error ? "Word document could not be read. Please ensure the file is not corrupted." : undefined,
        warnings: res.warnings,
      };
    }

    if (kind === "pptx") {
      const res = await parsePptxToText(buffer);
      return {
        kind: "pptx",
        success: res.success,
        text: res.text,
        error: res.error,
        sanitizedError: res.error ? "PowerPoint file could not be read. Please ensure the file is not corrupted." : undefined,
        warnings: res.warnings,
      };
    }

    if (kind === "image") {
      return {
        kind: "image",
        success: true,
        text: "",
        warnings: [],
      };
    }

    return {
      kind: "unknown",
      success: false,
      text: "",
      error: "Unsupported file format",
      sanitizedError: "This file type is not supported. Please upload PDF, DOCX, PPTX, or image files.",
      warnings: ["unknown-format"],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown parse error";
    return {
      kind,
      success: false,
      text: "",
      error: msg,
      sanitizedError: "File could not be processed. Please try again with a valid file.",
      warnings: [`parser-crash:${msg.slice(0, 40)}`],
    };
  }
}

function sanitizePdfError(raw?: string): string {
  if (!raw) return "PDF could not be processed.";
  if (raw.toLowerCase().includes("password") || raw.toLowerCase().includes("encrypted")) {
    return "This PDF is password-protected or encrypted and cannot be processed. Please provide an unprotected file.";
  }
  if (raw.toLowerCase().includes("canvas module not available")) {
    return "PDF preview is temporarily unavailable. Your file is queued for processing.";
  }
  if (raw.includes("Invalid PDF") || raw.includes("corrupt")) {
    return "This PDF appears corrupted or invalid. Please try re-exporting the file.";
  }
  return "PDF could not be processed. Please ensure it is a valid file.";
}

export function getSupportedFormats(): string[] {
  return ["pdf", "docx", "pptx", "png", "jpeg", "jpg", "webp", "tiff", "bmp", "gif"];
}

export function isSupported(mimeType: string): boolean {
  const supported = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
    "image/bmp",
    "image/gif",
  ];
  return supported.includes(mimeType.toLowerCase());
}

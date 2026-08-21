/**
 * File validation service - defensive handling for encrypted, corrupt, and malicious files
 * Sanitizes errors, never crashes Node process, supports cancellation and retry
 */

import { detectKind } from "./documentParsers";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MIN_FILE_SIZE = 100;
export const MAX_PDF_PAGES = 10;

export type ValidationKind = "pdf" | "docx" | "pptx" | "image" | "unknown";

export interface FileValidationResult {
  valid: boolean;
  kind: ValidationKind;
  sanitizedError?: string;
  rawError?: string;
  pageCount?: number;
  fileName?: string;
  size: number;
}

export interface ValidationOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export function isEncryptedPdf(buffer: Buffer): boolean {
  try {
    const sample = buffer.subarray(0, 4000).toString("utf-8");
    // PDFs with encryption contain /Encrypt dict
    return sample.includes("/Encrypt");
  } catch {
    return false;
  }
}

export function isLikelyCorruptPdf(buffer: Buffer): boolean {
  if (buffer.length < 10) return true;
  const header = buffer.subarray(0, 5).toString("ascii");
  if (header !== "%PDF-") return true;
  const tail = buffer.subarray(Math.max(0, buffer.length - 1024)).toString("utf-8");
  // Valid PDFs end with %%EOF
  if (!tail.includes("%%EOF") && buffer.length > 500) return true;
  return false;
}

export function sanitizeValidationError(kind: ValidationKind, raw?: string): string {
  if (!raw) return "File could not be validated.";
  const lower = raw.toLowerCase();
  if (lower.includes("password") || lower.includes("encrypted") || lower.includes("encrypt")) {
    return "This file is password-protected or encrypted and cannot be processed. Please provide an unprotected file.";
  }
  if (lower.includes("corrupt") || lower.includes("invalid") || lower.includes("unexpected")) {
    return "This file appears corrupted or invalid. Please try re-exporting the original document.";
  }
  if (lower.includes("too small") || lower.includes("empty")) {
    return "File appears empty or incomplete. Please ensure the full document was uploaded.";
  }
  if (lower.includes("too large") || lower.includes("50 mb")) {
    return "File exceeds the 50 MB limit. Please upload a smaller file.";
  }
  if (kind === "unknown") return "Unsupported file format. Please upload PDF, DOCX, PPTX, or image files.";
  return "File could not be processed. Please ensure it is a valid document and try again.";
}

export async function validateFileBuffer(
  buffer: Buffer,
  mimeType?: string,
  fileName?: string,
  opts: ValidationOptions = {},
): Promise<FileValidationResult> {
  const size = buffer.length;
  const kind = detectKind(buffer, mimeType) as ValidationKind;

  // Abort check
  if (opts.signal?.aborted) {
    return { valid: false, kind, size, fileName, sanitizedError: "Upload was cancelled.", rawError: "aborted" };
  }

  // Size checks
  if (size < MIN_FILE_SIZE) {
    return {
      valid: false,
      kind,
      size,
      fileName,
      sanitizedError: `"${fileName ?? "File"}" appears empty or too small. Please upload a complete medical document.`,
      rawError: "too small",
    };
  }
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      kind,
      size,
      fileName,
      sanitizedError: `"${fileName ?? "File"}" exceeds the 50 MB limit. Please upload a smaller file.`,
      rawError: "too large",
    };
  }

  // Kind unknown
  if (kind === "unknown") {
    return {
      valid: false,
      kind,
      size,
      fileName,
      sanitizedError: "Unsupported file type. Please upload PDF, DOCX, PPTX, or image (PNG/JPG/etc).",
      rawError: "unknown kind",
    };
  }

  // PDF-specific checks: encryption & corruption
  if (kind === "pdf") {
    if (isEncryptedPdf(buffer)) {
      return {
        valid: false,
        kind,
        size,
        fileName,
        sanitizedError: "This PDF is password-protected or encrypted and cannot be processed. Please provide an unprotected file.",
        rawError: "encrypted pdf detected preflight",
      };
    }
    // Corruption is a warning not hard fail; let pdfConversion handle further but pre-warn
    if (isLikelyCorruptPdf(buffer) && size > 500) {
      // Still allow attempt but flag
      return {
        valid: true,
        kind,
        size,
        fileName,
        sanitizedError: undefined,
        rawError: "possible corrupt but attempting",
      };
    }
  }

  // Generic magic byte validation
  if (kind === "image") {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isGif = buffer[0] === 0x47 && buffer[1] === 0x49;
    const isWebp = buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
    const isTiff = (buffer[0] === 0x49 && buffer[1] === 0x49) || (buffer[0] === 0x4d && buffer[1] === 0x4d);
    const headerOk = isPng || isJpg || isGif || isWebp || isTiff;
    if (!headerOk && size > 200) {
      return {
        valid: false,
        kind,
        size,
        fileName,
        sanitizedError: "Image file appears corrupted or has an invalid header. Please try re-exporting.",
        rawError: "invalid image header",
      };
    }
  }

  return { valid: true, kind, size, fileName };
}

export function createFileCancellationToken(): {
  controller: AbortController;
  signal: AbortSignal;
  abort: (reason?: string) => void;
} {
  const controller = new AbortController();
  return {
    controller,
    signal: controller.signal,
    abort: (reason?: string) => controller.abort(reason ?? "user_cancelled"),
  };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 2;
  const baseDelay = opts.baseDelayMs ?? 500;
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (opts.signal?.aborted) throw new Error("Operation cancelled");
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      // Don't retry on encryption/password errors
      if (msg.includes("password") || msg.includes("encrypted")) throw err;
      if (attempt === maxRetries) break;
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

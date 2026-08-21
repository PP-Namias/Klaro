import { eq } from "drizzle-orm";

import { document } from "@klaro/db/schema";

export type UploadStage =
  | "idle"
  | "uploading"
  | "validating"
  | "processing"
  | "ocr"
  | "extraction"
  | "complete"
  | "error";

export interface UploadProgress {
  documentId: string;
  stage: UploadStage;
  progress: number;
  message?: string;
  error?: string;
  startedAt: Date;
  updatedAt: Date;
}

const progressMap = new Map<string, UploadProgress>();
const abortMap = new Map<string, AbortController>();
const retryMap = new Map<string, number>();

function createProgress(documentId: string): UploadProgress {
  return {
    documentId,
    stage: "idle",
    progress: 0,
    startedAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getAbortController(documentId: string): AbortController {
  let ctrl = abortMap.get(documentId);
  if (!ctrl) {
    ctrl = new AbortController();
    abortMap.set(documentId, ctrl);
  }
  return ctrl;
}

export function cancelUploadProgress(documentId: string, reason = "User cancelled upload"): UploadProgress | null {
  const ctrl = abortMap.get(documentId);
  if (ctrl && !ctrl.signal.aborted) ctrl.abort(reason);
  const prog = progressMap.get(documentId);
  if (!prog) return null;
  prog.stage = "error";
  prog.error = "Upload cancelled by user. Please try again if needed.";
  prog.updatedAt = new Date();
  progressMap.set(documentId, prog);
  return prog;
}

export function getRetryCount(documentId: string): number {
  return retryMap.get(documentId) ?? 0;
}

export function incrementRetry(documentId: string): number {
  const cur = (retryMap.get(documentId) ?? 0) + 1;
  retryMap.set(documentId, cur);
  return cur;
}

export function resetRetry(documentId: string): void {
  retryMap.delete(documentId);
}

export function isCancelled(documentId: string): boolean {
  return abortMap.get(documentId)?.signal.aborted ?? false;
}

export function initUploadProgress(documentId: string): UploadProgress {
  const existing = progressMap.get(documentId);
  if (existing) return existing;

  const progress = createProgress(documentId);
  progressMap.set(documentId, progress);
  return progress;
}

export function updateUploadProgress(
  documentId: string,
  update: Partial<
    Pick<UploadProgress, "stage" | "progress" | "message" | "error">
  >,
): UploadProgress {
  let progress = progressMap.get(documentId);
  if (!progress) {
    progress = createProgress(documentId);
    progressMap.set(documentId, progress);
  }

  if (update.stage !== undefined) progress.stage = update.stage;
  if (update.progress !== undefined) progress.progress = update.progress;
  if (update.message !== undefined) progress.message = update.message;
  if (update.error !== undefined) progress.error = update.error;
  progress.updatedAt = new Date();

  progressMap.set(documentId, progress);
  return progress;
}

export function getUploadProgress(documentId: string): UploadProgress | null {
  return progressMap.get(documentId) || null;
}

export function completeUploadProgress(
  documentId: string,
): UploadProgress | null {
  const progress = progressMap.get(documentId);
  if (!progress) return null;

  progress.stage = "complete";
  progress.progress = 100;
  progress.updatedAt = new Date();
  progressMap.set(documentId, progress);

  setTimeout(() => progressMap.delete(documentId), 60_000);
  return progress;
}

export function errorUploadProgress(
  documentId: string,
  error: string,
): UploadProgress | null {
  const progress = progressMap.get(documentId);
  if (!progress) return null;

  progress.stage = "error";
  progress.error = error;
  progress.updatedAt = new Date();
  progressMap.set(documentId, progress);
  return progress;
}

export function removeUploadProgress(documentId: string): boolean {
  abortMap.delete(documentId);
  retryMap.delete(documentId);
  return progressMap.delete(documentId);
}

export function clearAllProgress(): void {
  progressMap.clear();
  abortMap.clear();
  retryMap.clear();
}

export function sanitizeProgressError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("password") || lower.includes("encrypted")) {
    return "This file is password-protected or encrypted and cannot be processed.";
  }
  if (lower.includes("corrupt") || lower.includes("invalid pdf") || lower.includes("unexpected")) {
    return "This file appears corrupted or invalid. Please try re-exporting.";
  }
  if (lower.includes("cancelled") || lower.includes("abort")) {
    return "Upload was cancelled.";
  }
  if (lower.includes("timeout")) {
    return "Processing timed out. Please try again with a smaller or clearer file.";
  }
  return "File could not be processed. Please try again with a valid document.";
}

export async function getUploadProgressFromDb(
  db: any,
  documentId: string,
): Promise<UploadProgress | null> {
  const [doc] = await db
    .select({
      id: document.id,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })
    .from(document)
    .where(eq(document.id, documentId))
    .limit(1);

  if (!doc) return null;

  const stageMap: Record<string, UploadStage> = {
    uploaded: "validating",
    processing: "processing",
    ocr: "ocr",
    analyzed: "complete",
    failed: "error",
  };

  return {
    documentId: doc.id,
    stage: stageMap[doc.status] || "idle",
    progress: doc.status === "analyzed" ? 100 : 50,
    startedAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

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

function createProgress(documentId: string): UploadProgress {
  return {
    documentId,
    stage: "idle",
    progress: 0,
    startedAt: new Date(),
    updatedAt: new Date(),
  };
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
  return progressMap.delete(documentId);
}

export function clearAllProgress(): void {
  progressMap.clear();
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

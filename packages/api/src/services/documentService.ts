import { count, desc, eq, sql } from "drizzle-orm";

import { document } from "@klaro/db/schema";

export interface CreateDocumentInput {
  userId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storageUrl?: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  storageUrl: string | null;
  status: string;
  ocrText: string | null;
  confidence: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentStats {
  total: number;
  uploaded: number;
  processing: number;
  analyzed: number;
  failed: number;
}

export async function createDocument(
  db: any,
  input: CreateDocumentInput,
): Promise<DocumentRecord> {
  const [doc] = await db
    .insert(document)
    .values({
      userId: input.userId,
      fileName: input.fileName,
      mimeType: input.mimeType || null,
      fileSize: input.fileSize || null,
      storageUrl: input.storageUrl || null,
      status: "uploaded",
    })
    .returning();

  return doc as DocumentRecord;
}

export async function getDocumentById(
  db: any,
  id: string,
): Promise<DocumentRecord | null> {
  const [doc] = await db
    .select()
    .from(document)
    .where(eq(document.id, id))
    .limit(1);

  return (doc as DocumentRecord) || null;
}

export async function getDocumentsByUserId(
  db: any,
  userId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<DocumentRecord[]> {
  const { limit = 10, offset = 0 } = options;

  const docs = await db
    .select()
    .from(document)
    .where(eq(document.userId, userId))
    .orderBy(desc(document.createdAt))
    .limit(limit)
    .offset(offset);

  return docs as DocumentRecord[];
}

export async function updateDocumentStatus(
  db: any,
  id: string,
  status: string,
  additionalFields?: { ocrText?: string; confidence?: number },
): Promise<DocumentRecord | null> {
  const updateData: any = { status, updatedAt: new Date() };

  if (additionalFields?.ocrText !== undefined) {
    updateData.ocrText = additionalFields.ocrText;
  }
  if (additionalFields?.confidence !== undefined) {
    updateData.confidence = additionalFields.confidence;
  }

  const [updated] = await db
    .update(document)
    .set(updateData)
    .where(eq(document.id, id))
    .returning();

  return (updated as DocumentRecord) || null;
}

export async function deleteDocument(db: any, id: string): Promise<boolean> {
  const result = await db.delete(document).where(eq(document.id, id));

  return result.rowCount > 0;
}

export async function getDocumentStats(
  db: any,
  userId: string,
): Promise<DocumentStats> {
  const [stats] = await db
    .select({
      total: count(),
    })
    .from(document)
    .where(eq(document.userId, userId));

  const [statusCounts] = await db
    .select({
      uploaded: sql<number>`count(*) filter (where ${document.status} = 'uploaded')`,
      processing: sql<number>`count(*) filter (where ${document.status} = 'processing')`,
      analyzed: sql<number>`count(*) filter (where ${document.status} = 'analyzed')`,
      failed: sql<number>`count(*) filter (where ${document.status} = 'failed')`,
    })
    .from(document)
    .where(eq(document.userId, userId));

  return {
    total: stats?.total || 0,
    uploaded: statusCounts?.uploaded || 0,
    processing: statusCounts?.processing || 0,
    analyzed: statusCounts?.analyzed || 0,
    failed: statusCounts?.failed || 0,
  };
}

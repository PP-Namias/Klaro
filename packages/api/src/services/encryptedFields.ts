/**
 * Encrypted Fields Middleware
 *
 * Integrates encryption/decryption into database operations.
 * Provides helper functions for secure data access patterns.
 */

import { eq } from "drizzle-orm";

import { db } from "@klaro/db/client";
import { analysis, chatMessage, document } from "@klaro/db/schema";

import {
  decryptAnalysisFields,
  decryptChatMessage,
  decryptDocumentFields,
  encryptAnalysisFields,
  encryptChatMessage,
  encryptDocumentFields,
} from "./encryption";

// ============================================================================
// Document Operations
// ============================================================================

/**
 * Insert document with encrypted fields
 */
export async function insertEncryptedDocument(data: {
  userId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storageUrl?: string;
  ocrText?: string | null;
  confidence?: string;
}) {
  const encryptedFields = await encryptDocumentFields({
    ocrText: data.ocrText,
  });

  return db
    .insert(document)
    .values({
      userId: data.userId,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      storageUrl: data.storageUrl,
      ocrText: encryptedFields.ocrText,
      confidence: data.confidence,
      status: "uploaded",
    })
    .returning();
}

/**
 * Get document with decrypted fields
 */
export async function getDecryptedDocument(docId: string) {
  const [doc] = await db.select().from(document).where(eq(document.id, docId));

  if (!doc) return null;

  const decryptedFields = await decryptDocumentFields({
    ocrText: doc.ocrText,
  });

  return {
    ...doc,
    ocrText: decryptedFields.ocrText,
  };
}

/**
 * Update document OCR text with encryption
 */
export async function updateDocumentOcr(
  docId: string,
  ocrText: string,
  confidence?: number,
) {
  const encryptedFields = await encryptDocumentFields({ ocrText });

  return db
    .update(document)
    .set({
      ocrText: encryptedFields.ocrText,
      confidence: confidence?.toFixed(2),
      status: "processing",
      updatedAt: new Date(),
    })
    .where(eq(document.id, docId))
    .returning();
}

// ============================================================================
// Analysis Operations
// ============================================================================

/**
 * Insert analysis with encrypted fields
 */
export async function insertEncryptedAnalysis(data: {
  documentId: string;
  userId: string;
  extractedFields?: Record<string, unknown> | null;
  flaggedValues?: unknown[] | null;
  plainLanguageSummary?: string | null;
  tanqmoCard?: Record<string, unknown> | null;
}) {
  const encryptedFields = await encryptAnalysisFields({
    extractedFields: data.extractedFields,
    plainLanguageSummary: data.plainLanguageSummary,
    tanqmoCard: data.tanqmoCard,
  });

  return db
    .insert(analysis)
    .values({
      documentId: data.documentId,
      userId: data.userId,
      extractedFields: encryptedFields.extractedFields as any,
      flaggedValues: data.flaggedValues as any,
      plainLanguageSummary: encryptedFields.plainLanguageSummary,
      tanqmoCard: encryptedFields.tanqmoCard as any,
      status: "pending",
    })
    .returning();
}

/**
 * Get analysis with decrypted fields
 */
export async function getDecryptedAnalysis(analysisId: string) {
  const [anal] = await db
    .select()
    .from(analysis)
    .where(eq(analysis.id, analysisId));

  if (!anal) return null;

  return decryptAnalysisFields(anal);
}

/**
 * Get analysis by document ID with decrypted fields
 */
export async function getDecryptedAnalysisByDocument(docId: string) {
  const [anal] = await db
    .select()
    .from(analysis)
    .where(eq(analysis.documentId, docId));

  if (!anal) return null;

  return decryptAnalysisFields(anal);
}

/**
 * Update analysis with encrypted fields
 */
export async function updateEncryptedAnalysis(
  analysisId: string,
  data: {
    extractedFields?: Record<string, unknown> | null;
    plainLanguageSummary?: string | null;
    tanqmoCard?: Record<string, unknown> | null;
    status?: string;
    errorMessage?: string | null;
  },
) {
  const encryptedFields = await encryptAnalysisFields({
    extractedFields: data.extractedFields,
    plainLanguageSummary: data.plainLanguageSummary,
    tanqmoCard: data.tanqmoCard,
  });

  return db
    .update(analysis)
    .set({
      extractedFields: encryptedFields.extractedFields as any,
      plainLanguageSummary: encryptedFields.plainLanguageSummary,
      tanqmoCard: encryptedFields.tanqmoCard as any,
      status: (data.status as any) || undefined,
      errorMessage: data.errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(analysis.id, analysisId))
    .returning();
}

// ============================================================================
// Chat Message Operations
// ============================================================================

/**
 * Insert chat message with encrypted content
 */
export async function insertEncryptedChatMessage(data: {
  analysisId: string;
  userId: string;
  role: string;
  content: string;
  dialect?: string;
}) {
  const encryptedContent = await encryptChatMessage(data.content);

  return db
    .insert(chatMessage)
    .values({
      analysisId: data.analysisId,
      userId: data.userId,
      role: data.role,
      content: encryptedContent,
      dialect: data.dialect,
    })
    .returning();
}

/**
 * Get chat messages with decrypted content
 */
export async function getDecryptedChatMessages(
  analysisId: string,
  limit = 50,
) {
  const messages = await db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.analysisId, analysisId))
    .orderBy(chatMessage.createdAt)
    .limit(limit);

  const decryptedMessages = await Promise.all(
    messages.map(async (msg) => ({
      ...msg,
      content: await decryptChatMessage(msg.content),
    })),
  );

  return decryptedMessages;
}

/**
 * Update chat message content with encryption
 */
export async function updateChatMessageContent(
  messageId: string,
  content: string,
) {
  const encryptedContent = await encryptChatMessage(content);

  return db
    .update(chatMessage)
    .set({ content: encryptedContent })
    .where(eq(chatMessage.id, messageId))
    .returning();
}

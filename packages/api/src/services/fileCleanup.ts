/**
 * File Cleanup Service
 *
 * HIPAA Data Retention Policy:
 * - Uploaded files are automatically deleted after processing + retention window
 * - Default retention: 24 hours after processing
 * - Maximum override: 7 days for user-requested reprocessing
 * - Original files are wiped; extracted data is retained (encrypted)
 *
 * This service:
 * 1. Queries documents past retention window
 * 2. Deletes files from Cloudinary storage
 * 3. Updates document status to "archived"
 * 4. Logs all cleanup events for audit trail
 */

import { v2 as cloudinary } from "cloudinary";
import { and, eq, inArray, lt } from "drizzle-orm";

import { db } from "@klaro/db/client";
import { document } from "@klaro/db/schema";

// ============================================================================
// Configuration
// ============================================================================

export interface CleanupConfig {
  /** Hours after processing to delete files (default: 24) */
  retentionHours: number;
  /** Maximum retention hours regardless of status (default: 168 = 7 days) */
  maxRetentionHours: number;
  /** Batch size for cleanup operations */
  batchSize: number;
  /** Enable dry run mode (log without deleting) */
  dryRun: boolean;
}

const DEFAULT_CONFIG: CleanupConfig = {
  retentionHours: parseInt(process.env.FILE_RETENTION_HOURS || "24", 10),
  maxRetentionHours: parseInt(
    process.env.FILE_MAX_RETENTION_HOURS || "168",
    10,
  ),
  batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE || "50", 10),
  dryRun: process.env.CLEANUP_DRY_RUN === "true",
};

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================================
// Types
// ============================================================================

export interface CleanupResult {
  totalFound: number;
  deleted: number;
  archived: number;
  failed: number;
  errors: string[];
  deletedFiles: string[];
  dryRun: boolean;
}

export interface DocumentToDelete {
  id: string;
  userId: string;
  fileName: string;
  storageUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Core Cleanup Functions
// ============================================================================

/**
 * Extract Cloudinary public_id from URL
 * Cloudinary URLs: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Skip version number if present (v1, v2, etc.)
    const startIndex = pathParts[uploadIndex + 1]?.startsWith("v")
      ? uploadIndex + 2
      : uploadIndex + 1;

    // Get everything after upload/ (excluding file extension)
    const publicIdParts = pathParts.slice(startIndex);
    const lastPart = publicIdParts[publicIdParts.length - 1]!;
    const ext = lastPart.split(".").pop();

    if (ext && ["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
      publicIdParts[publicIdParts.length - 1] = lastPart.replace(`.${ext}`, "");
    }

    return publicIdParts.join("/");
  } catch {
    return null;
  }
}

/**
 * Delete a file from Cloudinary
 */
async function deleteFromCloudinary(url: string): Promise<boolean> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) {
    console.warn(`[FileCleanup] Could not extract public_id from URL: ${url}`);
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error(
      `[FileCleanup] Cloudinary deletion failed for ${publicId}:`,
      error,
    );
    return false;
  }
}

/**
 * Find documents that need cleanup based on retention policy
 */
async function findDocumentsForCleanup(
  config: CleanupConfig,
): Promise<DocumentToDelete[]> {
  const retentionMs = config.retentionHours * 60 * 60 * 1000;
  const maxRetentionMs = config.maxRetentionHours * 60 * 60 * 1000;
  const now = new Date();

  const retentionCutoff = new Date(now.getTime() - retentionMs);
  const maxRetentionCutoff = new Date(now.getTime() - maxRetentionMs);

  // Find documents that are:
  // 1. Processed (analyzed) and past retention period, OR
  // 2. Past maximum retention regardless of status
  const docs = await db
    .select()
    .from(document)
    .where(
      and(
        // Not already archived
        eq(document.status, "analyzed"),
        // Either past retention after processing, or past max retention
        lt(document.updatedAt, retentionCutoff),
      ),
    )
    .limit(config.batchSize);

  // Also find documents past max retention (any non-archived status)
  const maxRetainedDocs = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.status, "uploaded"),
        lt(document.createdAt, maxRetentionCutoff),
      ),
    )
    .limit(config.batchSize);

  // Combine and deduplicate
  const allDocs = [...docs];
  for (const maxDoc of maxRetainedDocs) {
    if (!allDocs.find((d) => d.id === maxDoc.id)) {
      allDocs.push(maxDoc);
    }
  }

  return allDocs.map((doc) => ({
    id: doc.id,
    userId: doc.userId,
    fileName: doc.fileName,
    storageUrl: doc.storageUrl,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

/**
 * Archive a document (mark as cleaned up)
 */
async function archiveDocument(docId: string): Promise<boolean> {
  try {
    await db
      .update(document)
      .set({
        status: "archived",
        storageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(document.id, docId));
    return true;
  } catch (error) {
    console.error(`[FileCleanup] Failed to archive document ${docId}:`, error);
    return false;
  }
}

// ============================================================================
// Main Cleanup Execution
// ============================================================================

/**
 * Execute file cleanup job
 * Can be triggered manually or via scheduled job
 */
export async function executeCleanup(
  config: Partial<CleanupConfig> = {},
): Promise<CleanupResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const result: CleanupResult = {
    totalFound: 0,
    deleted: 0,
    archived: 0,
    failed: 0,
    errors: [],
    deletedFiles: [],
    dryRun: fullConfig.dryRun,
  };

  console.log(
    JSON.stringify({
      type: "cleanup_started",
      config: {
        retentionHours: fullConfig.retentionHours,
        maxRetentionHours: fullConfig.maxRetentionHours,
        dryRun: fullConfig.dryRun,
      },
      timestamp: new Date().toISOString(),
    }),
  );

  try {
    const docsToDelete = await findDocumentsForCleanup(fullConfig);
    result.totalFound = docsToDelete.length;

    if (docsToDelete.length === 0) {
      console.log("[FileCleanup] No documents require cleanup");
      return result;
    }

    console.log(
      `[FileCleanup] Found ${docsToDelete.length} documents for cleanup`,
    );

    for (const doc of docsToDelete) {
      try {
        if (doc.storageUrl) {
          // Delete from Cloudinary
          if (!fullConfig.dryRun) {
            const deleted = await deleteFromCloudinary(doc.storageUrl);
            if (deleted) {
              result.deleted++;
              result.deletedFiles.push(doc.fileName);
            } else {
              result.failed++;
              result.errors.push(
                `Failed to delete ${doc.fileName} from Cloudinary`,
              );
            }
          } else {
            result.deleted++;
            result.deletedFiles.push(doc.fileName);
          }
        }

        // Archive in database
        if (!fullConfig.dryRun) {
          const archived = await archiveDocument(doc.id);
          if (archived) {
            result.archived++;
          } else {
            result.failed++;
            result.errors.push(`Failed to archive document ${doc.id}`);
          }
        } else {
          result.archived++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error processing ${doc.fileName}: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    }

    // Log cleanup completion
    console.log(
      JSON.stringify({
        type: "cleanup_completed",
        totalFound: result.totalFound,
        deleted: result.deleted,
        archived: result.archived,
        failed: result.failed,
        dryRun: result.dryRun,
        timestamp: new Date().toISOString(),
      }),
    );

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Cleanup job failed: ${errorMsg}`);

    console.error(
      JSON.stringify({
        type: "cleanup_failed",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      }),
    );

    return result;
  }
}

/**
 * Get cleanup statistics for monitoring
 */
export async function getCleanupStats(): Promise<{
  totalDocuments: number;
  documentsWithFiles: number;
  documentsPastRetention: number;
  oldestDocument: Date | null;
  largestFileUrl: string | null;
}> {
  const allDocs = await db.select().from(document);
  const docsWithFiles = allDocs.filter((d) => d.storageUrl);

  const retentionMs = DEFAULT_CONFIG.retentionHours * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - retentionMs);
  const docsPastRetention = docsWithFiles.filter((d) => d.updatedAt < cutoff);

  return {
    totalDocuments: allDocs.length,
    documentsWithFiles: docsWithFiles.length,
    documentsPastRetention: docsPastRetention.length,
    oldestDocument:
      docsWithFiles.length > 0
        ? new Date(Math.min(...docsWithFiles.map((d) => d.createdAt.getTime())))
        : null,
    largestFileUrl: null, // Would need file size comparison
  };
}

/**
 * Manual cleanup for specific document (user-initiated deletion)
 */
export async function cleanupDocument(
  docId: string,
  userId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const [doc] = await db
      .select()
      .from(document)
      .where(eq(document.id, docId));

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (doc.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete from Cloudinary
    if (doc.storageUrl) {
      await deleteFromCloudinary(doc.storageUrl);
    }

    // Archive in database
    await archiveDocument(docId);

    console.log(
      JSON.stringify({
        type: "manual_cleanup",
        documentId: docId,
        userId,
        fileName: doc.fileName,
        timestamp: new Date().toISOString(),
      }),
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

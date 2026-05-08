import { z } from "zod/v4";

// Document upload request schema
export const uploadDocumentInputSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-+.]+$/), // e.g., application/pdf, image/png
  fileSize: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024), // max 50MB
});

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

declare const File: any;
// Type guard for File - works in both browser and server environments
interface FileLike {
  size: number;
  type: string;
}

const hasFileConstructor = typeof globalThis.File !== "undefined";

const fileSchema = (
  hasFileConstructor
    ? z.instanceof(globalThis.File)
    : z.custom<FileLike>((value): value is FileLike => {
        if (
          value === null ||
          value === undefined ||
          typeof value !== "object"
        ) {
          return false;
        }
        return "size" in value && "type" in value;
      })
)
  .refine((file) => file.size <= MAX_FILE_SIZE, "File must be under 50MB")
  .refine(
    (file) =>
      ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number],
      ),
    "File must be JPEG, PNG, WebP, or PDF",
  );

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

// Document response schema
export const documentStatusEnum = z.enum([
  "uploaded",
  "processing",
  "analyzed",
  "failed",
]);

export const documentSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  fileName: z.string(),
  mimeType: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  storageUrl: z.url().nullable(),
  status: documentStatusEnum,
  ocrText: z.string().nullable(),
  confidence: z.number().min(0).max(100).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Document = z.infer<typeof documentSchema>;

// Presigned URL response for S3/storage upload
export const uploadResponseSchema = z.object({
  documentId: z.uuid(),
  uploadUrl: z.url(),
  fileName: z.string(),
  expiresIn: z.number().int().positive(), // seconds
});

export const uploadDocumentSchema = z.object({
  file: fileSchema,
  dialect: z.enum(["Filipino", "Bisaya", "Ilocano"]).default("Filipino"),
});

export const uploadDocumentResponseSchema = z.object({
  id: z.uuid(),
  analysisId: z.uuid(),
  status: z.enum(["uploaded", "processing"]),
  message: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
export type UploadDocumentRequest = z.infer<typeof uploadDocumentSchema>;
export type UploadDocumentResponse = z.infer<
  typeof uploadDocumentResponseSchema
>;

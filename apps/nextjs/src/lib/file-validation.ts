/* eslint-disable @typescript-eslint/prefer-regexp-exec, @typescript-eslint/no-non-null-assertion, @typescript-eslint/prefer-nullish-coalescing */

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "image/tiff",
  "image/bmp",
  "image/gif",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_PDF_PAGES = 10;
const MIN_FILE_SIZE = 100;

interface FileValidationResult {
  valid: boolean;
  error?: string;
  kind: "image" | "pdf";
  pageCount?: number;
}

async function countPdfPages(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("utf-8").decode(bytes);

  const typeIdx = text.lastIndexOf("/Type");
  if (typeIdx === -1) return 1;

  const pagesMatch = text.match(/\/Type\s*\/Pages[^/]*\/Count\s+(\d+)/);
  if (pagesMatch) {
    return parseInt(pagesMatch[1] ?? "1", 10);
  }

  const pageMatch = text.match(/\/Type\s*\/Page\b[^/]/g);
  if (pageMatch) {
    return pageMatch.length;
  }

  return 1;
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `"${file.name}" type is not supported. Please use a medical document in PNG, JPG, WebP, or PDF format.`,
      kind: "image",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" is ${formatBytes(file.size)} — exceeds the 50 MB limit. Please upload a smaller file.`,
      kind: file.type === "application/pdf" ? "pdf" : "image",
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" appears empty or too small. Please upload a complete medical document.`,
      kind: file.type === "application/pdf" ? "pdf" : "image",
    };
  }

  const kind = file.type === "application/pdf" ? "pdf" : "image";
  let pageCount: number | undefined;

  if (file.type === "application/pdf") {
    try {
      pageCount = await countPdfPages(file);
      if (pageCount > MAX_PDF_PAGES) {
        return {
          valid: false,
          error: `"${file.name}" has ${pageCount} pages. For best results, please upload 10 pages or fewer.`,
          kind: "pdf",
          pageCount,
        };
      }
    } catch {
      return {
        valid: false,
        error: `"${file.name}" could not be read. Please upload a valid PDF medical document.`,
        kind: "pdf",
      };
    }
  }

  return { valid: true, kind, pageCount };
}

export async function validateFiles(files: File[]): Promise<{
  valid: File[];
  invalid: { file: File; error: string }[];
}> {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of files) {
    const result = await validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error! });
    }
  }

  return { valid, invalid };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getFileKind(file: File): "image" | "pdf" {
  return file.type === "application/pdf" ? "pdf" : "image";
}

export function createPreviewUrl(file: File): string | undefined {
  if (file.type.startsWith("image/")) {
    return URL.createObjectURL(file);
  }
  return undefined;
}

export async function getFileMetadata(file: File): Promise<{
  kind: "image" | "pdf";
  pageCount?: number;
  sizeFormatted: string;
}> {
  const kind = getFileKind(file);
  let pageCount: number | undefined;

  if (file.type === "application/pdf") {
    try {
      pageCount = await countPdfPages(file);
    } catch {
      pageCount = undefined;
    }
  }

  return { kind, pageCount, sizeFormatted: formatBytes(file.size) };
}

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
  /** Undefined when the count could not be determined. */
  pageCount?: number;
  /** True when the page count could not be read (compressed cross-reference). */
  pageCountIndeterminate?: boolean;
}

/** How much of a PDF to scan for a page count, from each end. */
const PDF_SCAN_WINDOW_BYTES = 512 * 1024;

/**
 * Best-effort page count for a PDF.
 *
 * Returns `null` when the count cannot be determined - most commonly a
 * cross-reference stream (object streams), where the page tree is compressed
 * and invisible to a byte scan. This previously returned a hardcoded 1, which
 * silently waved such files past the MAX_PDF_PAGES cap.
 *
 * Only the head and tail are decoded: decoding a 50MB document whole would
 * block the main thread. Latin1 keeps byte offsets intact for the scan.
 */
async function countPdfPages(file: File): Promise<number | null> {
  const decoder = new TextDecoder("latin1");

  // A file that fits inside one window is scanned once. Concatenating head and
  // tail for such a file would scan the same bytes twice and double any
  // occurrence-based page count.
  let text: string;
  if (file.size <= PDF_SCAN_WINDOW_BYTES) {
    text = decoder.decode(new Uint8Array(await file.arrayBuffer()));
  } else {
    const head = new Uint8Array(
      await file.slice(0, PDF_SCAN_WINDOW_BYTES).arrayBuffer(),
    );
    const tail = new Uint8Array(
      await file.slice(file.size - PDF_SCAN_WINDOW_BYTES).arrayBuffer(),
    );
    text = decoder.decode(head) + "\n" + decoder.decode(tail);
  }

  // Allow intervening keys (/Kids, /MediaBox, ...) between /Pages and /Count,
  // but stay inside one object: `[^/]*` never matched a real page tree.
  const pagesMatch = /\/Type\s*\/Pages[\s\S]{0,400}?\/Count\s+(\d+)/.exec(text);
  if (pagesMatch?.[1]) {
    return parseInt(pagesMatch[1], 10);
  }

  const pageMatches = text.match(/\/Type\s*\/Page\b[^/]/g);
  if (pageMatches) {
    return pageMatches.length;
  }

  // Indeterminate - say so instead of pretending it is a single page.
  return null;
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
  let pageCountIndeterminate = false;

  if (file.type === "application/pdf") {
    try {
      const counted = await countPdfPages(file);

      if (counted === null) {
        // Accept, but record that the page cap could not be enforced here.
        pageCountIndeterminate = true;
      } else {
        pageCount = counted;
      }

      if (pageCount !== undefined && pageCount > MAX_PDF_PAGES) {
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

  return { valid: true, kind, pageCount, pageCountIndeterminate };
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

/**
 * Name for a camera capture. Lives here rather than in the component so the
 * impure `Date.now()` call stays outside React's render-purity analysis.
 */
export function createCameraCaptureFileName(): string {
  return `camera-${Date.now()}.png`;
}

/** Name for an image attached from the chat composer. */
export function createChatAttachmentFileName(): string {
  return `chat-attachment-${Date.now()}.png`;
}

/**
 * Convert a canvas data URL into a File so a camera capture can go through the
 * same validation and upload queue as a picked file.
 */
export async function dataUrlToFile(
  dataUrl: string,
  fileName: string = createCameraCaptureFileName(),
  mimeType = "image/png",
): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, { type: mimeType });
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
      pageCount = (await countPdfPages(file)) ?? undefined;
    } catch {
      pageCount = undefined;
    }
  }

  return { kind, pageCount, sizeFormatted: formatBytes(file.size) };
}

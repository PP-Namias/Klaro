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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface FileValidationResult {
  valid: boolean;
  error?: string;
  kind: "image" | "pdf";
}

export function validateFile(file: File): FileValidationResult {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type || "unknown"}" is not supported. Use PNG, JPG, WebP, or PDF.`,
      kind: "image",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatBytes(file.size)}) exceeds 50 MB limit.`,
      kind: file.type === "application/pdf" ? "pdf" : "image",
    };
  }

  if (file.size < 100) {
    return {
      valid: false,
      error: "File is too small or empty.",
      kind: file.type === "application/pdf" ? "pdf" : "image",
    };
  }

  const kind = file.type === "application/pdf" ? "pdf" : "image";
  return { valid: true, kind };
}

export function validateFiles(files: File[]): {
  valid: File[];
  invalid: { file: File; error: string }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of files) {
    const result = validateFile(file);
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

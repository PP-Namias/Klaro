export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    type: string;
    size: number;
    extension: string;
    mimeType: string;
  };
}

const ALLOWED_TYPES = new Map([
  ["image/png", ["png"]],
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/webp", ["webp"]],
  ["image/tiff", ["tiff", "tif"]],
  ["image/bmp", ["bmp"]],
  ["image/gif", ["gif"]],
  ["application/pdf", ["pdf"]],
]);

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "ps1",
  "vbs",
  "js",
  "msi",
  "com",
  "pif",
  "scr",
  "hta",
  "cpl",
  "lnk",
  "inf",
  "reg",
  "rgs",
  "sct",
  "shb",
  "ws",
  "wsc",
  "wsf",
  "wsh",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_FILE_SIZE = 100; // 100 bytes

export function validateFileType(
  file: File | { type: string; name: string },
): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (ALLOWED_TYPES.has(mimeType as any)) {
    return true;
  }

  for (const [, extensions] of ALLOWED_TYPES) {
    if (extensions.includes(extension)) {
      return true;
    }
  }

  return false;
}

export function validateFileSize(
  size: number,
  maxSize: number = MAX_FILE_SIZE,
): { valid: boolean; error?: string } {
  if (size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error: `File too small. Minimum size is ${MIN_FILE_SIZE} bytes.`,
    };
  }
  if (size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
    };
  }
  return { valid: true };
}

export function validateFileName(fileName: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, sanitized: "", error: "File name cannot be empty." };
  }

  const sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .trim();

  const extension = sanitized.split(".").pop()?.toLowerCase() || "";
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      sanitized,
      error: `File type .${extension} is not allowed for security reasons.`,
    };
  }

  if (sanitized.length > 255) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, 255),
      error: "File name too long. Maximum length is 255 characters.",
    };
  }

  return { valid: true, sanitized };
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length <= 1) return "";
  return parts.pop()?.toLowerCase() || "";
}

export function getMimeTypeFromFile(fileName: string): string {
  const extension = getFileExtension(fileName);
  for (const [mimeType, extensions] of ALLOWED_TYPES) {
    if (extensions.includes(extension)) {
      return mimeType;
    }
  }
  return "application/octet-stream";
}

export function validateFile(
  file: File | { type: string; name: string; size: number },
): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const extension = getFileExtension(file.name);
  const mimeType = file.type || getMimeTypeFromFile(file.name);

  if (!validateFileType(file)) {
    errors.push(`File type ${mimeType || "unknown"} is not supported.`);
  }

  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  const nameValidation = validateFileName(file.name);
  if (!nameValidation.valid && nameValidation.error) {
    errors.push(nameValidation.error);
  }

  if (file.size > 10 * 1024 * 1024) {
    warnings.push("Large file may take longer to process.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      type: mimeType,
      size: file.size,
      extension,
      mimeType,
    },
  };
}

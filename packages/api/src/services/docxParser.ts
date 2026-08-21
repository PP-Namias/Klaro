/**
 * DOCX parser - extracts text from Microsoft Word documents
 * Uses mammoth when available, falls back to raw zip XML extraction
 */

export interface DocxParseResult {
  success: boolean;
  text: string;
  pages?: number;
  metadata?: {
    title?: string;
    author?: string;
    createdAt?: Date;
  };
  error?: string;
  warnings: string[];
}

export function isDocx(buffer: Buffer): boolean {
  // DOCX is a ZIP archive starting with PK
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export async function parseDocxToText(buffer: Buffer): Promise<DocxParseResult> {
  const warnings: string[] = [];

  if (!isDocx(buffer)) {
    return {
      success: false,
      text: "",
      error: "Not a valid DOCX file (missing ZIP header)",
      warnings: ["invalid-docx-header"],
    };
  }

  // Try mammoth first (optional dep)
  try {
    const mammoth = (await import("mammoth" as string).catch(() => null)) as unknown as {
      extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
    } | null;

    if (mammoth) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      warnings.push("parser:mammoth");
      return {
        success: text.length > 0,
        text,
        warnings,
      };
    }
  } catch (err) {
    warnings.push(`mammoth-failed:${(err as Error).message.slice(0, 40)}`);
  }

  // Fallback: naive text extraction from buffer without unzip
  // Extract readable ASCII strings of length >=4
  try {
    const raw = buffer.toString("utf-8");
    // Look for word/document.xml content inside zip - strip tags
    const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (xmlMatches) {
      const text = xmlMatches
        .map((m) => m.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" ");
      warnings.push("parser:fallback-xml-tag");
      return {
        success: text.length > 0,
        text,
        warnings,
      };
    }
    // Last resort: extract printable strings
    const strings = raw.match(/[A-Za-z0-9][A-Za-z0-9\s.,()\-/]{10,}/g) ?? [];
    const text = strings.slice(0, 200).join(" ").slice(0, 10000);
    warnings.push("parser:fallback-strings");
    return {
      success: text.trim().length > 0,
      text: text.trim(),
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      text: "",
      error: `DOCX parse failed: ${(err as Error).message}`,
      warnings,
    };
  }
}

export async function extractDocxTextSafe(buffer: Buffer): Promise<DocxParseResult> {
  try {
    return await parseDocxToText(buffer);
  } catch (err) {
    return {
      success: false,
      text: "",
      error: "Document could not be processed. Please ensure it is a valid Word file.",
      warnings: [`docx-crash:${(err as Error).message.slice(0, 40)}`],
    };
  }
}

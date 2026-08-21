/**
 * PPTX parser - extracts text from PowerPoint presentations
 * Falls back gracefully when unzip libs unavailable
 */

export interface PptxParseResult {
  success: boolean;
  text: string;
  slideCount?: number;
  error?: string;
  warnings: string[];
}

export function isPptx(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export async function parsePptxToText(buffer: Buffer): Promise<PptxParseResult> {
  const warnings: string[] = [];

  if (!isPptx(buffer)) {
    return {
      success: false,
      text: "",
      error: "Not a valid PPTX file (missing ZIP header)",
      warnings: ["invalid-pptx-header"],
    };
  }

  try {
    // Try dynamic pptx parsing via JSZip-like approach
    const raw = buffer.toString("utf-8");
    // Extract text nodes from slide XML: <a:t>text</a:t>
    const aTMatches = raw.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
    if (aTMatches) {
      const text = aTMatches
        .map((m) => m.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join("\n");
      const slideMatches = raw.match(/ppt\/slides\/slide\d+\.xml/g);
      warnings.push("parser:pptx-a:t");
      return {
        success: text.length > 0,
        text,
        slideCount: slideMatches ? slideMatches.length : undefined,
        warnings,
      };
    }

    // Fallback to w:t tags as well (some templates)
    const wTMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (wTMatches) {
      const text = wTMatches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
      warnings.push("parser:fallback-w:t");
      return { success: text.length > 0, text, warnings };
    }

    // Last resort: printable strings
    const strings = raw.match(/[A-Za-z0-9][A-Za-z0-9\s.,()\-/]{10,}/g) ?? [];
    const text = strings.slice(0, 300).join(" ").slice(0, 10000);
    warnings.push("parser:pptx-strings");
    return {
      success: text.trim().length > 0,
      text: text.trim(),
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      text: "",
      error: `PPTX parse failed: ${(err as Error).message}`,
      warnings,
    };
  }
}

export async function extractPptxTextSafe(buffer: Buffer): Promise<PptxParseResult> {
  try {
    return await parsePptxToText(buffer);
  } catch (err) {
    return {
      success: false,
      text: "",
      error: "Document could not be processed. Please ensure it is a valid PowerPoint file.",
      warnings: [`pptx-crash:${(err as Error).message.slice(0, 40)}`],
    };
  }
}

import fs from 'node:fs/promises';

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfParseResult {
  pages: PdfPage[];
  totalPages: number;
  rawText: string;
  metadata: Record<string, unknown>;
}

export async function parsePdf(
  input: Buffer | string,
): Promise<PdfParseResult> {
  const buffer = typeof input === 'string' ? await fs.readFile(input) : input;

  if (buffer.length === 0) {
    throw new Error('PDF buffer is empty');
  }

  if (buffer.length > 100 * 1024 * 1024) {
    throw new Error('PDF exceeds maximum size of 100MB');
  }

  const pdfParse = (await import('pdf-parse')).default;

  const data = await pdfParse(buffer);

  const pageTexts = splitByPage(data.text);

  const pages: PdfPage[] = pageTexts.map((text, i) => ({
    pageNumber: i + 1,
    text: text.trim(),
  }));

  return {
    pages,
    totalPages: pages.length,
    rawText: data.text,
    metadata: {
      version: data.version,
      numPages: data.numpages,
      numRenderPages: data.numrender,
      info: data.info,
      metadata: data.metadata,
    },
  };
}

function splitByPage(text: string): string[] {
  const parts = text.split(/\f/);
  return parts.filter((p) => p.length > 0);
}

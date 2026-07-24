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

export interface PdfErrorInfo {
  encrypted: boolean;
  corrupt: boolean;
  empty: boolean;
  oversized: boolean;
  message: string;
}

const ENCRYPTED_PDF_MARKERS = [
  '/Encrypt',
  '/EncryptMetadata',
  '/Encryption',
];

const MAX_PDF_SIZE = 100 * 1024 * 1024;

function detectPdfError(buffer: Buffer): PdfErrorInfo | null {
  if (buffer.length === 0) {
    return { encrypted: false, corrupt: false, empty: true, oversized: false, message: 'PDF buffer is empty' };
  }

  if (buffer.length > MAX_PDF_SIZE) {
    return { encrypted: false, corrupt: false, empty: false, oversized: true, message: 'PDF exceeds maximum size of 100MB' };
  }

  const header = buffer.subarray(0, Math.min(buffer.length, 2048)).toString('utf8');

  for (const marker of ENCRYPTED_PDF_MARKERS) {
    if (header.includes(marker)) {
      return { encrypted: true, corrupt: false, empty: false, oversized: false, message: 'PDF is encrypted or password-protected' };
    }
  }

  if (!header.startsWith('%PDF-')) {
    return { encrypted: false, corrupt: true, empty: false, oversized: false, message: 'PDF header is missing or invalid' };
  }

  return null;
}

export async function parsePdf(
  input: Buffer | string,
): Promise<PdfParseResult> {
  const buffer = typeof input === 'string' ? await fs.readFile(input) : input;

  const error = detectPdfError(buffer);
  if (error) {
    throw new Error(error.message);
  }

  const pdfParse = (await import('pdf-parse')).default;

  let data: { text: string; version: string; numpages: number; numrender: number; info: Record<string, unknown>; metadata: Record<string, unknown> };
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      throw new Error('PDF is encrypted or password-protected');
    }
    if (msg.toLowerCase().includes('corrupt') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('format')) {
      throw new Error('PDF is corrupted and cannot be parsed');
    }
    throw new Error(`PDF parsing failed: ${msg}`);
  }

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

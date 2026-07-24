import { createCanvas } from "canvas";

export interface PdfPageImage {
  pageNumber: number;
  base64: string;
  width: number;
  height: number;
}

export interface PdfConversionResult {
  pages: PdfPageImage[];
  pageCount: number;
  success: boolean;
  error?: string;
}

const MAX_PDF_PAGES = 10;
const RENDER_SCALE = 1.5;

export async function convertPdfToImages(
  pdfBuffer: Buffer,
): Promise<PdfConversionResult> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const doc = await pdfjsLib.getDocument({ data: pdfBuffer.buffer as ArrayBuffer }).promise;
    const totalPages = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages: PdfPageImage[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;

      const buffer = canvas.toBuffer("image/png");
      const base64 = buffer.toString("base64");

      pages.push({ pageNumber: i, base64, width, height });
      page.cleanup();
    }

    doc.destroy();

    return { pages, pageCount: pages.length, success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF conversion failed";
    return { pages: [], pageCount: 0, success: false, error: message };
  }
}

export async function isPdf(buffer: Buffer): Promise<boolean> {
  try {
    const header = buffer.subarray(0, 5).toString("ascii");
    return header === "%PDF-";
  } catch {
    return false;
  }
}

export async function countPdfPages(pdfBuffer: Buffer): Promise<number> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const doc = await pdfjsLib.getDocument({ data: pdfBuffer.buffer }).promise;
    const count = doc.numPages;
    doc.destroy();
    return count;
  } catch {
    const text = pdfBuffer.toString("ascii");
    const match = text.match(/\/Type\s*\/Pages[^/]*\/Count\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
    const pages = text.match(/\/Type\s*\/Page\b/g);
    return pages ? pages.length : 1;
  }
}

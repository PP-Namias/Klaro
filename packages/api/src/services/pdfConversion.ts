import { createCanvas } from "@napi-rs/canvas";

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
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) })
      .promise;
    const totalPages = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages: PdfPageImage[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      // @napi-rs/canvas ships prebuilt binaries, so rasterisation works without
      // a node-gyp toolchain. The previous `import("canvas")` was never a
      // dependency, so every PDF returned "canvas module not available".
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // PDFs assume a white page; the canvas starts transparent.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const buffer = canvas.toBuffer("image/png");
      pages.push({
        pageNumber: i,
        base64: buffer.toString("base64"),
        width,
        height,
      });
      page.cleanup();
    }

    void doc.destroy();

    return { pages, pageCount: pages.length, success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF conversion failed";
    return { pages: [], pageCount: 0, success: false, error: message };
  }
}

export function isPdf(buffer: Buffer): boolean {
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
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) })
      .promise;
    const count = doc.numPages;
    void doc.destroy();
    return count;
  } catch {
    const text = pdfBuffer.toString("ascii");
    const match = /\/Type\s*\/Pages[^/]*\/Count\s+(\d+)/.exec(text);
    if (match) return parseInt(match[1] ?? "1", 10);
    const pages = text.match(/\/Type\s*\/Page\b/g);
    return pages ? pages.length : 1;
  }
}

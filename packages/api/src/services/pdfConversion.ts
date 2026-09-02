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
    let doc;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      // Attach password callback to fail gracefully on encrypted PDFs
      loadingTask.onPassword = (callback: (password: string) => void, reason: number) => {
        // reason 1 = need password, 2 = incorrect password
        const msg = reason === 2 ? "Incorrect password - PDF is password-protected" : "PDF is encrypted and requires a password";
        // Abort loading by throwing via promise rejection
        throw new Error(msg);
      };
      doc = await loadingTask.promise;
    } catch (loadError) {
      const rawMsg = loadError instanceof Error ? loadError.message : "PDF load failed";
      const lower = rawMsg.toLowerCase();
      if (lower.includes("password") || lower.includes("encrypted") || lower.includes("incorrect password")) {
        return { pages: [], pageCount: 0, success: false, error: "PDF is password-protected or encrypted - please provide an unprotected file" };
      }
      if (lower.includes("invalid") || lower.includes("corrupted") || lower.includes("unexpected")) {
        return { pages: [], pageCount: 0, success: false, error: "PDF appears corrupted or invalid - please try re-exporting" };
      }
      return { pages: [], pageCount: 0, success: false, error: rawMsg };
    }

    const totalPages = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages: PdfPageImage[] = [];

    for (let i = 1; i <= totalPages; i++) {
      try {
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

    if (pages.length === 0) {
      return { pages: [], pageCount: 0, success: false, error: "PDF has no readable pages - file may be corrupted or scanned as image" };
    }

    return { pages, pageCount: pages.length, success: true };
  } catch (error) {
    // Absolutely no throws to caller - sanitized
    const raw = error instanceof Error ? error.message : "PDF conversion failed";
    const lower = raw.toLowerCase();
    let sanitized = raw;
    if (lower.includes("password") || lower.includes("encrypted")) {
      sanitized = "PDF is password-protected or encrypted - please provide an unprotected file";
    } else if (lower.includes("canvas")) {
      sanitized = raw; // already sanitized upstream
    } else if (lower.includes("invalid") || lower.includes("corrupt")) {
      sanitized = "PDF appears corrupted - please try re-exporting the file";
    } else {
      sanitized = "PDF could not be processed. Please ensure it is a valid file and try again.";
    }
    // Never expose raw stack to client; log internally
    console.warn(`[pdfConversion] sanitized error: ${sanitized} raw=${raw.slice(0, 80)}`);
    return { pages: [], pageCount: 0, success: false, error: sanitized };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CanvasLike = any;

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
  let createCanvas: ((w: number, h: number) => CanvasLike) | undefined;
  try {
    const canvasMod = await (import("canvas") as Promise<
      typeof import("canvas")
    >);
    createCanvas = canvasMod.createCanvas;
  } catch {
    // canvas not available
  }
  if (!createCanvas) {
    return {
      pages: [],
      pageCount: 0,
      success: false,
      error: "canvas module not available",
    };
  }

  // Quick preflight checks without throwing
  if (pdfBuffer.length < 10) {
    return { pages: [], pageCount: 0, success: false, error: "PDF too small or empty - file appears corrupted" };
  }
  const header = pdfBuffer.subarray(0, 5).toString("ascii");
  if (header !== "%PDF-") {
    // Might be encrypted or corrupted
    if (pdfBuffer.subarray(0, 2).toString() === "PK") {
      return { pages: [], pageCount: 0, success: false, error: "File is not a PDF (detected Office document) - please upload a PDF" };
    }
    return { pages: [], pageCount: 0, success: false, error: "Invalid PDF header - file is corrupted or not a valid PDF" };
  }

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

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext(
          "2d",
        ) as unknown as CanvasRenderingContext2D;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;

        const buffer = canvas.toBuffer("image/png");
        const base64 = buffer.toString("base64");

        pages.push({ pageNumber: i, base64, width, height });
        page.cleanup();
      } catch (pageErr) {
        const msg = pageErr instanceof Error ? pageErr.message : "Page render failed";
        // Skip corrupted page but continue others - log warning
        console.warn(`[pdfConversion] page ${i} failed: ${msg}`);
        continue;
      }
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

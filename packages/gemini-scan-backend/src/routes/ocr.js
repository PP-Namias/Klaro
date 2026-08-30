const express = require("express");

const router = express.Router();

const MIN_BASE64_LENGTH = 100;
const MAX_BASE64_LENGTH = 15 * 1024 * 1024;
const TESSDATA_PATH = process.env.TESSDATA_PATH || "/data/tessdata";

// Tesseract spends seconds on worker startup and language-data load, so the
// worker is created once and reused. Kept as a promise so concurrent requests
// arriving during startup all await the same initialisation.
let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return createWorker("eng", undefined, {
        cachePath: TESSDATA_PATH,
      });
    })().catch((err) => {
      // Don't cache a failed init — the next request should retry.
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

function toBlocks(lines) {
  return (lines || [])
    .map((line) => ({
      text: typeof line.text === "string" ? line.text.trim() : "",
      confidence:
        typeof line.confidence === "number" ? line.confidence / 100 : undefined,
    }))
    .filter((block) => block.text.length > 0);
}

function averageConfidence(blocks) {
  if (blocks.length === 0) return 0;
  const total = blocks.reduce(
    (sum, b) => sum + (typeof b.confidence === "number" ? b.confidence : 0.7),
    0,
  );
  return Math.min(1, Math.max(0, total / blocks.length));
}

/**
 * POST /api/ocr
 *
 * Runs Tesseract over a base64 image and returns text plus per-line
 * confidence. This lives here rather than in the Next.js app because
 * tesseract.js forks a worker by resolving a path from its own module
 * location, which a bundler rewrites and breaks.
 */
router.post("/ocr", async (req, res) => {
  const body = req.body || {};
  const imageBase64 = body.imageBase64;

  if (
    typeof imageBase64 !== "string" ||
    imageBase64.length < MIN_BASE64_LENGTH
  ) {
    return res.status(400).json({
      error: "invalid_image",
      message: "imageBase64 is required and must be a base64 string",
    });
  }

  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({
      error: "image_too_large",
      message: `Image exceeds ${MAX_BASE64_LENGTH / 1024 / 1024}MB limit`,
    });
  }

  const startedAt = Date.now();

  try {
    const worker = await getWorker();
    const buffer = Buffer.from(imageBase64, "base64");
    const { data } = await worker.recognize(buffer);

    const blocks = toBlocks(data.lines);

    return res.json({
      text: typeof data.text === "string" ? data.text.trim() : "",
      blocks,
      confidence:
        typeof data.confidence === "number"
          ? Math.min(1, Math.max(0, data.confidence / 100))
          : averageConfidence(blocks),
      source: "local",
      processingMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[ocr] failed:", err && err.message);
    return res.status(500).json({
      error: "ocr_failed",
      message: err && err.message ? err.message : "OCR failed",
    });
  }
});

module.exports = router;

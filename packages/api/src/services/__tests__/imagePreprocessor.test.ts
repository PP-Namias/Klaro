import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  getDefaultPreprocessingOptions,
  preprocessImage,
} from "../imagePreprocessor";

/**
 * imagePreprocessor implemented real deskew/denoise/binarize/grayscale, but
 * loaded them behind a dynamic `import("canvas")` that was never a dependency.
 * getCanvas() therefore always returned null and preprocessImage returned the
 * input unchanged with applied === ["canvas-not-available"] and width/height 0.
 * These tests pin that the pipeline now actually runs.
 */

async function colourImageBase64(width = 24, height = 18) {
  const raw = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    raw[i * 4] = 220; // strongly red
    raw[i * 4 + 1] = 40;
    raw[i * 4 + 2] = 20;
    raw[i * 4 + 3] = 255;
  }
  const png = await sharp(raw, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  return png.toString("base64");
}

describe("preprocessImage", () => {
  it("reports the real decoded dimensions, never 0", async () => {
    const input = await colourImageBase64(24, 18);

    const result = await preprocessImage(input);

    expect(result.width).toBe(24);
    expect(result.height).toBe(18);
  });

  it("never reports the canvas-not-available fallback", async () => {
    const input = await colourImageBase64();

    const result = await preprocessImage(input);

    expect(result.applied).not.toContain("canvas-not-available");
    expect(result.applied).toContain("grayscale");
  });

  it("actually changes the pixels of a colour image", async () => {
    const input = await colourImageBase64();

    const result = await preprocessImage(input, {
      grayscale: true,
      denoise: false,
      deskew: false,
      contrast: 1,
      brightness: 1,
    });

    expect(result.base64).not.toBe(input);

    // Grayscale collapses the channels: R, G and B must now agree.
    const { data } = await sharp(result.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[0]).toBe(data[1]);
    expect(data[1]).toBe(data[2]);
  });

  it("binarizes to pure black and white when asked", async () => {
    const input = await colourImageBase64();

    const result = await preprocessImage(input, {
      grayscale: true,
      binarize: true,
      denoise: false,
      deskew: false,
      contrast: 1,
      brightness: 1,
    });

    expect(result.applied).toContain("binarize");

    const { data } = await sharp(result.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < 40; i += 4) {
      expect([0, 255]).toContain(data[i]);
    }
  });

  it("records a deskew decision on every run", async () => {
    const input = await colourImageBase64();

    const result = await preprocessImage(input, { deskew: true });

    expect(result.applied.some((step) => step.startsWith("deskew"))).toBe(true);
  });

  it("exposes usable defaults", () => {
    const defaults = getDefaultPreprocessingOptions();
    expect(defaults).toHaveProperty("grayscale");
  });
});

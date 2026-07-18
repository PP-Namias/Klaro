import { createCanvas, loadImage } from "canvas";

export interface PreprocessingOptions {
  grayscale?: boolean;
  denoise?: boolean;
  deskew?: boolean;
  binarize?: boolean;
  contrast?: number;
  brightness?: number;
}

export interface PreprocessingResult {
  buffer: Buffer;
  base64: string;
  width: number;
  height: number;
  applied: string[];
}

function toGray(value: number): number {
  return Math.round(0.299 * ((value >> 16) & 0xff) + 0.587 * ((value >> 8) & 0xff) + 0.114 * (value & 0xff));
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = toGray(data[i]! + (data[i + 1]! << 8) + (data[i + 2]! << 16));
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

function applyMedianDenoise(data: Uint8ClampedArray, width: number, height: number): void {
  const copy = new Uint8ClampedArray(data);
  const radius = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors: number[] = [];

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            neighbors.push(toGray(copy[idx]! + (copy[idx + 1]! << 8) + (copy[idx + 2]! << 16)));
          }
        }
      }

      neighbors.sort((a, b) => a - b);
      const median = neighbors[Math.floor(neighbors.length / 2)] ?? 0;
      const idx = (y * width + x) * 4;
      data[idx] = median;
      data[idx + 1] = median;
      data[idx + 2] = median;
    }
  }
}

function applyAdaptiveBinarize(data: Uint8ClampedArray, width: number, height: number): void {
  const blockSize = Math.max(8, Math.floor(Math.min(width, height) / 16));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      const half = Math.floor(blockSize / 2);

      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            sum += data[idx] ?? 0;
            count++;
          }
        }
      }

      const mean = count > 0 ? sum / count : 128;
      const idx = (y * width + x) * 4;
      const threshold = mean - 10;
      const value = (data[idx] ?? 0) >= threshold ? 255 : 0;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }
}

function applyContrast(data: Uint8ClampedArray, factor: number): void {
  const midpoint = 128;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(midpoint + (data[i]! - midpoint) * factor);
    data[i + 1] = clamp(midpoint + (data[i + 1]! - midpoint) * factor);
    data[i + 2] = clamp(midpoint + (data[i + 2]! - midpoint) * factor);
  }
}

function applyBrightness(data: Uint8ClampedArray, factor: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i]! * factor);
    data[i + 1] = clamp(data[i + 1]! * factor);
    data[i + 2] = clamp(data[i + 2]! * factor);
  }
}

function estimateSkew(data: Uint8ClampedArray, width: number, height: number): number {
  const mids = Math.floor(height / 2);
  let leftX = -1;
  let rightX = -1;
  const scanY = Math.floor(height / 3);

  for (let x = Math.floor(width * 0.1); x < Math.floor(width * 0.5); x++) {
    const idx = (scanY * width + x) * 4;
    if ((data[idx] ?? 0) < 128) { leftX = x; break; }
  }
  for (let x = Math.floor(width * 0.9); x > Math.floor(width * 0.5); x--) {
    const idx = (mids * width + x) * 4;
    if ((data[idx] ?? 0) < 128) { rightX = x; break; }
  }

  if (leftX < 0 || rightX < 0) return 0;

  const dx = rightX - leftX;
  const dy = mids - scanY;
  if (dx === 0) return 0;

  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export async function preprocessImage(
  inputBase64: string,
  options: PreprocessingOptions = {},
): Promise<PreprocessingResult> {
  const opts = {
    grayscale: options.grayscale ?? true,
    denoise: options.denoise ?? true,
    deskew: options.deskew ?? true,
    binarize: options.binarize ?? false,
    contrast: options.contrast ?? 1.2,
    brightness: options.brightness ?? 1.0,
  };

  const applied: string[] = [];
  const buffer = Buffer.from(inputBase64, "base64");

  const image = await loadImage(buffer);
  let width = image.width;
  let height = image.height;

  if (opts.deskew) {
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(image, 0, 0);
    const tempData = tempCtx.getImageData(0, 0, width, height);
    const skewAngle = estimateSkew(tempData.data, width, height);

    if (Math.abs(skewAngle) > 0.5) {
      const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
      const rotatedCanvas = createCanvas(diagonal, diagonal);
      const rotatedCtx = rotatedCanvas.getContext("2d");
      rotatedCtx.fillStyle = "#ffffff";
      rotatedCtx.fillRect(0, 0, diagonal, diagonal);
      rotatedCtx.translate(diagonal / 2, diagonal / 2);
      rotatedCtx.rotate((skewAngle * Math.PI) / 180);
      rotatedCtx.drawImage(tempCanvas, -width / 2, -height / 2);
      width = diagonal;
      height = diagonal;

      const rotatedBuffer = rotatedCanvas.toBuffer("image/png");
      const rotatedImage = await loadImage(rotatedBuffer);
      const resultCanvas = createCanvas(width, height);
      const resultCtx = resultCanvas.getContext("2d");
      resultCtx.drawImage(rotatedImage, 0, 0);

      const resultData = resultCtx.getImageData(0, 0, width, height);
      const data = resultData.data;

      if (opts.grayscale) { applyGrayscale(data); applied.push("grayscale"); }
      if (opts.denoise) { applyMedianDenoise(data, width, height); applied.push("denoise"); }
      if (opts.binarize) { applyAdaptiveBinarize(data, width, height); applied.push("binarize"); }
      if (opts.contrast !== 1) { applyContrast(data, opts.contrast); applied.push("contrast"); }
      if (opts.brightness !== 1) { applyBrightness(data, opts.brightness); applied.push("brightness"); }

      resultCtx.putImageData(resultData, 0, 0);
      const finalBuffer = resultCanvas.toBuffer("image/png");
      return { buffer: finalBuffer, base64: finalBuffer.toString("base64"), width, height, applied };
    }
    applied.push("deskew:not-needed");
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (opts.grayscale) { applyGrayscale(data); applied.push("grayscale"); }
  if (opts.denoise) { applyMedianDenoise(data, width, height); applied.push("denoise"); }
  if (opts.binarize) { applyAdaptiveBinarize(data, width, height); applied.push("binarize"); }
  if (opts.contrast !== 1) { applyContrast(data, opts.contrast); applied.push("contrast"); }
  if (opts.brightness !== 1) { applyBrightness(data, opts.brightness); applied.push("brightness"); }

  ctx.putImageData(imageData, 0, 0);
  const finalBuffer = canvas.toBuffer("image/png");
  return { buffer: finalBuffer, base64: finalBuffer.toString("base64"), width, height, applied };
}

export async function preprocessBuffer(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {},
): Promise<PreprocessingResult> {
  return preprocessImage(imageBuffer.toString("base64"), options);
}

export function getDefaultPreprocessingOptions(): PreprocessingOptions {
  return {
    grayscale: true,
    denoise: true,
    deskew: true,
    binarize: false,
    contrast: 1.2,
    brightness: 1.0,
  };
}

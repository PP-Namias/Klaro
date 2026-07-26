export interface NormalizedOcrResult {
  text: string;
  normalizedText: string;
  confidence: number;
  language: string;
  blocks: {
    text: string;
    normalizedText: string;
    confidence: number;
    lineIndex: number;
  }[];
  metadata: {
    totalBlocks: number;
    averageConfidence: number;
    detectedLanguage: string;
    processingTimeMs: number;
  };
}

export interface OcrStorageRecord {
  id: string;
  documentId: string;
  rawText: string;
  normalizedText: string;
  confidence: number;
  language: string;
  blocks: string;
  createdAt: Date;
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectLanguage(text: string): string {
  const filipinoPatterns = [
    /ang\s+(mga\s+)?\w+/i,
    /ng\s+\w+/i,
    /mga\s+\w+/i,
    /para\s+sa\s+\w+/i,
    /isa\s+sa\s+\w+/i,
  ];

  const bisayaPatterns = [
    /ang\s+\w+/i,
    /mga\s+\w+/i,
    /para\s+sa\s+\w+/i,
    /nindot\s+\w+/i,
    /dako\s+\w+/i,
  ];

  const ilocanoPatterns = [
    /ti\s+\w+/i,
    /nga\s+\w+/i,
    /kadagiti\s+\w+/i,
    /iti\s+\w+/i,
  ];

  const filipinoScore = filipinoPatterns.filter((p) => p.test(text)).length;
  const bisayaScore = bisayaPatterns.filter((p) => p.test(text)).length;
  const ilocanoScore = ilocanoPatterns.filter((p) => p.test(text)).length;

  if (filipinoScore > bisayaScore && filipinoScore > ilocanoScore) return "fil";
  if (bisayaScore > ilocanoScore) return "bisaya";
  if (ilocanoScore > 0) return "ilocano";
  return "en";
}

export function normalizeBlock(
  block: { text: string; confidence?: number },
  lineIndex: number,
): NormalizedOcrResult["blocks"][0] {
  const normalizedText = normalizeText(block.text);
  return {
    text: block.text,
    normalizedText,
    confidence: block.confidence ?? 0,
    lineIndex,
  };
}

export function normalizeOcrResult(
  rawText: string,
  blocks: { text: string; confidence?: number }[] = [],
  _source = "local",
): NormalizedOcrResult {
  const startTime = Date.now();

  const normalizedText = normalizeText(rawText);
  const language = detectLanguage(normalizedText);

  const normalizedBlocks = blocks.map((block, index) =>
    normalizeBlock(block, index),
  );

  const totalConfidence = normalizedBlocks.reduce(
    (sum, b) => sum + b.confidence,
    0,
  );
  const averageConfidence =
    normalizedBlocks.length > 0 ? totalConfidence / normalizedBlocks.length : 0;

  return {
    text: rawText,
    normalizedText,
    confidence: averageConfidence,
    language,
    blocks: normalizedBlocks,
    metadata: {
      totalBlocks: normalizedBlocks.length,
      averageConfidence,
      detectedLanguage: language,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

export function compareOcrResults(
  result1: NormalizedOcrResult,
  result2: NormalizedOcrResult,
): {
  textMatch: boolean;
  confidenceDelta: number;
  languageMatch: boolean;
  blockCountDelta: number;
} {
  return {
    textMatch: result1.normalizedText === result2.normalizedText,
    confidenceDelta: Math.abs(result1.confidence - result2.confidence),
    languageMatch: result1.language === result2.language,
    blockCountDelta: Math.abs(result1.blocks.length - result2.blocks.length),
  };
}

export function formatOcrResultForStorage(
  result: NormalizedOcrResult,
): OcrStorageRecord {
  return {
    id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    documentId: "",
    rawText: result.text,
    normalizedText: result.normalizedText,
    confidence: result.confidence,
    language: result.language,
    blocks: JSON.stringify(result.blocks),
    createdAt: new Date(),
  };
}

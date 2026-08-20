import { Document } from "@langchain/core/documents";

import { embedTexts, mockEmbed, shouldUseMockEmbeddings } from "./embeddings.js";

export interface SemanticChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  breakpointPercentile?: number;
  minChunkSentences?: number;
  embeddingBatchSize?: number;
}

export function getSemanticChunkOptions(): Required<SemanticChunkOptions> {
  return {
    chunkSize: parseInt(process.env.SEMANTIC_CHUNK_SIZE ?? "1000", 10),
    chunkOverlap: parseInt(process.env.SEMANTIC_CHUNK_OVERLAP ?? "150", 10),
    breakpointPercentile: parseInt(process.env.SEMANTIC_BREAKPOINT_PERCENTILE ?? "85", 10),
    minChunkSentences: parseInt(process.env.SEMANTIC_MIN_SENTENCES ?? "2", 10),
    embeddingBatchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE ?? "32", 10),
  };
}

/**
 * Cosine similarity in [-1, 1].
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have same length");
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  const safeIdx = Math.max(0, Math.min(idx, sorted.length - 1));
  return sorted[safeIdx] ?? 0;
}

/**
 * Split text into sentences preserving delimiters.
 * Handles medical shorthand (e.g., "Dr.", "5.2 mg/dL") conservatively.
 */
export function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  // Split on sentence terminators followed by whitespace + capital or newline
  const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/g);
  // Further split overly long sentences on semicolons / line breaks
  const sentences: string[] = [];
  for (const part of parts) {
    const sub = part.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    sentences.push(...sub);
  }
  return sentences.filter((s) => s.length > 0);
}

/**
 * Detect semantic breakpoints via cosine similarity between consecutive sentence embeddings.
 * Returns a boolean array where true means break BEFORE that sentence index.
 */
export function detectBreakpoints(
  similarities: number[],
  opts: Required<SemanticChunkOptions>,
): boolean[] {
  if (similarities.length === 0) return [];
  // Invert similarity to distance; lower similarity => higher distance => more likely breakpoint
  const distances = similarities.map((s) => 1 - s);
  const threshold = percentile(distances, opts.breakpointPercentile);
  return distances.map((d) => d >= threshold);
}

export async function semanticChunkText(
  text: string,
  sourcePage?: number,
  options?: SemanticChunkOptions,
): Promise<Document[]> {
  const opts = { ...getSemanticChunkOptions(), ...options };
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];
  if (sentences.length === 1) {
    const single = sentences[0] ?? "";
    return [
      new Document({
        pageContent: single,
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          chunkMethod: "semantic",
          sourcePage,
        },
      }),
    ];
  }

  // Short-circuit for tiny documents
  if (text.length <= opts.chunkSize && sentences.length <= opts.minChunkSentences * 2) {
    return [
      new Document({
        pageContent: text.trim(),
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          chunkMethod: "semantic",
          sourcePage,
        },
      }),
    ];
  }

  // Embed sentences
  const embeddings = shouldUseMockEmbeddings()
    ? sentences.map((s) => mockEmbed(s))
    : await embedTexts(sentences, { batchSize: opts.embeddingBatchSize });

  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    const a = embeddings[i];
    const b = embeddings[i + 1];
    if (a && b) similarities.push(cosineSimilarity(a, b));
  }

  const breakpoints = detectBreakpoints(similarities, opts);

  // Build semantic groups
  const groups: string[][] = [];
  const first = sentences[0] ?? "";
  let current: string[] = [first];
  for (let i = 1; i < sentences.length; i++) {
    const shouldBreak = breakpoints[i - 1] ?? false;
    const sentence = sentences[i] ?? "";
    // Enforce minChunkSentences
    if (shouldBreak && current.length >= opts.minChunkSentences) {
      groups.push(current);
      current = [sentence];
    } else {
      current.push(sentence);
    }
  }
  groups.push(current);

  // Re-chunk groups that exceed chunkSize with overlap
  const docs: Document[] = [];
  let chunkIndex = 0;
  for (const group of groups) {
    const groupText = group.join(" ");
    // If group still too large, sliding window
    if (groupText.length > opts.chunkSize) {
      let start = 0;
      while (start < groupText.length) {
        const slice = groupText.slice(start, start + opts.chunkSize);
        docs.push(
          new Document({
            pageContent: slice,
            metadata: {
              chunkIndex: chunkIndex++,
              chunkMethod: "semantic",
              sourcePage,
              breakpointScore: similarities[Math.min(start, similarities.length - 1)] ?? 0,
            },
          }),
        );
        if (start + opts.chunkSize >= groupText.length) break;
        start += opts.chunkSize - opts.chunkOverlap;
      }
    } else {
      docs.push(
        new Document({
          pageContent: groupText,
          metadata: {
            chunkIndex: chunkIndex++,
            chunkMethod: "semantic",
            sourcePage,
          },
        }),
      );
    }
  }

  // Fix totalChunks
  return docs.map((d, i) => {
    d.metadata.totalChunks = docs.length;
    d.metadata.chunkIndex = i;
    return d;
  });
}

export async function semanticChunkPages(
  pages: { pageNumber: number; text: string }[],
  options?: SemanticChunkOptions,
): Promise<Document[]> {
  const results: Document[] = [];
  for (const page of pages) {
    const chunks = await semanticChunkText(page.text, page.pageNumber, options);
    results.push(...chunks);
  }
  return results;
}

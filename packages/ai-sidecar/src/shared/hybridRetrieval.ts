import type { Document } from "@langchain/core/documents";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";

import { cosineSimilarity } from "./semanticChunker.js";
import { embedQuery, mockEmbed, shouldUseMockEmbeddings } from "./embeddings.js";

export interface HybridSearchOptions {
  k?: number;
  denseWeight?: number; // 0-1
  sparseWeight?: number;
  rerank?: boolean;
  topK?: number;
}

export function getHybridOptions(): Required<HybridSearchOptions> {
  return {
    k: parseInt(process.env.HYBRID_K ?? "8", 10),
    denseWeight: parseFloat(process.env.HYBRID_DENSE_WEIGHT ?? "0.7"),
    sparseWeight: parseFloat(process.env.HYBRID_SPARSE_WEIGHT ?? "0.3"),
    rerank: process.env.HYBRID_RERANK !== "false",
    topK: parseInt(process.env.HYBRID_FINAL_K ?? "5", 10),
  };
}

/**
 * Sparse score: simple keyword overlap (BM25-like lightweight).
 */
export function sparseScore(query: string, docContent: string): number {
  const qTerms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const d = docContent.toLowerCase();
  if (qTerms.length === 0) return 0;
  let hits = 0;
  for (const t of qTerms) if (d.includes(t)) hits++;
  return hits / qTerms.length;
}

/**
 * Rerank by combining dense cosine, sparse overlap and heuristic citation boost.
 */
export async function rerankDocuments(
  query: string,
  docs: Document[],
  opts?: HybridSearchOptions,
): Promise<Document[]> {
  const options = { ...getHybridOptions(), ...opts };
  const queryEmbedding = shouldUseMockEmbeddings()
    ? mockEmbed(query)
    : await embedQuery(query);

  // Embed docs if not already embedded (use mock for rerank)
  const scored = await Promise.all(
    docs.map(async (doc) => {
      const docEmbedding = shouldUseMockEmbeddings()
        ? mockEmbed(doc.pageContent)
        : await embedQuery(doc.pageContent);
      const dense = cosineSimilarity(queryEmbedding, docEmbedding);
      const sparse = sparseScore(query, doc.pageContent);
      const combined = dense * options.denseWeight + sparse * options.sparseWeight;
      // Boost docs with heading/sectionType matching query
      const headingBoost = doc.metadata?.heading
        ? sparseScore(query, String(doc.metadata.heading)) * 0.1
        : 0;
      return {
        doc,
        score: combined + headingBoost,
        dense,
        sparse,
      };
    }),
  );

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, options.topK);

  return top.map(({ doc, score, dense, sparse }) => {
    return {
      ...doc,
      metadata: {
        ...doc.metadata,
        rerankScore: score,
        denseScore: dense,
        sparseScore: sparse,
        citation: formatCitation(doc),
      },
    } as Document;
  });
}

function formatCitation(doc: Document): string {
  const page = doc.metadata?.sourcePage ? `p.${doc.metadata.sourcePage}` : "";
  const heading = doc.metadata?.heading ? ` §${doc.metadata.heading}` : "";
  const strategy = doc.metadata?.strategy ? ` [${doc.metadata.strategy}]` : "";
  return `${page}${heading}${strategy}`.trim() || "source";
}

/**
 * Hybrid search: retrieve dense results then rerank with sparse+dense fusion.
 */
export async function hybridSearch(
  query: string,
  retriever: VectorStoreRetriever,
  opts?: HybridSearchOptions,
): Promise<Document[]> {
  const options = { ...getHybridOptions(), ...opts };

  // Over-fetch for reranking
  const raw = await retriever.invoke(query);
  // Ensure we have enough candidates
  const candidates = raw.length >= options.k ? raw : raw;

  if (!options.rerank) {
    return candidates.slice(0, options.topK).map((d) => ({
      ...d,
      metadata: { ...d.metadata, citation: formatCitation(d) },
    })) as Document[];
  }

  return rerankDocuments(query, candidates, options);
}

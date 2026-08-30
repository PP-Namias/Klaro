import type { Document } from "@langchain/core/documents";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

import { hybridSearch } from "./hybridRetrieval.js";

import type { BaseConfiguration } from "./configuration.js";
import { ensureBaseConfiguration } from "./configuration.js";
import {
  GEMINI_EMBEDDING_DIMS,
  getGeminiEmbeddings,
} from "./embeddings.js";

const RETRIEVER_TIMEOUT = 5000;
const SUPABASE_VECTOR_TABLE = "klaro_document_vectors";
const SUPABASE_MATCH_FN = "match_klaro_documents";

/**
 * An empty filter means "no filter", but passing `{}` straight through makes
 * Chroma reject the query outright:
 *   InvalidArgumentError: Expected where to have exactly one operator, got {}
 * BaseConfiguration defaults filterKwargs to `{}`, so any caller that does not
 * set one -- checkVectorStoreHealth, for instance -- would otherwise fail.
 */
function normalizeFilter(
  filter: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  return filter && Object.keys(filter).length > 0 ? filter : undefined;
}

export { GEMINI_EMBEDDING_DIMS, getGeminiEmbeddings };
export function getEmbeddings(model?: string) {
  return getGeminiEmbeddings(model);
}

// Singleton Supabase client for connection reuse (latency optimization)
let cachedSupabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  if (!cachedSupabaseClient) cachedSupabaseClient = createClient(url, key);
  return cachedSupabaseClient;
}
export function resetSupabaseClient() {
  cachedSupabaseClient = null;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

export async function makeChromaRetriever(
  configuration: BaseConfiguration,
): Promise<VectorStoreRetriever> {
  const embeddings = getEmbeddings();
  const url = process.env.CHROMA_DB_URL ?? "http://localhost:8000";

  const vectorStore = await withTimeout(
    Promise.resolve(
      new Chroma(embeddings, { url, collectionName: "klaro_documents" }),
    ),
    RETRIEVER_TIMEOUT,
    "ChromaDB connection",
  );

  return vectorStore.asRetriever({
    k: configuration.k,
    filter: normalizeFilter(configuration.filterKwargs),
  });
}

export async function makeSupabaseRetriever(
  configuration: BaseConfiguration,
): Promise<VectorStoreRetriever> {
  const embeddings = getEmbeddings();
  const supabaseClient = getSupabaseClient();

  // Supabase pgvector: 768d Gemini text-embedding-004, HNSW index for <200ms
  const vectorStore = await withTimeout(
    Promise.resolve(
      new SupabaseVectorStore(embeddings, {
        client: supabaseClient,
        tableName: SUPABASE_VECTOR_TABLE,
        queryName: SUPABASE_MATCH_FN,
      }),
    ),
    RETRIEVER_TIMEOUT,
    "Supabase pgvector connection",
  );

  const retriever = vectorStore.asRetriever({
    k: configuration.k,
    filter: normalizeFilter(configuration.filterKwargs),
  });

  // Wrap invoke to measure latency and enforce sub-200ms soft budget log
  const originalInvoke = retriever.invoke.bind(retriever);
  retriever.invoke = async (query: string) => {
    const start = Date.now();
    const result = await withTimeout(
      originalInvoke(query) as Promise<Document[]>,
      RETRIEVER_TIMEOUT,
      "Supabase pgvector search",
    );
    const latency = Date.now() - start;
    if (latency > 200) {
      console.warn(`[ai-sidecar] Supabase search latency ${latency}ms exceeds 200ms budget`);
    }
    return result;
  };

  return retriever;
}

export async function makeHybridRetriever(
  config?: RunnableConfig,
): Promise<VectorStoreRetriever & { hybridSearch: (q: string) => Promise<Document[]> }> {
  const base = await makeRetriever(config);
  const hybrid = {
    ...base,
    hybridSearch: (query: string) => hybridSearch(query, base),
  } as VectorStoreRetriever & { hybridSearch: (q: string) => Promise<Document[]> };
  return hybrid;
}

export function makeNoopRetriever(): VectorStoreRetriever {
  return {
    invoke: async (_query: string): Promise<Document[]> => {
      await Promise.resolve();
      return [];
    },
    getRelevantDocuments: async (_query: string): Promise<Document[]> => {
      await Promise.resolve();
      return [];
    },
    addDocuments: async (_docs: Document[]): Promise<void> => {
      await Promise.resolve();
    },
    similaritySearch: async (_query: string): Promise<Document[]> => {
      await Promise.resolve();
      return [];
    },
  } as unknown as VectorStoreRetriever;
}

export async function makeRetriever(
  config?: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureBaseConfiguration(config);

  const noVectorStore =
    process.env.VECTOR_STORE_PROVIDER === "none" ||
    process.env.VECTOR_STORE_PROVIDER === "";

  if (noVectorStore) {
    return makeNoopRetriever();
  }

  switch (configuration.retrieverProvider) {
    case "chroma":
      return makeChromaRetriever(configuration);
    case "supabase":
      return makeSupabaseRetriever(configuration);
    default:
      throw new Error(
        `Unsupported retriever provider: ${configuration.retrieverProvider}`,
      );
  }
}

export async function checkVectorStoreHealth(): Promise<void> {
  const provider = process.env.VECTOR_STORE_PROVIDER;
  if (provider === "none" || provider === "") {
    return;
  }

  const retriever = await makeRetriever();
  await Promise.race([
    retriever.invoke("connectivity probe"),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Vector store probe timed out after 5s")),
        5000,
      ),
    ),
  ]);
}

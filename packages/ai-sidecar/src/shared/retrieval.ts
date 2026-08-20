import type { Document } from "@langchain/core/documents";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

import type { BaseConfiguration } from "./configuration.js";
import { ensureBaseConfiguration } from "./configuration.js";
import {
  GEMINI_EMBEDDING_DIMS,
  getGeminiEmbeddings,
} from "./embeddings.js";

const RETRIEVER_TIMEOUT = 5000;

export { GEMINI_EMBEDDING_DIMS, getGeminiEmbeddings };
export function getEmbeddings(model?: string) {
  return getGeminiEmbeddings(model);
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
    filter: configuration.filterKwargs,
  });
}

export async function makeSupabaseRetriever(
  configuration: BaseConfiguration,
): Promise<VectorStoreRetriever> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set",
    );
  }

  const embeddings = getEmbeddings();

  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const vectorStore = await withTimeout(
    Promise.resolve(
      new SupabaseVectorStore(embeddings, {
        client: supabaseClient,
        tableName: "documents",
        queryName: "match_documents",
      }),
    ),
    RETRIEVER_TIMEOUT,
    "Supabase connection",
  );

  return vectorStore.asRetriever({
    k: configuration.k,
    filter: configuration.filterKwargs,
  });
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

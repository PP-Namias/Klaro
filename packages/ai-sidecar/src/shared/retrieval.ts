import type { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

import type { BaseConfiguration } from "./configuration.js";
import { ensureBaseConfiguration } from "./configuration.js";

const RETRIEVER_TIMEOUT = 5000;

async function getEmbeddings(model?: string): Promise<Embeddings> {
  const provider =
    process.env.EMBEDDING_PROVIDER ?? process.env.LLM_PROVIDER ?? "openai";

  if (provider === "google-genai" || provider === "gemini") {
    try {
      const { GoogleGenerativeAIEmbeddings } = await (
        Function('return import("@langchain/google-genai")') as () => Promise<
          Record<string, unknown>
        >
      )();
      if (GoogleGenerativeAIEmbeddings) {
        return new (GoogleGenerativeAIEmbeddings as new (
          fields: Record<string, unknown>,
        ) => Embeddings)({
          model: model ?? process.env.EMBEDDING_MODEL ?? "text-embedding-004",
          apiKey:
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GENAI_API_KEY ||
            process.env.GEMINI_API_KEY,
        });
      }
    } catch {
      console.warn(
        "[ai-sidecar] Google Generative AI embeddings not available, falling back to OpenAI",
      );
    }
  }

  return new OpenAIEmbeddings({
    model: model ?? process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
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
  const embeddings = await getEmbeddings();
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

  const embeddings = await getEmbeddings();

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

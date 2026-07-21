import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
  type BaseConfiguration,
} from './configuration.js';

async function getEmbeddings(model?: string): Promise<Embeddings> {
  const provider = process.env.EMBEDDING_PROVIDER ?? process.env.LLM_PROVIDER ?? 'openai';

  if (provider === 'google-genai' || provider === 'gemini') {
    try {
      const { GoogleGenerativeAIEmbeddings } = await (Function('return import("@langchain/google-genai")') as () => Promise<Record<string, unknown>>)();
      if (GoogleGenerativeAIEmbeddings) {
        return new (GoogleGenerativeAIEmbeddings as new (fields: Record<string, unknown>) => Embeddings)({
          model: model ?? process.env.EMBEDDING_MODEL ?? 'text-embedding-004',
          apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
        });
      }
    } catch {
      console.warn('[ai-sidecar] Google Generative AI embeddings not available, falling back to OpenAI');
    }
  }

  return new OpenAIEmbeddings({
    model: model ?? process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function makeChromaRetriever(
  configuration: BaseConfiguration,
): Promise<VectorStoreRetriever> {
  const embeddings = await getEmbeddings();
  const url = process.env.CHROMA_DB_URL ?? 'http://localhost:8000';

  const vectorStore = new Chroma(embeddings, {
    url,
    collectionName: 'klaro_documents',
  });

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
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set',
    );
  }

  const embeddings = await getEmbeddings();
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: 'documents',
    queryName: 'match_documents',
  });

  return vectorStore.asRetriever({
    k: configuration.k,
    filter: configuration.filterKwargs,
  });
}

export async function makeRetriever(
  config?: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureBaseConfiguration(config);

  switch (configuration.retrieverProvider) {
    case 'chroma':
      return makeChromaRetriever(configuration);
    case 'supabase':
      return makeSupabaseRetriever(configuration);
    default:
      throw new Error(
        `Unsupported retriever provider: ${configuration.retrieverProvider}`,
      );
  }
}

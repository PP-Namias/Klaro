/**
 * Supabase pgvector schema for Klaro RAG.
 * Table: klaro_document_vectors — stores 768d Gemini text-embedding-004 vectors.
 * Requires pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
 *
 * Free-tier friendly: single table, HNSW index for <200ms search.
 */

export const VECTOR_DIMS = 768;
export const VECTOR_TABLE = "klaro_document_vectors";
export const VECTOR_MATCH_FN = "match_klaro_documents";

/**
 * SQL to provision the vector store (run once in Supabase SQL editor or via drizzle migration).
 *
 * -- 1. Enable extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 *
 * -- 2. Table
 * CREATE TABLE IF NOT EXISTS klaro_document_vectors (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   content text NOT NULL,
 *   embedding vector(768) NOT NULL,
 *   metadata jsonb DEFAULT '{}'::jsonb,
 *   tenant_id text,
 *   namespace text DEFAULT 'default',
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- 3. HNSW index for cosine distance (sub-200ms)
 * CREATE INDEX IF NOT EXISTS klaro_vectors_embedding_hnsw
 *   ON klaro_document_vectors USING hnsw (embedding vector_cosine_ops);
 *
 * -- 4. Match function used by LangChain SupabaseVectorStore
 * CREATE OR REPLACE FUNCTION match_klaro_documents(
 *   query_embedding vector(768),
 *   match_count int DEFAULT 5,
 *   filter jsonb DEFAULT '{}'::jsonb
 * ) RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
 * LANGUAGE plpgsql AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     v.id, v.content, v.metadata,
 *     1 - (v.embedding <=> query_embedding) AS similarity
 *   FROM klaro_document_vectors v
 *   WHERE (filter = '{}'::jsonb OR v.metadata @> filter)
 *   ORDER BY v.embedding <=> query_embedding
 *   LIMIT match_count;
 * END; $$;
 */

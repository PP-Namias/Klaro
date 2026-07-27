import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export function getChunkOptions(): Required<ChunkOptions> {
  return {
    chunkSize: parseInt(process.env.CHUNK_SIZE ?? "1000", 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP ?? "200", 10),
    separators: ["\n\n", "\n", ".", " ", ""],
  };
}

export async function chunkText(
  text: string,
  sourcePage?: number,
  options?: ChunkOptions,
): Promise<Document[]> {
  const opts = { ...getChunkOptions(), ...options };

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: opts.chunkSize,
    chunkOverlap: opts.chunkOverlap,
    separators: opts.separators,
  });

  const rawDocs = await splitter.createDocuments([text]);

  return rawDocs.map((doc, index) => {
    const metadata: Record<string, unknown> = {
      chunkIndex: index,
      totalChunks: rawDocs.length,
      ...doc.metadata,
    };
    if (sourcePage !== undefined) {
      metadata.sourcePage = sourcePage;
    }
    return new Document({
      pageContent: doc.pageContent,
      metadata,
    });
  });
}

export async function chunkPages(
  pages: { pageNumber: number; text: string }[],
  options?: ChunkOptions,
): Promise<Document[]> {
  const results: Document[] = [];

  for (const page of pages) {
    const chunks = await chunkText(page.text, page.pageNumber, options);
    results.push(...chunks);
  }

  return results;
}

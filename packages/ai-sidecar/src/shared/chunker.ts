import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { enrichPage, parseHierarchy } from "./pdfHierarchy.js";
import { semanticChunkText } from "./semanticChunker.js";

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

export interface HierarchyChunkOptions extends ChunkOptions {
  useSemantic?: boolean;
}

export function getHierarchyChunkOptions(): Required<HierarchyChunkOptions> {
  const base = getChunkOptions();
  return {
    ...base,
    useSemantic: process.env.HIERARCHY_USE_SEMANTIC !== "false",
  };
}

/**
 * Hierarchy-aware chunking: split by detected medical headings, then chunk within each section.
 * Preserves heading, sectionType, hasTable and sourcePage in metadata and supports semantic splitting.
 */
export async function hierarchyChunkText(
  text: string,
  sourcePage?: number,
  options?: HierarchyChunkOptions,
): Promise<Document[]> {
  const opts = { ...getHierarchyChunkOptions(), ...options };
  const sections = parseHierarchy(text);
  const enriched = enrichPage(text, sourcePage ?? 0);

  // If no meaningful hierarchy, fall back to semantic or recursive
  if (sections.length === 1 && sections[0]?.heading === "Document") {
    if (opts.useSemantic) {
      return semanticChunkText(text, sourcePage, {
        chunkSize: opts.chunkSize,
        chunkOverlap: opts.chunkOverlap,
      });
    }
    return chunkText(text, sourcePage, opts);
  }

  const docs: Document[] = [];
  for (const section of sections) {
    const sectionChunks = opts.useSemantic
      ? await semanticChunkText(section.content, sourcePage, {
          chunkSize: opts.chunkSize,
          chunkOverlap: opts.chunkOverlap,
        })
      : await chunkText(section.content, sourcePage, opts);

    for (const doc of sectionChunks) {
      docs.push(
        new Document({
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            heading: section.heading,
            headingLevel: section.headingLevel,
            sectionType: section.sectionType,
            hasTable: enriched.hasTable,
            pageSectionType: enriched.sectionType,
            chunkMethod: opts.useSemantic ? "hierarchy-semantic" : "hierarchy-recursive",
          },
        }),
      );
    }
  }

  return docs.map((d, i) => {
    d.metadata.chunkIndex = i;
    d.metadata.totalChunks = docs.length;
    return d;
  });
}

export async function hierarchyChunkPages(
  pages: { pageNumber: number; text: string }[],
  options?: HierarchyChunkOptions,
): Promise<Document[]> {
  const results: Document[] = [];
  for (const page of pages) {
    const chunks = await hierarchyChunkText(page.text, page.pageNumber, options);
    results.push(...chunks);
  }
  return results;
}

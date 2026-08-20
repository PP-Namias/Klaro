import { Document } from "@langchain/core/documents";

import { chunkText } from "./chunker.js";
import { detectSectionType, type MedicalSectionType } from "./pdfHierarchy.js";
import { semanticChunkText } from "./semanticChunker.js";

export type ChunkStrategy = MedicalSectionType;

export interface StrategyConfig {
  chunkSize: number;
  chunkOverlap: number;
  useSemantic: boolean;
  separators: string[];
}

const STRATEGY_CONFIGS: Record<ChunkStrategy, StrategyConfig> = {
  lab_result: {
    chunkSize: 800,
    chunkOverlap: 120,
    useSemantic: false, // table rows must stay intact
    separators: ["\n\n", "\n", " | ", "  ", " "],
  },
  prescription: {
    chunkSize: 700,
    chunkOverlap: 100,
    useSemantic: false,
    separators: ["\n\n", "\n", ";", ".", " "],
  },
  discharge_summary: {
    chunkSize: 1200,
    chunkOverlap: 200,
    useSemantic: true,
    separators: ["\n\n", "\n", ". ", " "],
  },
  consultation: {
    chunkSize: 1000,
    chunkOverlap: 150,
    useSemantic: true,
    separators: ["\n\n", "\n", ". ", " "],
  },
  imaging: {
    chunkSize: 900,
    chunkOverlap: 150,
    useSemantic: true,
    separators: ["\n\n", "FINDINGS:", "IMPRESSION:", "\n", ". "],
  },
  other_doc: {
    chunkSize: 1000,
    chunkOverlap: 150,
    useSemantic: true,
    separators: ["\n\n", "\n", ". ", " "],
  },
  generic: {
    chunkSize: 1000,
    chunkOverlap: 200,
    useSemantic: true,
    separators: ["\n\n", "\n", ". ", " "],
  },
};

export function getStrategyForText(text: string): ChunkStrategy {
  return detectSectionType(text);
}

export function getStrategyConfig(strategy: ChunkStrategy): StrategyConfig {
  return STRATEGY_CONFIGS[strategy] ?? STRATEGY_CONFIGS.generic;
}

/**
 * Chunk using the strategy tuned for the detected medical document type.
 */
export async function chunkByStrategy(
  text: string,
  strategy?: ChunkStrategy,
  sourcePage?: number,
): Promise<Document[]> {
  const resolved = strategy ?? getStrategyForText(text);
  const cfg = getStrategyConfig(resolved);

  const docs = cfg.useSemantic
    ? await semanticChunkText(text, sourcePage, {
        chunkSize: cfg.chunkSize,
        chunkOverlap: cfg.chunkOverlap,
      })
    : await chunkText(text, sourcePage, {
        chunkSize: cfg.chunkSize,
        chunkOverlap: cfg.chunkOverlap,
        separators: cfg.separators,
      });

  return docs.map((d) => {
    d.metadata.strategy = resolved;
    d.metadata.strategyChunkSize = cfg.chunkSize;
    return d;
  });
}

/**
 * Multi-strategy entry: split by hierarchy sections, then apply per-section strategy.
 */
export async function chunkWithStrategies(
  text: string,
  sourcePage?: number,
): Promise<Document[]> {
  const { parseHierarchy } = await import("./pdfHierarchy.js");
  const sections = parseHierarchy(text);
  if (sections.length <= 1) {
    return chunkByStrategy(text, undefined, sourcePage);
  }

  const all: Document[] = [];
  for (const sec of sections) {
    const strategy = getStrategyForText(sec.content);
    const chunks = await chunkByStrategy(sec.content, strategy, sourcePage);
    for (const c of chunks) {
      c.metadata.heading = sec.heading;
      c.metadata.headingLevel = sec.headingLevel;
      c.metadata.sectionType = sec.sectionType;
      all.push(c);
    }
  }

  return all.map((d, i) => {
    d.metadata.chunkIndex = i;
    d.metadata.totalChunks = all.length;
    return d;
  });
}

export const ALL_STRATEGIES: ChunkStrategy[] = [
  "lab_result",
  "prescription",
  "discharge_summary",
  "consultation",
  "imaging",
  "generic",
];

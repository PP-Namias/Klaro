import { RunnableConfig } from '@langchain/core/runnables';
import { StateGraph, START, END } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';

import { IndexStateAnnotation } from './state.js';
import {
  IndexConfigurationAnnotation,
  ensureIndexConfiguration,
} from './configuration.js';
import { makeRetriever } from '../shared/retrieval.js';
import { parsePdf } from '../services/pdfProcessor.js';
import { chunkPages, chunkText } from '../shared/chunker.js';
import { processDocument } from '../shared/ocr.js';

async function validateDocument(
  state: typeof IndexStateAnnotation.State,
): Promise<{ docs: Document[] }> {
  if (!state.docs || state.docs.length === 0) {
    throw new Error('No documents provided for ingestion');
  }

  const validated = state.docs.filter((doc) => {
    const content = doc.pageContent?.trim();
    return content && content.length > 0;
  });

  if (validated.length === 0) {
    throw new Error('All documents are empty — nothing to ingest');
  }

  return { docs: validated };
}

async function parsePdfNode(
  state: typeof IndexStateAnnotation.State,
): Promise<{ docs: Document[] }> {
  const parsed: Document[] = [];

  for (const doc of state.docs) {
    const buffer = doc.metadata?.buffer as Buffer | undefined;

    if (buffer) {
      const result = await parsePdf(buffer);
      const chunks = await chunkPages(result.pages);

      for (const chunk of chunks) {
        parsed.push(
          new Document({
            pageContent: chunk.pageContent,
            metadata: {
              ...chunk.metadata,
              sourceFile: doc.metadata?.sourceFile,
              uuid: crypto.randomUUID(),
            },
          }),
        );
      }
    } else {
      const text = doc.pageContent;
      const ocrCheck = await processDocument(
        Buffer.from(''),
        text,
      );

      if (ocrCheck.source === 'embedded' || text.length > 100) {
        parsed.push(doc);
      } else {
        throw new Error(
          `Document has insufficient extractable text — may be a scanned image without OCR pass`,
        );
      }
    }
  }

  return { docs: parsed };
}

async function chunkDocumentNode(
  state: typeof IndexStateAnnotation.State,
): Promise<{ docs: Document[] }> {
  const chunked: Document[] = [];

  for (const doc of state.docs) {
    const text = doc.pageContent;
    if (text.length > parseInt(process.env.CHUNK_SIZE ?? '1000', 10)) {
      const chunks = await chunkText(text);
      chunked.push(...chunks);
    } else {
      chunked.push(doc);
    }
  }

  return { docs: chunked };
}

async function embedAndStore(
  state: typeof IndexStateAnnotation.State,
  config?: RunnableConfig,
): Promise<{ docs: 'delete' }> {
  const retriever = await makeRetriever(config);
  await retriever.addDocuments(state.docs);

  const docCount = state.docs.length;
  console.log(
    `[ai-sidecar] Indexed ${docCount} document chunk(s) successfully`,
  );

  return { docs: 'delete' };
}

const builder = new StateGraph(
  IndexStateAnnotation,
  IndexConfigurationAnnotation,
)
  .addNode('validateDocument', validateDocument)
  .addNode('parsePdf', parsePdfNode)
  .addNode('chunkDocument', chunkDocumentNode)
  .addNode('embedAndStore', embedAndStore)
  .addEdge(START, 'validateDocument')
  .addEdge('validateDocument', 'parsePdf')
  .addEdge('parsePdf', 'chunkDocument')
  .addEdge('chunkDocument', 'embedAndStore')
  .addEdge('embedAndStore', END);

export const graph = builder
  .compile()
  .withConfig({ runName: 'IngestionGraph' });

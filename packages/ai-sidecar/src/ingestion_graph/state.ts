import { Annotation } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';
import { reduceDocs } from '../shared/state.js';

export const IndexStateAnnotation = Annotation.Root({
  docs: Annotation<
    Document[],
    | Document[]
    | Record<string, unknown>[]
    | string[]
    | string
    | 'delete'
  >({
    default: () => [],
    reducer: reduceDocs,
  }),
});

export type IndexState = typeof IndexStateAnnotation.State;

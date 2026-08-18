import type { Document } from "@langchain/core/documents";
import { Annotation } from "@langchain/langgraph";

import { reduceDocs } from "../shared/state.js";

export const IndexStateAnnotation = Annotation.Root({
  docs: Annotation<
    Document[],
    Document[] | Record<string, unknown>[] | string[] | string
  >({
    default: () => [],
    reducer: reduceDocs,
  }),
  docCount: Annotation<number>({
    default: () => 0,
    reducer: (prev, next) => next,
  }),
});

export type IndexState = typeof IndexStateAnnotation.State;

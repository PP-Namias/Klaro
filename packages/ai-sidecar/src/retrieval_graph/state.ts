import { Document } from "@langchain/core/documents";
import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

import { reduceDocs } from "../shared/state.js";

export const RetrievalStateAnnotation = Annotation.Root({
  question: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (prev, next) => {
      return [...prev, ...(Array.isArray(next) ? next : [next])];
    },
  }),
  docs: Annotation<
    Document[],
    Document[] | Record<string, unknown>[] | string[] | string | "delete"
  >({
    default: () => [],
    reducer: reduceDocs,
  }),
  answer: Annotation<string>,
  followUpQuestions: Annotation<string[]>({
    default: () => [],
    reducer: (prev, next) => next,
  }),
});

export type RetrievalState = typeof RetrievalStateAnnotation.State;

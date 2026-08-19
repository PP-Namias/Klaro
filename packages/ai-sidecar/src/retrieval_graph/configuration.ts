import { Annotation } from "@langchain/langgraph";

import { BaseConfigurationAnnotation } from "../shared/configuration.js";

export const RetrievalConfigurationAnnotation = Annotation.Root({
  ...BaseConfigurationAnnotation.spec,
  model: Annotation<string>,
  temperature: Annotation<number>,
  maxRetrievedDocs: Annotation<number>,
  includeFollowUps: Annotation<boolean>,
});

export type RetrievalConfiguration =
  typeof RetrievalConfigurationAnnotation.State;

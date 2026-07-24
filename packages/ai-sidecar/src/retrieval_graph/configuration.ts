import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";

import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
} from "../shared/configuration.js";

export const RetrievalConfigurationAnnotation = Annotation.Root({
  ...BaseConfigurationAnnotation.spec,
  model: Annotation<string>,
  temperature: Annotation<number>,
  maxRetrievedDocs: Annotation<number>,
  includeFollowUps: Annotation<boolean>,
});

export type RetrievalConfiguration =
  typeof RetrievalConfigurationAnnotation.State;

export function ensureRetrievalConfiguration(
  config: RunnableConfig,
): RetrievalConfiguration {
  const c = (config?.configurable ?? {}) as Partial<RetrievalConfiguration>;
  const base = ensureBaseConfiguration(config);

  return {
    ...base,
    model: c.model ?? process.env.LLM_PROVIDER ?? "openai",
    temperature:
      c.temperature ?? parseFloat(process.env.LLM_TEMPERATURE ?? "0.3"),
    maxRetrievedDocs:
      c.maxRetrievedDocs ?? parseInt(process.env.MAX_RETRIEVED_DOCS ?? "5", 10),
    includeFollowUps: c.includeFollowUps ?? true,
  };
}

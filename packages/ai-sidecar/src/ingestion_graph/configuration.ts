import type { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";

import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
} from "../shared/configuration.js";

export const IndexConfigurationAnnotation = Annotation.Root({
  ...BaseConfigurationAnnotation.spec,
  docsFile: Annotation<string>,
  useSampleDocs: Annotation<boolean>,
});

export type IndexConfiguration = typeof IndexConfigurationAnnotation.State;

export function ensureIndexConfiguration(
  config: RunnableConfig,
): IndexConfiguration {
  const configurable = (config?.configurable ??
    {}) as Partial<IndexConfiguration>;
  const baseConfig = ensureBaseConfiguration(config);

  return {
    ...baseConfig,
    docsFile: configurable.docsFile ?? "./src/sample_docs.json",
    useSampleDocs: configurable.useSampleDocs ?? false,
  };
}

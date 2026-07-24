import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";

export type RetrieverProvider = "chroma" | "supabase";

export const BaseConfigurationAnnotation = Annotation.Root({
  retrieverProvider: Annotation<RetrieverProvider>,
  filterKwargs: Annotation<Record<string, unknown>>,
  k: Annotation<number>,
});

export type BaseConfiguration = typeof BaseConfigurationAnnotation.State;

export function ensureBaseConfiguration(
  config?: RunnableConfig,
): BaseConfiguration {
  const configurable = (config?.configurable ??
    {}) as Partial<BaseConfiguration>;

  return {
    retrieverProvider: (configurable.retrieverProvider ??
      process.env.VECTOR_STORE_PROVIDER ??
      "chroma") as RetrieverProvider,
    filterKwargs: configurable.filterKwargs ?? {},
    k: configurable.k ?? parseInt(process.env.K_RETRIEVAL ?? "5", 10),
  };
}

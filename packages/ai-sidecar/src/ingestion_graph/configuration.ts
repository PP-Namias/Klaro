import { Annotation } from "@langchain/langgraph";

import { BaseConfigurationAnnotation } from "../shared/configuration.js";

export const IndexConfigurationAnnotation = Annotation.Root({
  ...BaseConfigurationAnnotation.spec,
  docsFile: Annotation<string>,
  useSampleDocs: Annotation<boolean>,
});

export type IndexConfiguration = typeof IndexConfigurationAnnotation.State;

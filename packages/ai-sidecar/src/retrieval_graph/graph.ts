import { Document } from "@langchain/core/documents";
import { RunnableConfig } from "@langchain/core/runnables";
import { END, START, StateGraph } from "@langchain/langgraph";

import { RetrievalConfigurationAnnotation } from "./configuration.js";
import { RetrievalStateAnnotation } from "./state.js";
import {
  generateAnswer,
  generateFollowUpQuestions,
  retrieveDocs,
} from "./utils.js";

async function retrieve(
  state: typeof RetrievalStateAnnotation.State,
  config?: RunnableConfig,
): Promise<{ docs: Document[] }> {
  const docs = await retrieveDocs(state.question, config);
  return { docs };
}

function decide(
  state: typeof RetrievalStateAnnotation.State,
): "generate" | "emptyAnswer" {
  if (!state.docs || state.docs.length === 0) {
    return "emptyAnswer";
  }
  return "generate";
}

async function generate(
  state: typeof RetrievalStateAnnotation.State,
  config?: RunnableConfig,
): Promise<{ answer: string; messages: any[] }> {
  const answer = await generateAnswer(
    state.question,
    state.docs,
    state.messages,
    config,
  );
  const aiMessage = { role: "assistant", content: answer };
  return {
    answer,
    messages: [aiMessage],
  };
}

async function emptyAnswer(
  state: typeof RetrievalStateAnnotation.State,
  config?: RunnableConfig,
): Promise<{ answer: string; messages: any[] }> {
  const answer = await generateAnswer(
    state.question,
    [],
    state.messages,
    config,
  );
  const aiMessage = { role: "assistant", content: answer };
  return {
    answer,
    messages: [aiMessage],
  };
}

async function followUp(
  state: typeof RetrievalStateAnnotation.State,
  config?: RunnableConfig,
): Promise<{ followUpQuestions: string[] }> {
  const questions = await generateFollowUpQuestions(state.messages, config);
  return { followUpQuestions: questions };
}

const builder = new StateGraph(
  RetrievalStateAnnotation,
  RetrievalConfigurationAnnotation,
)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addNode("emptyAnswer", emptyAnswer)
  .addNode("followUp", followUp)
  .addEdge(START, "retrieve")
  .addConditionalEdges("retrieve", decide, {
    generate: "generate",
    emptyAnswer: "emptyAnswer",
  })
  .addEdge("generate", "followUp")
  .addEdge("emptyAnswer", "followUp")
  .addEdge("followUp", END);

export const graph = builder
  .compile()
  .withConfig({ runName: "RetrievalGraph" });

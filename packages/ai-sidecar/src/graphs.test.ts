import { describe, expect, it } from "vitest";

import { graph as ingestionGraph } from "./ingestion_graph/graph.js";
import { graph as retrievalGraph } from "./retrieval_graph/graph.js";

describe("IngestionGraph", () => {
  it("compiles and exports a runnable graph", () => {
    expect(ingestionGraph).toBeDefined();
  });
});

describe("RetrievalGraph", () => {
  it("compiles and exports a runnable graph", () => {
    expect(retrievalGraph).toBeDefined();
  });
});

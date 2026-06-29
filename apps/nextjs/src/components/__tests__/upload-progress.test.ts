import { describe, it, expect } from "vitest";

import type { UploadStage } from "../upload-progress";

describe("UploadProgress", () => {
  it("exports UploadStage type", () => {
    const stages: UploadStage[] = [
      "idle",
      "validating",
      "uploading",
      "processing",
      "complete",
      "error",
    ];
    expect(stages).toHaveLength(6);
  });

  it("idle stage is initial state", () => {
    const stage: UploadStage = "idle";
    expect(stage).toBe("idle");
  });

  it("complete stage indicates success", () => {
    const stage: UploadStage = "complete";
    expect(stage).toBe("complete");
  });

  it("error stage indicates failure", () => {
    const stage: UploadStage = "error";
    expect(stage).toBe("error");
  });

  it("validating stage is part of upload flow", () => {
    const activeStages: UploadStage[] = ["validating", "uploading", "processing"];
    expect(activeStages).toContain("validating");
    expect(activeStages).toContain("uploading");
    expect(activeStages).toContain("processing");
  });

  it("stage labels map has all stages", () => {
    const stageLabels: Record<UploadStage, string> = {
      idle: "",
      validating: "Validating file...",
      uploading: "Uploading...",
      processing: "Processing scan...",
      complete: "Upload complete",
      error: "Upload failed",
    };
    expect(Object.keys(stageLabels)).toHaveLength(6);
    expect(stageLabels.validating).toBeTruthy();
    expect(stageLabels.uploading).toBeTruthy();
    expect(stageLabels.processing).toBeTruthy();
    expect(stageLabels.complete).toBeTruthy();
    expect(stageLabels.error).toBeTruthy();
  });
});

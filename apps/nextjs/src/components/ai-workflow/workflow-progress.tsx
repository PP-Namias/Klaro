"use client";

export type WorkflowStage =
  | "idle"
  | "uploading"
  | "ocr"
  | "extraction"
  | "analysis"
  | "completed"
  | "error";

interface WorkflowProgressProps {
  stage: WorkflowStage;
  progress?: number;
  error?: string;
  processingTimeMs?: number;
}

const stages: { key: WorkflowStage; label: string; icon: string }[] = [
  { key: "uploading", label: "Uploading", icon: "📤" },
  { key: "ocr", label: "OCR Processing", icon: "🔍" },
  { key: "extraction", label: "Data Extraction", icon: "📊" },
  { key: "analysis", label: "AI Analysis", icon: "🧠" },
  { key: "completed", label: "Complete", icon: "✅" },
];

const stageOrder: WorkflowStage[] = [
  "idle",
  "uploading",
  "ocr",
  "extraction",
  "analysis",
  "completed",
  "error",
];

function getStageIndex(stage: WorkflowStage): number {
  return stageOrder.indexOf(stage);
}

export function WorkflowProgress({
  stage,
  progress,
  error,
  processingTimeMs,
}: WorkflowProgressProps) {
  const currentIndex = getStageIndex(stage);
  const isError = stage === "error";

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      {/* Progress Bar */}
      {!isError && stage !== "idle" && (
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              height: "8px",
              backgroundColor: "#e2e8f0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress ?? (currentIndex / (stages.length - 1)) * 100}%`,
                backgroundColor: "#2563eb",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          {processingTimeMs && (
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.8rem",
                color: "#666",
                textAlign: "center",
              }}
            >
              Processing time: {(processingTimeMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}

      {/* Stage Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        {stages.map((s, _index) => {
          const isActive = s.key === stage;
          const isComplete = currentIndex > getStageIndex(s.key);
          const isPending = currentIndex < getStageIndex(s.key);

          return (
            <div
              key={s.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                opacity: isPending ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  backgroundColor: isActive
                    ? "#dbeafe"
                    : isComplete
                      ? "#dcfce7"
                      : "#f1f5f9",
                  border: `2px solid ${
                    isActive ? "#2563eb" : isComplete ? "#22c55e" : "#e2e8f0"
                  }`,
                  marginBottom: "0.5rem",
                  transition: "all 0.3s",
                }}
              >
                {isComplete ? "✓" : s.icon}
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textAlign: "center",
                  color: isActive ? "#2563eb" : isComplete ? "#16a34a" : "#666",
                  fontWeight: isActive ? "600" : "normal",
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Message */}
      <div style={{ textAlign: "center" }}>
        {isError ? (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
            }}
          >
            <p style={{ margin: 0, color: "#991b1b", fontWeight: "600" }}>
              Processing Error
            </p>
            <p style={{ margin: "0.5rem 0 0 0", color: "#991b1b" }}>
              {error || "An error occurred while processing your document."}
            </p>
          </div>
        ) : stage === "completed" ? (
          <p style={{ color: "#16a34a", fontWeight: "600" }}>
            Analysis complete! Review your results below.
          </p>
        ) : stage !== "idle" ? (
          <div>
            <p style={{ margin: 0, color: "#2563eb", fontWeight: "500" }}>
              {getStageMessage(stage)}
            </p>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.875rem",
                color: "#666",
              }}
            >
              This may take a few moments...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getStageMessage(stage: WorkflowStage): string {
  const messages: Record<WorkflowStage, string> = {
    idle: "Ready to process",
    uploading: "Uploading your document...",
    ocr: "Extracting text from document...",
    extraction: "Identifying medical test values...",
    analysis: "Generating plain language explanation...",
    completed: "Analysis complete!",
    error: "An error occurred",
  };
  return messages[stage] || "Processing...";
}

export default WorkflowProgress;

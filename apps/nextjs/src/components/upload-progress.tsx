"use client";

import React from "react";
import { Check, Loader2, AlertCircle, Scan, Brain, FileText } from "lucide-react";

import styles from "./upload-progress.module.css";

type UploadStage = "idle" | "validating" | "uploading" | "processing" | "complete" | "error";

interface UploadProgressProps {
  stage: UploadStage;
  progress?: number;
  error?: string;
  className?: string;
}

const stageLabels: Record<UploadStage, string> = {
  idle: "",
  validating: "Validating file...",
  uploading: "Uploading...",
  processing: "Processing scan...",
  complete: "Upload complete",
  error: "Upload failed",
};

const stageIcons: Record<UploadStage, React.ReactNode> = {
  idle: null,
  validating: <Loader2 size={14} className={styles.spinner} />,
  uploading: <Loader2 size={14} className={styles.spinner} />,
  processing: <Loader2 size={14} className={styles.spinner} />,
  complete: <Check size={14} />,
  error: <AlertCircle size={14} />,
};

const pipelineStages = [
  { key: "ocr", label: "Checking document clarity", icon: <Scan size={16} /> },
  { key: "gemini", label: "Reading with Gemini", icon: <Brain size={16} /> },
  { key: "simplify", label: "Simplifying for you", icon: <FileText size={16} /> },
  { key: "done", label: "Analysis complete", icon: <Check size={16} /> },
];

export function UploadProgress({ stage, progress = 0, error, className }: UploadProgressProps) {
  if (stage === "idle") return null;

  const isActive = stage === "validating" || stage === "uploading" || stage === "processing";
  const isComplete = stage === "complete";
  const isError = stage === "error";

  const currentPipelineStep = stage === "validating" ? -1
    : stage === "uploading" ? 0
    : stage === "processing" ? 1
    : stage === "complete" ? 3
    : -1;

  return (
    <div
      className={`${styles.progressContainer} ${isComplete ? styles.complete : ""} ${isError ? styles.error : ""} ${className ?? ""}`}
    >
      <div className={styles.progressHeader}>
        <span className={styles.progressIcon}>{stageIcons[stage]}</span>
        <span className={styles.progressLabel}>
          {isError ? error || stageLabels[stage] : stageLabels[stage]}
        </span>
        {isActive && (
          <span className={styles.progressPercent}>{Math.round(progress)}%</span>
        )}
      </div>

      {(stage === "uploading" || stage === "processing" || stage === "complete") && (
        <div style={{ marginTop: "1rem" }}>
          {pipelineStages.map((ps, idx) => {
            const isPast = currentPipelineStep > idx;
            const isCurrent = currentPipelineStep === idx;
            const isPending = currentPipelineStep < idx;

            return (
              <div
                key={ps.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.4rem 0",
                  opacity: isPending ? 0.4 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isPast ? "#22c55e" : isCurrent ? "#3b82f6" : "#e5e7eb",
                    color: isPast || isCurrent ? "#fff" : "#9ca3af",
                    fontSize: "12px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isPast ? <Check size={14} /> : ps.icon}
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: isCurrent ? 600 : 400,
                    color: isPast ? "#16a34a" : isCurrent ? "#1e40af" : "#6b7280",
                  }}
                >
                  {ps.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isActive && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export type { UploadProgressProps, UploadStage };

"use client";

import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

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

export function UploadProgress({ stage, progress = 0, error, className }: UploadProgressProps) {
  if (stage === "idle") return null;

  const isActive = stage === "validating" || stage === "uploading" || stage === "processing";
  const isComplete = stage === "complete";
  const isError = stage === "error";

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

"use client";

import type React from "react";
import { useRef, useState } from "react";

import { Button } from "@klaro/ui/button";

import type { WorkflowStage } from "./workflow-progress";
import { WorkflowProgress } from "./workflow-progress";

interface SelectedFile {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
}

interface EnhancedUploadProps {
  onUploadComplete?: (requestId: string) => void;
  onError?: (error: string) => void;
  language?: "Filipino" | "English";
}

const maxFileSize = 50 * 1024 * 1024; // 50MB
const acceptedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function EnhancedUpload({
  onUploadComplete,
  onError,
  language: _language = "English",
}: EnhancedUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("idle");
  const [progress, setProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | undefined>();

  const isProcessing =
    workflowStage !== "idle" &&
    workflowStage !== "completed" &&
    workflowStage !== "error";

  const selectFile = (file: File) => {
    if (!acceptedTypes.has(file.type)) {
      setError("File type not supported. Please use PNG, JPG, or PDF.");
      setSelected(null);
      setWorkflowStage("error");
      return;
    }

    if (file.size > maxFileSize) {
      setError("File size must be under 50 MB.");
      setSelected(null);
      setWorkflowStage("error");
      return;
    }

    let previewUrl: string | undefined;
    let kind: "image" | "pdf";

    if (file.type === "application/pdf") {
      kind = "pdf";
    } else {
      kind = "image";
      previewUrl = URL.createObjectURL(file);
    }

    setError(null);
    setSelected({ file, previewUrl, kind });
    setWorkflowStage("idle");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) selectFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!selected) {
      setError("Please select a file to scan.");
      setWorkflowStage("error");
      return;
    }

    const startTime = Date.now();
    setWorkflowStage("uploading");
    setProgress(0);
    setError(null);

    try {
      // Stage 1: Upload
      setProgress(10);
      const _base64 = await fileToBase64(selected.file);

      // Stage 2: OCR
      setWorkflowStage("ocr");
      setProgress(30);

      // Stage 3: Extraction
      setWorkflowStage("extraction");
      setProgress(50);

      // Stage 4: Analysis
      setWorkflowStage("analysis");
      setProgress(70);

      // Simulate API call (in real implementation, this would call the backend)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Stage 5: Complete
      setWorkflowStage("completed");
      setProgress(100);
      setProcessingTime(Date.now() - startTime);

      // Call callback with mock requestId
      const requestId = `scan-${Date.now()}`;
      onUploadComplete?.(requestId);
    } catch (err) {
      setWorkflowStage("error");
      const msg = err instanceof Error ? err.message : "Failed to process file";
      setError(msg);
      onError?.(msg);
    }
  };

  const clearSelection = () => {
    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
    }
    setSelected(null);
    setError(null);
    setWorkflowStage("idle");
    setProgress(0);
    setProcessingTime(undefined);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "1.5rem",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Workflow Progress */}
      {(workflowStage !== "idle" || error) && (
        <WorkflowProgress
          stage={workflowStage}
          progress={progress}
          error={error ?? undefined}
          processingTimeMs={processingTime}
        />
      )}

      {/* Drop Zone */}
      {!isProcessing && (
        <div
          style={{
            padding: "2rem",
            border: isDragging ? "2px dashed #2563eb" : "2px dashed #cbd5e1",
            borderRadius: "12px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
            transition: "all 0.2s",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {isDragging ? "📥" : "📄"}
          </div>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "500" }}>
            {isDragging
              ? "Drop your file here"
              : "Drag & drop your medical document"}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
            or click to browse
          </p>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "0.75rem",
              color: "#999",
            }}
          >
            Supports PNG, JPG, PDF (max 50MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* File Preview */}
      {selected && !isProcessing && (
        <div
          style={{
            padding: "1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            backgroundColor: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span style={{ fontSize: "1.5rem" }}>
                {selected.kind === "pdf" ? "📄" : "🖼️"}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: "500", fontSize: "0.9rem" }}>
                  {selected.file.name}
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
                  {formatBytes(selected.file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.25rem",
                color: "#999",
              }}
            >
              ×
            </button>
          </div>

          {selected.kind === "image" && selected.previewUrl && (
            <img
              src={selected.previewUrl}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "contain",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              }}
            />
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            style={{
              width: "100%",
              backgroundColor: "#2563eb",
              color: "white",
            }}
          >
            Process with AI
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && workflowStage === "error" && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0, color: "#991b1b" }}>{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={clearSelection}
            style={{ marginTop: "0.75rem" }}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default EnhancedUpload;

"use client";

import { AlertCircle, FileWarning, X } from "lucide-react";

interface UploadError {
  /** Stable queue id. Two picked files can share a name, so retries key on this. */
  id: string;
  fileName: string;
  message: string;
  type: "type" | "size" | "corrupt" | "encrypted" | "network" | "processing";
}

interface UploadErrorProps {
  errors: UploadError[];
  onDismiss: (index: number) => void;
  onRetry?: (fileId: string) => void;
}

const errorIcons = {
  type: FileWarning,
  size: AlertCircle,
  corrupt: FileWarning,
  encrypted: FileWarning,
  network: AlertCircle,
  processing: AlertCircle,
};

const errorColor = {
  type: "#f59e0b",
  size: "#f59e0b",
  corrupt: "#ef4444",
  encrypted: "#ef4444",
  network: "#ef4444",
  processing: "#f59e0b",
};

export function UploadError({ errors, onDismiss, onRetry }: UploadErrorProps) {
  if (errors.length === 0) return null;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 12,
      }}
    >
      {errors.map((err, i) => {
        const Icon = errorIcons[err.type];
        const color = errorColor[err.type];
        return (
          <div
            key={err.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: "0.85rem",
              fontFamily: "var(--font-geist)",
            }}
          >
            <Icon size={18} color={color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontWeight: 500, color: "#1a1a1a", marginBottom: 2 }}
              >
                {err.fileName}
              </div>
              <div style={{ color: "#666", lineHeight: 1.4 }}>
                {err.message}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {onRetry && err.type === "network" && (
                <button
                  onClick={() => onRetry(err.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #fecaca",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "#ef4444",
                    fontFamily: "var(--font-geist)",
                  }}
                  type="button"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => onDismiss(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  padding: 4,
                }}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { UploadError as UploadErrorItem };

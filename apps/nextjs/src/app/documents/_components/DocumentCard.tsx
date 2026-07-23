"use client";

import { FileText, Image as ImageIcon, Trash2, Eye } from "lucide-react";

export interface DocumentCardProps {
  id: string;
  fileName: string;
  fileType: string;
  status: "uploaded" | "processing" | "analyzed" | "failed";
  createdAt: string;
  thumbnailUrl?: string;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  uploaded: { label: "Uploaded", color: "#f59e0b", bg: "#fffbeb" },
  processing: { label: "Processing", color: "#6366f1", bg: "#eef2ff" },
  analyzed: { label: "Analyzed", color: "#22c55e", bg: "#f0fdf4" },
  failed: { label: "Failed", color: "#ef4444", bg: "#fef2f2" },
};

export function DocumentCard({
  id,
  fileName,
  fileType,
  status,
  createdAt,
  thumbnailUrl,
  onView,
  onDelete,
}: DocumentCardProps) {
  const statusCfg = statusConfig[status] ?? statusConfig.uploaded;

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#fff",
        overflow: "hidden",
        fontFamily: "var(--font-geist)",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          height: 140,
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={fileName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : fileType.startsWith("image") ? (
          <ImageIcon size={40} color="#d1d5db" />
        ) : (
          <FileText size={40} color="#d1d5db" />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 500,
            color: "#1a1a1a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 8,
          }}
        >
          {fileName}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: "0.7rem",
              fontWeight: 500,
              background: statusCfg.bg,
              color: statusCfg.color,
            }}
          >
            {statusCfg.label}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#999" }}>
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onView(id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              fontFamily: "var(--font-geist)",
            }}
            type="button"
          >
            <Eye size={14} /> View
          </button>
          <button
            onClick={() => onDelete(id)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
            }}
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

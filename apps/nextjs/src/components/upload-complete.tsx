"use client";

import { Check, FileText, Image as ImageIcon, Eye } from "lucide-react";

interface UploadCompleteItem {
  fileName: string;
  fileType: "image" | "pdf";
  fileSize: number;
  thumbnailUrl?: string;
  analysisId: string;
}

interface UploadCompleteProps {
  items: UploadCompleteItem[];
  onViewAnalysis: (analysisId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadComplete({ items, onViewAnalysis }: UploadCompleteProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {items.map((item) => (
        <div
          key={item.analysisId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 12,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontFamily: "var(--font-geist)",
          }}
        >
          {/* Thumbnail / Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              overflow: "hidden",
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.fileName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : item.fileType === "pdf" ? (
              <FileText size={22} color="#16a34a" />
            ) : (
              <ImageIcon size={22} color="#16a34a" />
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                color: "#166534",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.fileName}
            </div>
            <div style={{ color: "#16a34a", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} />
              <span>Uploaded successfully &middot; {formatBytes(item.fileSize)}</span>
            </div>
          </div>

          {/* View Analysis CTA */}
          <button
            onClick={() => onViewAnalysis(item.analysisId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#166534",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              fontFamily: "var(--font-geist)",
              whiteSpace: "nowrap",
            }}
            type="button"
          >
            <Eye size={16} />
            View Analysis
          </button>
        </div>
      ))}
    </div>
  );
}

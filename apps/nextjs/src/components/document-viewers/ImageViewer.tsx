"use client";

import { useState } from "react";

import { highlightCitations, type Citation } from "./citationHighlight";

interface ImageViewerProps {
  src: string;
  fileName?: string;
  text?: string;
  citations?: Citation[];
  onTextSelect?: (selected: string) => void;
  annotations?: { id: string; x: number; y: number; label: string }[];
  onAnnotate?: (x: number, y: number) => void;
}

export function ImageViewer({ src, fileName, text, citations = [], onTextSelect, annotations = [], onAnnotate }: ImageViewerProps) {
  const [zoom] = useState(1);
  const handleSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && onTextSelect) onTextSelect(sel);
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff" }}>
      <div
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "0.875rem",
          fontWeight: 500,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{fileName ?? "Image"}</span>
        <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>Image • zoomable • annotatable</span>
      </div>

      <div
        style={{
          position: "relative",
          backgroundColor: "#111827",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
          cursor: onAnnotate ? "crosshair" : "default",
          overflow: "auto",
          maxHeight: "500px",
        }}
        onClick={(e) => {
          if (!onAnnotate) return;
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          onAnnotate(x, y);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={fileName ?? "Document image"}
          style={{
            maxWidth: "100%",
            maxHeight: "450px",
            objectFit: "contain",
            transform: `scale(${zoom})`,
            transformOrigin: "center",
            borderRadius: "4px",
          }}
        />
        {annotations.map((a) => (
          <span
            key={a.id}
            style={{
              position: "absolute",
              left: `${a.x}%`,
              top: `${a.y}%`,
              width: "10px",
              height: "10px",
              backgroundColor: "#ef4444",
              borderRadius: "50%",
              border: "2px solid #fff",
              transform: "translate(-50%, -50%)",
            }}
            title={a.label}
          />
        ))}
      </div>

      {text && (
        <div
          style={{
            padding: "1rem",
            maxHeight: "250px",
            overflow: "auto",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            userSelect: "text",
            whiteSpace: "pre-wrap",
            backgroundColor: "#fafafa",
            borderTop: "1px solid #e5e7eb",
          }}
          onMouseUp={handleSelection}
        >
          {citations.length ? highlightCitations(text, citations) : text}
        </div>
      )}
    </div>
  );
}

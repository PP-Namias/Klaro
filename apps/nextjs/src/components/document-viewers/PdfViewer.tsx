"use client";

import { useState } from "react";

import { highlightCitations, type Citation } from "./citationHighlight";

interface PdfViewerProps {
  url?: string;
  base64?: string;
  fileName?: string;
  text?: string;
  citations?: Citation[];
  onTextSelect?: (selected: string) => void;
}

export function PdfViewer({ url, base64, fileName, text, citations = [], onTextSelect }: PdfViewerProps) {
  const [pageScale] = useState(1);
  const src = url ?? (base64 ? `data:application/pdf;base64,${base64}` : undefined);

  const handleSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && onTextSelect) onTextSelect(sel);
  };

  if (!src && !text) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        No PDF content available
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
      onMouseUp={handleSelection}
    >
      <div
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "0.875rem",
          fontWeight: 500,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{fileName ?? "Document.pdf"}</span>
        <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>PDF • selectable text • {citations.length} citations</span>
      </div>

      {src && (
        <iframe
          src={src}
          title={fileName ?? "PDF preview"}
          style={{
            width: "100%",
            height: "500px",
            border: "none",
            transform: `scale(${pageScale})`,
            transformOrigin: "top left",
          }}
        />
      )}

      {text && (
        <div
          style={{
            padding: "1rem",
            maxHeight: "300px",
            overflow: "auto",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            userSelect: "text",
            whiteSpace: "pre-wrap",
            borderTop: src ? "1px solid #e5e7eb" : undefined,
            backgroundColor: "#fafafa",
          }}
        >
          {citations.length ? highlightCitations(text, citations) : text}
        </div>
      )}
    </div>
  );
}

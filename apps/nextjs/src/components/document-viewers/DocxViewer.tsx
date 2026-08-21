"use client";

import { highlightCitations, type Citation } from "./citationHighlight";

interface DocxViewerProps {
  text: string;
  fileName?: string;
  citations?: Citation[];
  onTextSelect?: (selected: string) => void;
}

export function DocxViewer({ text, fileName, citations = [], onTextSelect }: DocxViewerProps) {
  const handleSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && onTextSelect) onTextSelect(sel);
  };

  if (!text) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>No document text extracted</div>
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
          backgroundColor: "#f0f9ff",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "0.875rem",
          fontWeight: 500,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{fileName ?? "Document.docx"}</span>
        <span style={{ color: "#0369a1", fontSize: "0.75rem" }}>DOCX • selectable</span>
      </div>
      <div
        style={{
          padding: "1.5rem",
          maxHeight: "500px",
          overflow: "auto",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          userSelect: "text",
          whiteSpace: "pre-wrap",
          fontFamily: "Georgia, serif",
        }}
      >
        {citations.length ? highlightCitations(text, citations) : text}
      </div>
    </div>
  );
}

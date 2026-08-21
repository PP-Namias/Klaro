"use client";

import { highlightCitations, type Citation } from "./citationHighlight";

interface PptxViewerProps {
  text: string;
  fileName?: string;
  citations?: Citation[];
  onTextSelect?: (selected: string) => void;
}

export function PptxViewer({ text, fileName, citations = [], onTextSelect }: PptxViewerProps) {
  const slides = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && onTextSelect) onTextSelect(sel);
  };

  if (!slides.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>No slides extracted</div>
    );
  }

  return (
    <div
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff" }}
      onMouseUp={handleSelection}
    >
      <div
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#fef3c7",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "0.875rem",
          fontWeight: 500,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{fileName ?? "Presentation.pptx"}</span>
        <span style={{ color: "#92400e", fontSize: "0.75rem" }}>PPTX • {slides.length} slides</span>
      </div>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "500px", overflow: "auto" }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "1rem",
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              userSelect: "text",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: 600 }}>
              Slide {idx + 1}
            </div>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {citations.length ? highlightCitations(slide, citations) : slide}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

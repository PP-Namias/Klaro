"use client";

import { useState } from "react";

import { DocxViewer } from "./DocxViewer";
import { ImageViewer } from "./ImageViewer";
import { PdfViewer } from "./PdfViewer";
import { PptxViewer } from "./PptxViewer";
import type { Citation } from "./citationHighlight";

export type ViewerKind = "pdf" | "docx" | "pptx" | "image";

export interface DocumentViewerProps {
  kind: ViewerKind;
  fileName?: string;
  src?: string;
  base64?: string;
  text?: string;
  citations?: Citation[];
  annotations?: { id: string; x: number; y: number; label: string }[];
  onTextSelect?: (selected: string) => void;
  onAnnotate?: (x: number, y: number) => void;
}

export function DocumentViewer(props: DocumentViewerProps) {
  const [selectedText, setSelectedText] = useState<string>("");

  const handleSelect = (t: string) => {
    setSelectedText(t);
    props.onTextSelect?.(t);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {props.kind === "pdf" && (
        <PdfViewer
          url={props.src}
          base64={props.base64}
          fileName={props.fileName}
          text={props.text}
          citations={props.citations}
          onTextSelect={handleSelect}
        />
      )}
      {props.kind === "docx" && (
        <DocxViewer text={props.text ?? ""} fileName={props.fileName} citations={props.citations} onTextSelect={handleSelect} />
      )}
      {props.kind === "pptx" && (
        <PptxViewer text={props.text ?? ""} fileName={props.fileName} citations={props.citations} onTextSelect={handleSelect} />
      )}
      {props.kind === "image" && props.src && (
        <ImageViewer
          src={props.src}
          fileName={props.fileName}
          text={props.text}
          citations={props.citations}
          onTextSelect={handleSelect}
          annotations={props.annotations}
          onAnnotate={props.onAnnotate}
        />
      )}

      {selectedText && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            fontSize: "0.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#1e40af" }}>Selected: “{selectedText.slice(0, 120)}”</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(selectedText).catch(() => {});
            }}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "4px",
              border: "1px solid #93c5fd",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

export { PdfViewer, DocxViewer, PptxViewer, ImageViewer };

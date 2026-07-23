"use client";

import { Languages } from "lucide-react";

type Dialect = "English" | "Filipino" | "Bisaya" | "Ilocano";

interface PlainLanguageSummaryProps {
  summary: string;
  dialect: Dialect;
  onDialectChange: (dialect: Dialect) => void;
  title?: string;
}

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: "English", label: "EN" },
  { value: "Filipino", label: "FIL" },
  { value: "Bisaya", label: "BIS" },
  { value: "Ilocano", label: "ILO" },
];

export function PlainLanguageSummary({
  summary,
  dialect,
  onDialectChange,
  title = "What This Means",
}: PlainLanguageSummaryProps) {
  return (
    <div
      style={{
        width: "100%",
        fontFamily: "var(--font-geist)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Languages size={18} color="#6366f1" />
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {title}
          </h3>
        </div>

        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#f3f4f6",
            borderRadius: 8,
            padding: 2,
          }}
        >
          {DIALECTS.map((d) => (
            <button
              key={d.value}
              onClick={() => onDialectChange(d.value)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                border: "none",
                background: d.value === dialect ? "#fff" : "transparent",
                color: d.value === dialect ? "#6366f1" : "#666",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: d.value === dialect ? 600 : 400,
                fontFamily: "var(--font-geist)",
                boxShadow: d.value === dialect ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
              type="button"
              title={d.value}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "#f5f3ff",
          border: "1px solid #e0e7ff",
          fontSize: "0.9rem",
          lineHeight: 1.7,
          color: "#1a1a1a",
        }}
      >
        {summary}
      </div>
    </div>
  );
}

export type { Dialect };

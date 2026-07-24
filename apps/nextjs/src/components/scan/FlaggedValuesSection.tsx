"use client";

import { AlertTriangle } from "lucide-react";

import type { SeverityLevel } from "./SeverityIndicator";
import { SeverityIndicator } from "./SeverityIndicator";

interface FlaggedValue {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  severity: SeverityLevel;
  flag?: string;
}

interface FlaggedValuesSectionProps {
  values: FlaggedValue[];
  title?: string;
}

export function FlaggedValuesSection({
  values,
  title = "Flagged Values",
}: FlaggedValuesSectionProps) {
  if (values.length === 0) return null;

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
          gap: 8,
          marginBottom: 12,
        }}
      >
        <AlertTriangle size={18} color="#f59e0b" />
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
          flexDirection: "column",
          gap: 8,
        }}
      >
        {values.map((v, i) => (
          <div
            key={`${v.testName}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 10,
              background: "#fafafa",
              border: "1px solid #e5e7eb",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: "#1a1a1a",
                  marginBottom: 2,
                }}
              >
                {v.testName}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Value: <strong>{v.value}</strong> {v.unit ?? ""}
                </span>
                {v.referenceRange && (
                  <span>
                    Ref: <strong>{v.referenceRange}</strong>
                  </span>
                )}
              </div>
            </div>
            <SeverityIndicator level={v.severity} size="sm" showIcon={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

export type { FlaggedValue, SeverityLevel };

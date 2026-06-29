"use client";

import React from "react";

import type { LabResultsDemo } from "~/data/demo-lab-results";

interface DemoLabResultsProps {
  data: LabResultsDemo;
}

export function DemoLabResults({ data }: DemoLabResultsProps) {
  const flaggedCount = data.tests.filter((t) => t.flagged).length;
  const totalCount = data.tests.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Patient Info */}
      <div style={infoCardStyle}>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Patient:</span>
          <span style={infoValueStyle}>{data.patientName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Age/Sex:</span>
          <span style={infoValueStyle}>
            {data.patientAge} / {data.patientSex}
          </span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Facility:</span>
          <span style={infoValueStyle}>{data.facilityName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Physician:</span>
          <span style={infoValueStyle}>{data.physician}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Date:</span>
          <span style={infoValueStyle}>{data.dateReported}</span>
        </div>
      </div>

      {/* Urgency Badge */}
      <div style={urgencyBadgeStyle(data.urgency)}>
        <span style={{ fontWeight: 600 }}>
          {data.urgency === "HIGH"
            ? "MATAAS"
            : data.urgency === "MODERATE"
              ? "GITNA"
              : "MABABA"}
        </span>
        <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
          — {flaggedCount} ng {totalCount} tests ay hindi normal
        </span>
      </div>

      {/* Summary */}
      <div style={summaryStyle}>
        <h4 style={sectionTitleStyle}>Summary</h4>
        <p style={summaryTextStyle}>{data.summary}</p>
      </div>

      {/* Test Results Table */}
      <div>
        <h4 style={sectionTitleStyle}>Test Results</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.tests.map((test, i) => (
            <div key={i} style={testCardStyle(test.flagged)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, color: "#111", fontSize: "0.9rem" }}>
                  {test.name}
                </span>
                {test.flagged && <span style={flaggedBadgeStyle}>Hindi Normal</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: test.flagged ? "#dc2626" : "#16a34a" }}>
                  {test.value} {test.unit}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#999" }}>
                  Ref: {test.referenceRange}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#666", margin: "6px 0 0", lineHeight: 1.4 }}>
                {test.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div style={warningBoxStyle}>
          <h4 style={{ ...sectionTitleStyle, color: "#991b1b", marginBottom: 8 }}>Warnings</h4>
          {data.warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#dc2626", flexShrink: 0 }}>&#9888;</span>
              <span style={{ fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.4 }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div style={recommendationBoxStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>Recommendations</h4>
        {data.recommendations.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6", flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
            <span style={{ fontSize: "0.85rem", color: "#1e3a5f", lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Tanong Mo Sa Doktor */}
      <div style={tanongMoStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>
          Tanong Mo Sa Doktor
        </h4>
        <p style={{ fontSize: "0.8rem", color: "#666", margin: "0 0 8px" }}>
          Mga tanong na pwede mong itanong sa iyong doktor:
        </p>
        {data.tanongMoQuestions.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 12px", background: "#eff6ff", borderRadius: 8 }}>
            <span style={{ color: "#3b82f6", flexShrink: 0 }}>&#10067;</span>
            <span style={{ fontSize: "0.85rem", color: "#1e40af", lineHeight: 1.4 }}>{q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Styles
const infoCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  fontSize: "0.85rem",
};

const infoLabelStyle: React.CSSProperties = {
  color: "#6b7280",
  fontWeight: 500,
  minWidth: 80,
};

const infoValueStyle: React.CSSProperties = {
  color: "#111827",
};

const urgencyBadgeStyle = (urgency: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  fontFamily: "var(--font-geist)",
  fontSize: "0.9rem",
  color: "#ffffff",
  background:
    urgency === "HIGH"
      ? "#dc2626"
      : urgency === "MODERATE"
        ? "#d97706"
        : "#16a34a",
});

const summaryStyle: React.CSSProperties = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 12,
  padding: "12px 16px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "#111",
  margin: "0 0 8px",
};

const summaryTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "0.85rem",
  color: "#78350f",
  margin: 0,
  lineHeight: 1.5,
};

const testCardStyle = (flagged: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${flagged ? "#fecaca" : "#e5e7eb"}`,
  background: flagged ? "#fef2f2" : "#ffffff",
});

const flaggedBadgeStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "#dc2626",
  background: "#fee2e2",
  padding: "2px 8px",
  borderRadius: 12,
};

const warningBoxStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "12px 16px",
};

const recommendationBoxStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "12px 16px",
};

const tanongMoStyle: React.CSSProperties = {
  background: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: 12,
  padding: "12px 16px",
};

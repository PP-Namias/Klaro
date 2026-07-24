"use client";

import React from "react";

import type { DemoLanguage } from "~/components/demo-modal";
import type { OtherDocDemo } from "~/data/demo-other-docs";
import { ecgReportEnglish, otherDocEnglish } from "~/data/demo-english";
import { useLanguage } from "~/providers/language-provider";

interface DemoOtherDocProps {
  data: OtherDocDemo;
  language?: DemoLanguage;
}

export function DemoOtherDoc({ data, language = "tl" }: DemoOtherDocProps) {
  const { t } = useLanguage();
  const englishData = data.documentType.includes("ECG")
    ? ecgReportEnglish
    : otherDocEnglish;
  const d = language === "en" ? { ...data, ...englishData } : data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Document Type Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={docTypeBadgeStyle}>{d.documentType}</span>
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          Confidence: {Math.round(d.confidence * 100)}%
        </span>
      </div>

      {/* Patient Info */}
      <div style={infoCardStyle}>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Patient:</span>
          <span style={infoValueStyle}>{d.patientName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Age/Sex:</span>
          <span style={infoValueStyle}>
            {d.patientAge} / {d.patientSex}
          </span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Facility:</span>
          <span style={infoValueStyle}>{d.facilityName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Physician:</span>
          <span style={infoValueStyle}>{d.physician}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Date:</span>
          <span style={infoValueStyle}>{d.dateIssued}</span>
        </div>
      </div>

      {/* Urgency Badge */}
      <div style={urgencyBadgeStyle(d.urgency)}>
        <span style={{ fontWeight: 600 }}>
          {language === "tl"
            ? d.urgency === "HIGH"
              ? "MATAAS"
              : d.urgency === "MODERATE"
                ? "GITNA"
                : "MABABA"
            : d.urgency === "HIGH"
              ? "HIGH"
              : d.urgency === "MODERATE"
                ? "MODERATE"
                : "LOW"}
        </span>
      </div>

      {/* Summary */}
      <div style={summaryStyle}>
        <h4 style={sectionTitleStyle}>{t("results.section.summary")}</h4>
        <p style={summaryTextStyle}>{d.summary}</p>
      </div>

      {/* Extracted Fields */}
      <div>
        <h4 style={sectionTitleStyle}>{t("results.section.extractedData")}</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {d.extractedFields.map((field, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom:
                  i < d.extractedFields.length - 1
                    ? "1px solid #e5e7eb"
                    : "none",
                background: i % 2 === 0 ? "#f9fafb" : "#ffffff",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                {field.key}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#111827",
                  fontWeight: 500,
                  textAlign: "right",
                  maxWidth: "60%",
                }}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {d.warnings.length > 0 && (
        <div style={warningBoxStyle}>
          <h4
            style={{ ...sectionTitleStyle, color: "#991b1b", marginBottom: 8 }}
          >
            {t("results.section.warnings")}
          </h4>
          {d.warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#dc2626", flexShrink: 0 }}>&#9888;</span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#7f1d1d",
                  lineHeight: 1.4,
                }}
              >
                {w}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div style={recommendationBoxStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>
          {t("results.section.recommendations")}
        </h4>
        {d.recommendations.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6", flexShrink: 0, fontWeight: 600 }}>
              {i + 1}.
            </span>
            <span
              style={{ fontSize: "0.85rem", color: "#1e3a5f", lineHeight: 1.4 }}
            >
              {r}
            </span>
          </div>
        ))}
      </div>

      {/* Tanong Mo Sa Doktor */}
      <div style={tanongMoStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>
          {t("results.section.tanqmo")}
        </h4>
        {d.tanongMoQuestions.map((q, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 6,
              padding: "8px 12px",
              background: "#eff6ff",
              borderRadius: 8,
            }}
          >
            <span style={{ color: "#3b82f6", flexShrink: 0 }}>&#10067;</span>
            <span
              style={{ fontSize: "0.85rem", color: "#1e40af", lineHeight: 1.4 }}
            >
              {q}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Styles
const docTypeBadgeStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#ffffff",
  background: "#6366f1",
  padding: "5px 12px",
  borderRadius: 8,
};
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
const infoValueStyle: React.CSSProperties = { color: "#111827" };
const urgencyBadgeStyle = (urgency: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 8,
  fontFamily: "var(--font-geist)",
  fontSize: "0.85rem",
  color: "#ffffff",
  fontWeight: 600,
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

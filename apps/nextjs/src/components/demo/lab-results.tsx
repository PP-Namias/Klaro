"use client";

import React from "react";

import type { DemoLanguage } from "~/components/demo-modal";
import type { LabResultsDemo } from "~/data/demo-lab-results";
import { labResultsEnglish } from "~/data/demo-english";
import { useLanguage } from "~/providers/language-provider";

interface DemoLabResultsProps {
  data: LabResultsDemo;
  language?: DemoLanguage;
}

export function DemoLabResults({ data, language = "tl" }: DemoLabResultsProps) {
  const { t } = useLanguage();
  const d = language === "en" ? { ...data, ...labResultsEnglish } : data;
  const flaggedCount = d.tests.filter((t) => t.flagged).length;
  const totalCount = d.tests.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          <span style={infoValueStyle}>{d.dateReported}</span>
        </div>
      </div>

      {/* Urgency Badge */}
      <div style={urgencyBadgeStyle(d.urgency)}>
        <span style={{ fontWeight: 600 }}>
          {d.urgency === "HIGH"
            ? language === "tl"
              ? "MATAAS"
              : "HIGH"
            : d.urgency === "MODERATE"
              ? "MODERATE"
              : language === "tl"
                ? "MABABA"
                : "LOW"}
        </span>
        <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
          — {flaggedCount} {language === "tl" ? "ng" : "of"} {totalCount}{" "}
          {language === "tl" ? "tests ay hindi normal" : "tests are abnormal"}
        </span>
      </div>

      {/* Summary */}
      <div style={summaryStyle}>
        <h4 style={sectionTitleStyle}>{t("results.section.summary")}</h4>
        <p style={summaryTextStyle}>{d.summary}</p>
      </div>

      {/* Test Results Table */}
      <div>
        <h4 style={sectionTitleStyle}>{t("results.section.extractedData")}</h4>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {d.tests.map((test, i) => (
            <div key={i} style={testCardStyle(test.flagged)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontWeight: 500, color: "#111", fontSize: "0.9rem" }}
                >
                  {test.name}
                </span>
                {test.flagged && (
                  <span style={flaggedBadgeStyle}>
                    {language === "tl" ? "Hindi Normal" : "Abnormal"}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: test.flagged ? "#dc2626" : "#16a34a",
                  }}
                >
                  {test.value} {test.unit}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#999" }}>
                  Ref: {test.referenceRange}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  margin: "6px 0 0",
                  lineHeight: 1.4,
                }}
              >
                {test.interpretation}
              </p>
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
        <p style={{ fontSize: "0.8rem", color: "#666", margin: "0 0 8px" }}>
          {language === "tl"
            ? "Mga tanong na pwede mong itanong sa iyong doktor:"
            : "Questions you can ask your doctor:"}
        </p>
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

"use client";

import React from "react";

import type { DischargeDemo } from "~/data/demo-discharge";
import { dischargeEnglish } from "~/data/demo-english";
import type { DemoLanguage } from "~/components/demo-modal";

interface DemoDischargeProps {
  data: DischargeDemo;
  language?: DemoLanguage;
}

export function DemoDischarge({ data, language = "tl" }: DemoDischargeProps) {
  const d = language === "en" ? { ...data, ...dischargeEnglish } : data;
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
          <span style={infoValueStyle}>{d.patientAge} / {d.patientSex}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Facility:</span>
          <span style={infoValueStyle}>{d.facilityName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Physician:</span>
          <span style={infoValueStyle}>{d.admittingPhysician}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Department:</span>
          <span style={infoValueStyle}>{d.department}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Admitted:</span>
          <span style={infoValueStyle}>{d.dateAdmitted}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Discharged:</span>
          <span style={infoValueStyle}>{d.dateDischarged}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Stay:</span>
          <span style={{ ...infoValueStyle, fontWeight: 600 }}>{d.lengthOfStay}</span>
        </div>
      </div>

      {/* Diagnosis */}
      <div style={diagnosisStyle}>
        <h4 style={sectionTitleStyle}>Diagnosis</h4>
        <p style={diagnosisTextStyle}>{d.diagnosis}</p>
      </div>

      {/* Summary */}
      <div style={summaryStyle}>
        <h4 style={sectionTitleStyle}>Summary</h4>
        <p style={summaryTextStyle}>{d.summary}</p>
      </div>

      {/* Procedures */}
      <div>
        <h4 style={sectionTitleStyle}>Procedures</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {d.procedures.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 12px", background: "#f9fafb", borderRadius: 8 }}>
              <span style={{ color: "#6366f1", flexShrink: 0, fontWeight: 600, fontSize: "0.8rem" }}>{i + 1}.</span>
              <span style={{ fontSize: "0.85rem", color: "#374151" }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discharge Medications */}
      <div>
        <h4 style={sectionTitleStyle}>Discharge Medications</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {d.dischargeMedications.map((med, i) => (
            <div key={i} style={medCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#111", fontSize: "0.9rem" }}>{med.name}</span>
                <span style={dosageBadgeStyle}>{med.dosage}</span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: "0.8rem" }}>
                <span style={{ color: "#6b7280" }}>Frequency: <strong style={{ color: "#374151" }}>{med.frequency}</strong></span>
                <span style={{ color: "#6b7280" }}>Duration: <strong style={{ color: "#374151" }}>{med.duration}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Instructions */}
      <div style={followUpStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#166534", marginBottom: 8 }}>Follow-Up Instructions</h4>
        {d.followUpInstructions.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#16a34a", flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
            <span style={{ fontSize: "0.85rem", color: "#14532d", lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {d.warnings.length > 0 && (
        <div style={warningBoxStyle}>
          <h4 style={{ ...sectionTitleStyle, color: "#991b1b", marginBottom: 8 }}>Warnings</h4>
          {d.warnings.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#dc2626", flexShrink: 0 }}>&#9888;</span>
              <span style={{ fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.4 }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tanong Mo Sa Doktor */}
      <div style={tanongMoStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>Tanong Mo Sa Doktor</h4>
        {d.tanongMoQuestions.map((q, i) => (
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
  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4,
};
const infoRowStyle: React.CSSProperties = { display: "flex", gap: 8, fontSize: "0.85rem" };
const infoLabelStyle: React.CSSProperties = { color: "#6b7280", fontWeight: 500, minWidth: 90 };
const infoValueStyle: React.CSSProperties = { color: "#111827" };
const diagnosisStyle: React.CSSProperties = {
  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px",
};
const diagnosisTextStyle: React.CSSProperties = {
  fontSize: "0.9rem", color: "#7f1d1d", margin: 0, lineHeight: 1.5, fontWeight: 500,
};
const summaryStyle: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px",
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)", fontSize: "0.9rem", fontWeight: 600, color: "#111", margin: "0 0 8px",
};
const summaryTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)", fontSize: "0.85rem", color: "#78350f", margin: 0, lineHeight: 1.5,
};
const medCardStyle: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#ffffff",
};
const dosageBadgeStyle: React.CSSProperties = {
  fontSize: "0.75rem", fontWeight: 600, color: "#ffffff", background: "#6366f1",
  padding: "3px 8px", borderRadius: 6, flexShrink: 0,
};
const followUpStyle: React.CSSProperties = {
  background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px",
};
const warningBoxStyle: React.CSSProperties = {
  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px",
};
const tanongMoStyle: React.CSSProperties = {
  background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 16px",
};

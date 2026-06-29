"use client";

import React from "react";

import type { PrescriptionDemo } from "~/data/demo-prescriptions";

interface DemoPrescriptionProps {
  data: PrescriptionDemo;
}

export function DemoPrescription({ data }: DemoPrescriptionProps) {
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
          <span style={infoValueStyle}>{data.patientAge} / {data.patientSex}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Doctor:</span>
          <span style={infoValueStyle}>{data.physician} — {data.physicianSpecialty}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Facility:</span>
          <span style={infoValueStyle}>{data.facilityName}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Date:</span>
          <span style={infoValueStyle}>{data.dateIssued}</span>
        </div>
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Diagnosis:</span>
          <span style={{ ...infoValueStyle, fontWeight: 600 }}>{data.diagnosis}</span>
        </div>
      </div>

      {/* Summary */}
      <div style={summaryStyle}>
        <h4 style={sectionTitleStyle}>Summary</h4>
        <p style={summaryTextStyle}>{data.summary}</p>
      </div>

      {/* Medicines */}
      <div>
        <h4 style={sectionTitleStyle}>Mga Gamot (Medicines)</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.medicines.map((med, i) => (
            <div key={i} style={medicineCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", color: "#111" }}>{med.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{med.genericName}</div>
                </div>
                <span style={dosageBadgeStyle}>{med.dosage}</span>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={medInfoItemStyle}>
                  <span style={medInfoLabelStyle}>Frequency:</span>
                  <span style={medInfoValueStyle}>{med.frequency}</span>
                </div>
                <div style={medInfoItemStyle}>
                  <span style={medInfoLabelStyle}>Duration:</span>
                  <span style={medInfoValueStyle}>{med.duration}</span>
                </div>
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                <p style={{ fontSize: "0.8rem", color: "#166534", margin: 0, lineHeight: 1.4 }}>
                  <strong>Instructions:</strong> {med.instructions}
                </p>
              </div>

              {med.warnings.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {med.warnings.map((w, j) => (
                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ color: "#d97706", flexShrink: 0, fontSize: "0.8rem" }}>&#9888;</span>
                      <span style={{ fontSize: "0.78rem", color: "#92400e", lineHeight: 1.4 }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={recommendationBoxStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>Instructions</h4>
        {data.recommendations.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6", flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
            <span style={{ fontSize: "0.85rem", color: "#1e3a5f", lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Tanong Mo Sa Doktor */}
      <div style={tanongMoStyle}>
        <h4 style={{ ...sectionTitleStyle, color: "#1e40af", marginBottom: 8 }}>Tanong Mo Sa Doktor</h4>
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

// Shared styles
const infoCardStyle: React.CSSProperties = {
  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4,
};
const infoRowStyle: React.CSSProperties = { display: "flex", gap: 8, fontSize: "0.85rem" };
const infoLabelStyle: React.CSSProperties = { color: "#6b7280", fontWeight: 500, minWidth: 80 };
const infoValueStyle: React.CSSProperties = { color: "#111827" };
const summaryStyle: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px",
};
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)", fontSize: "0.9rem", fontWeight: 600, color: "#111", margin: "0 0 8px",
};
const summaryTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)", fontSize: "0.85rem", color: "#78350f", margin: 0, lineHeight: 1.5,
};
const medicineCardStyle: React.CSSProperties = {
  padding: "14px 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#ffffff",
};
const dosageBadgeStyle: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 600, color: "#ffffff", background: "#6366f1",
  padding: "4px 10px", borderRadius: 8, flexShrink: 0,
};
const medInfoItemStyle: React.CSSProperties = { display: "flex", gap: 6, fontSize: "0.8rem" };
const medInfoLabelStyle: React.CSSProperties = { color: "#6b7280" };
const medInfoValueStyle: React.CSSProperties = { color: "#111827", fontWeight: 500 };
const recommendationBoxStyle: React.CSSProperties = {
  background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px",
};
const tanongMoStyle: React.CSSProperties = {
  background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 16px",
};

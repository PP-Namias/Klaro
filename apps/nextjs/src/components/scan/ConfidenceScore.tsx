"use client";

interface ConfidenceScoreProps {
  score: number;
  label?: string;
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function getConfidenceLabel(score: number): string {
  if (score >= 80) return "High confidence";
  if (score >= 60) return "Moderate confidence";
  return "Low confidence";
}

export function ConfidenceScore({ score, label }: ConfidenceScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = getConfidenceColor(clamped);
  const displayLabel = label ?? getConfidenceLabel(clamped);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: "var(--font-geist)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.85rem",
        }}
      >
        <span style={{ color: "#666" }}>{displayLabel}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(clamped)}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: 4,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            borderRadius: 4,
            background: color,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

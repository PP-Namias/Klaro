"use client";

type SeverityLevel = "normal" | "low" | "moderate" | "high" | "critical";

interface SeverityIndicatorProps {
  level: SeverityLevel;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const severityConfig = {
  normal: { color: "#22c55e", bg: "#f0fdf4", label: "Normal" },
  low: { color: "#22c55e", bg: "#f0fdf4", label: "Low" },
  moderate: { color: "#f59e0b", bg: "#fffbeb", label: "Moderate" },
  high: { color: "#ef4444", bg: "#fef2f2", label: "High" },
  critical: { color: "#dc2626", bg: "#fef2f2", label: "Critical" },
};

function SeverityDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function SeverityIndicator({
  level,
  label,
  showIcon = true,
  size = "md",
}: SeverityIndicatorProps) {
  const config = severityConfig[level] ?? severityConfig.normal;
  const displayLabel = label ?? config.label;

  const padding = size === "sm" ? "4px 10px" : size === "lg" ? "8px 18px" : "6px 14px";
  const fontSize = size === "sm" ? "0.75rem" : size === "lg" ? "0.95rem" : "0.85rem";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding,
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        fontSize,
        fontWeight: 600,
        fontFamily: "var(--font-geist)",
        border: `1px solid ${config.color}20`,
      }}
    >
      {showIcon && <SeverityDot color={config.color} />}
      {displayLabel}
    </span>
  );
}

export type { SeverityLevel };

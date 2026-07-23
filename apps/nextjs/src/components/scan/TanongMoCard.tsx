"use client";

import { Calendar, HelpCircle, Stethoscope } from "lucide-react";

interface TanongMoCardProps {
  questions: string[];
  severity: "low" | "moderate" | "high";
  bookingCta?: string;
  onBookConsultation?: () => void;
  title?: string;
  subtitle?: string;
}

const severityColors = {
  low: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e" },
  moderate: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  high: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", dot: "#ef4444" },
};

export function TanongMoCard({
  questions,
  severity,
  bookingCta,
  onBookConsultation,
  title = "Questions for Your Doctor",
  subtitle = "Tanong Mo Sa Doktor",
}: TanongMoCardProps) {
  const colors = severityColors[severity] ?? severityColors.low;

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
        <HelpCircle size={18} color="#6366f1" />
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
          padding: "16px 20px",
          borderRadius: 12,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            fontSize: "0.85rem",
            color: "#666",
            fontStyle: "italic",
          }}
        >
          {subtitle}
        </p>

        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {questions.map((q, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#1a1a1a",
              }}
            >
              {q}
            </li>
          ))}
        </ol>

        {onBookConsultation && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={onBookConsultation}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#6366f1",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "var(--font-geist)",
              }}
              type="button"
            >
              <Stethoscope size={18} />
              <span>{bookingCta ?? "Book a Consultation"}</span>
              <Calendar size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

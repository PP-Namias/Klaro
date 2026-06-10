"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@klaro/ui/button";

interface TestResult {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
  interpretation?: string;
  recommendation?: string;
}

interface WorkflowResultsProps {
  requestId: string;
  summary: string;
  tests: TestResult[];
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  tanqmoCard?: {
    title: string;
    questions: string[];
    disclaimer?: string;
    bookingCta?: string;
  };
  confidence?: number;
  processingTimeMs?: number;
  onBookingClick?: () => void;
  onShareClick?: () => void;
  onPrintClick?: () => void;
}

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  MODERATE: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  HIGH: { bg: "#ffedd5", text: "#9a3412", border: "#fdba74" },
  CRITICAL: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

const severityLabels: Record<string, string> = {
  LOW: "Normal",
  MODERATE: "Monitor",
  HIGH: "Attention Needed",
  CRITICAL: "Seek Care",
};

export function WorkflowResults({
  requestId,
  summary,
  tests,
  severity,
  tanqmoCard,
  confidence,
  processingTimeMs,
  onBookingClick,
  onShareClick,
  onPrintClick,
}: WorkflowResultsProps) {
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const colors = severityColors[severity] || severityColors.MODERATE;
  const flaggedTests = tests.filter((t) => t.flagged);
  const displayTests = showFlaggedOnly ? flaggedTests : tests;

  const copyQuestions = useCallback(() => {
    if (tanqmoCard?.questions) {
      navigator.clipboard.writeText(tanqmoCard.questions.join("\n"));
    }
  }, [tanqmoCard]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      {/* Header with Severity Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
            Document Analysis
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.875rem" }}>
            Request ID: {requestId.slice(0, 20)}...
          </p>
        </div>
        <div
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: colors.bg,
            color: colors.text,
            border: `2px solid ${colors.border}`,
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          {severityLabels[severity]}
        </div>
      </div>

      {/* Summary Card */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ margin: "0 0 0.75rem 0", color: colors.text }}>
          Plain Language Summary
        </h3>
        <p style={{ margin: 0, lineHeight: "1.6", color: colors.text }}>
          {summary}
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="Total Tests" value={tests.length} />
        <StatCard label="Flagged" value={flaggedTests.length} accent={flaggedTests.length > 0} />
        <StatCard
          label="Confidence"
          value={confidence ? `${Math.round(confidence * 100)}%` : "N/A"}
        />
        <StatCard
          label="Processing Time"
          value={processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : "N/A"}
        />
      </div>

      {/* Filter Toggle */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showFlaggedOnly}
            onChange={(e) => setShowFlaggedOnly(e.target.checked)}
            style={{ width: "18px", height: "18px" }}
          />
          <span style={{ fontSize: "0.9rem" }}>Show flagged tests only ({flaggedTests.length})</span>
        </label>
      </div>

      {/* Test Results List */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Test Results</h3>
        {displayTests.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No tests extracted from document
          </p>
        ) : (
          displayTests.map((test, index) => (
            <TestResultCard
              key={`${test.name}-${index}`}
              test={test}
              expanded={expandedTest === `${test.name}-${index}`}
              onToggle={() =>
                setExpandedTest(
                  expandedTest === `${test.name}-${index}` ? null : `${test.name}-${index}`,
                )
              }
            />
          ))
        )}
      </div>

      {/* Tanong Mo Sa Doktor Card */}
      {tanqmoCard && tanqmoCard.questions.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#f0f9ff",
            border: "2px solid #bae6fd",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#0369a1" }}>
            {tanqmoCard.title}
          </h3>
          {tanqmoCard.disclaimer && (
            <p
              style={{
                padding: "0.75rem",
                backgroundColor: "#fef3c7",
                borderRadius: "8px",
                fontSize: "0.9rem",
                marginBottom: "1rem",
              }}
            >
              {tanqmoCard.disclaimer}
            </p>
          )}
          <ol style={{ margin: "0 0 1rem 0", paddingLeft: "1.5rem" }}>
            {tanqmoCard.questions.map((q, i) => (
              <li key={i} style={{ marginBottom: "0.5rem", lineHeight: "1.5" }}>
                {q}
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            onClick={copyQuestions}
            style={{ marginRight: "0.5rem" }}
          >
            Copy Questions
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1.5rem",
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
        }}
      >
        {onBookingClick && severity !== "LOW" && (
          <Button
            type="button"
            onClick={onBookingClick}
            style={{ backgroundColor: "#2563eb", color: "white", flex: 1 }}
          >
            {tanqmoCard?.bookingCta || "Book Appointment"}
          </Button>
        )}
        {onShareClick && (
          <Button
            type="button"
            variant="outline"
            onClick={onShareClick}
            style={{ flex: 1 }}
          >
            Share Results
          </Button>
        )}
        {onPrintClick && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrintClick}
            style={{ flex: 1 }}
          >
            Print / Export PDF
          </Button>
        )}
      </div>

      {/* Medical Disclaimer */}
      <p
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          fontSize: "0.8rem",
          color: "#991b1b",
          textAlign: "center",
        }}
      >
        This analysis is for informational purposes only and should not replace
        professional medical advice. Always consult a healthcare provider for
        diagnosis and treatment.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: accent ? "#fef2f2" : "#f8fafc",
        border: `1px solid ${accent ? "#fca5a5" : "#e2e8f0"}`,
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: accent ? "#dc2626" : "#1e293b",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{label}</div>
    </div>
  );
}

function TestResultCard({
  test,
  expanded,
  onToggle,
}: {
  test: TestResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isFlagged = test.flagged;

  return (
    <div
      style={{
        padding: "1rem",
        marginBottom: "0.5rem",
        backgroundColor: isFlagged ? "#fff7ed" : "white",
        border: `1px solid ${isFlagged ? "#fed7aa" : "#e2e8f0"}`,
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontWeight: "600" }}>{test.name}</span>
          {isFlagged && (
            <span
              style={{
                marginLeft: "0.5rem",
                padding: "0.125rem 0.5rem",
                backgroundColor: "#dc2626",
                color: "white",
                borderRadius: "4px",
                fontSize: "0.75rem",
              }}
            >
              FLAGGED
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontWeight: "600" }}>
            {test.value} {test.unit}
          </span>
          <span style={{ color: "#666", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
          {test.referenceRange && (
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
              Reference Range: {test.referenceRange}
            </p>
          )}
          {test.interpretation && (
            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>
              {test.interpretation}
            </p>
          )}
          {test.recommendation && (
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#2563eb" }}>
              Recommendation: {test.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowResults;

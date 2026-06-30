"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@klaro/ui/button";

import type { ScanAnalysisSession } from "~/components/scan-session";
import { readScanAnalysisSession } from "~/components/scan-session";
import { useLanguage } from "~/providers/language-provider";

interface ScanResultsProps {
  onScanAgain?: () => void;
}

export function ScanResults({ onScanAgain }: ScanResultsProps) {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("id");
  const [result, setResult] = useState<ScanAnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { t } = useLanguage();

  useEffect(() => {
    const stored = readScanAnalysisSession();
    if (stored && (!scanId || stored.requestId === scanId)) {
      setResult(stored);
    }
    setIsLoading(false);
  }, [scanId]);

  const analysis = result?.analysis;
  const summary = result?.plainLanguageSummary || analysis?.summary;
  const urgency = result?.urgency || analysis?.urgency;
  const recommendations =
    result?.recommendations || analysis?.recommendations || [];

  const urgencyStyles: Record<
    "LOW" | "MODERATE" | "HIGH",
    { badge: string; panel: string; label: string }
  > = {
    LOW: {
      badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
      panel: "border-emerald-200 bg-emerald-50",
      label: t("results.urgency.low"),
    },
    MODERATE: {
      badge: "border-amber-200 bg-amber-100 text-amber-800",
      panel: "border-amber-200 bg-amber-50",
      label: t("results.urgency.moderate"),
    },
    HIGH: {
      badge: "border-rose-200 bg-rose-100 text-rose-800",
      panel: "border-rose-200 bg-rose-50",
      label: t("results.urgency.high"),
    },
  };

  const urgencyPanelColors: Record<
    "LOW" | "MODERATE" | "HIGH",
    { border: string; background: string }
  > = {
    LOW: { border: "#a7f3d0", background: "#ecfdf5" },
    MODERATE: { border: "#fde68a", background: "#fffbeb" },
    HIGH: { border: "#fecdd3", background: "#fff1f2" },
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>{t("results.loading")}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>{t("results.noResults")}</h1>
        <p>{t("results.noResultsDesc")}</p>
      </div>
    );
  }

  if (result.status === "pending") {
    return (
      <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
        <h1>{t("results.scanInProgress")}</h1>
        <p style={{ color: "#334155" }}>
          {result.plainLanguageSummary ||
            t("results.processingByGemini")}
        </p>
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "8px",
            backgroundColor: "#fef9c3",
            color: "#0f172a",
          }}
        >
          {t("results.schedulerStillLoading")}
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#d32f2f" }}>{t("results.scanFailed")}</h1>
        <p>
          {result.error || t("results.scanError")}
        </p>
        <Button onClick={onScanAgain} style={{ marginTop: "1rem" }}>
          {t("btn.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1>{t("results.medicalAnalysis")}</h1>
        <p style={{ color: "#666", marginBottom: "0.5rem" }}>
          {t("results.scanId") + " "}<code>{result.requestId}</code>
        </p>
        <p style={{ color: "#666" }}>
          {result.timestamp &&
            `${t("results.scannedAt")} ${new Date(result.timestamp).toLocaleString()}`}
        </p>
      </div>

      {urgency && urgencyStyles[urgency] && (
        <div
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            borderRadius: "12px",
            border: `1px solid ${urgencyPanelColors[urgency].border}`,
            backgroundColor: urgencyPanelColors[urgency].background,
          }}
        >
          <div
            style={{
              display: "inline-block",
              marginBottom: "0.75rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              border: "1px solid",
              color:
                urgency === "HIGH"
                  ? "#9f1239"
                  : urgency === "MODERATE"
                    ? "#92400e"
                    : "#065f46",
              backgroundColor:
                urgency === "HIGH"
                  ? "#ffe4e6"
                  : urgency === "MODERATE"
                    ? "#fef3c7"
                    : "#d1fae5",
            }}
          >
            {urgencyStyles[urgency].label}
          </div>
          <h2 style={{ margin: 0, marginBottom: "0.5rem" }}>
            {t("results.urgencyLabel") + " "}{urgency}
          </h2>
          <p style={{ margin: 0, color: "#334155" }}>
            {urgency === "HIGH"
              ? t("results.urgencyDesc.high")
              : urgency === "MODERATE"
                ? t("results.urgencyDesc.moderate")
                : t("results.urgencyDesc.low")}
          </p>
        </div>
      )}

      {/* Confidence Score */}
      {result.confidence !== undefined && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: "500" }}>{t("results.confidence")}</p>
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#ddd",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(result.confidence * 100)}%`,
                  height: "100%",
                  backgroundColor: "#4caf50",
                }}
              />
            </div>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.9rem",
                color: "#666",
              }}
            >
              {Math.round(result.confidence * 100)}{t("results.confident")}
            </p>
          </div>
        </div>
      )}

      {/* Plain Language Summary */}
      {summary && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff9c4",
            borderRadius: "8px",
            borderLeft: "4px solid #fbc02d",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{"📋 " + t("results.section.summary")}</h2>
          <p>{summary}</p>
        </div>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            borderLeft: "4px solid #f44336",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#c62828" }}>{"⚠️ " + t("results.section.warnings")}</h2>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            {result.warnings.map((warning, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            borderLeft: "4px solid #2196f3",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{"💡 " + t("results.section.recommendations")}</h2>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            {recommendations.map((rec, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Data */}
      {result.extractedData && Object.keys(result.extractedData).length > 0 && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{"📊 " + t("results.section.extractedData")}</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <tbody>
              {Object.entries(result.extractedData).map(([key, value]) => (
                <tr key={key} style={{ borderBottom: "1px solid #ddd" }}>
                  <td
                    style={{
                      padding: "0.5rem",
                      fontWeight: "500",
                      width: "30%",
                    }}
                  >
                    {key}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Button onClick={onScanAgain}>{t("btn.scanAnother")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("btn.goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}

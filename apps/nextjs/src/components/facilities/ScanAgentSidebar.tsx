"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@klaro/ui/button";
import { toast } from "@klaro/ui/toast";

import { useTRPC } from "~/trpc/react";
import { readScanAnalysisSession } from "~/components/scan-session";

interface ScanAnalysis {
  summary: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  recommendations: string[];
}

interface ScanResult {
  extractedData?: Record<string, unknown>;
  flaggedTests?: Array<{ name: string; value?: string; unit?: string; flagged?: boolean }>;
  analysis?: ScanAnalysis;
  plainLanguageSummary?: string;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  recommendations?: string[];
}

export function ScanAgentSidebar() {
  const trpc = useTRPC();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null);

  useEffect(() => {
    try {
      const parsed = readScanAnalysisSession();
      if (!parsed) return;
      setScanResult({
        extractedData: parsed.extractedData,
        analysis: parsed.analysis,
        plainLanguageSummary: parsed.plainLanguageSummary,
        urgency: parsed.urgency,
        recommendations: parsed.recommendations,
      });
      if (parsed.analysis) {
        setAnalysis(parsed.analysis);
      }
    } catch (err) {
      // ignore malformed scan state
    }
  }, []);

  const analyzeMutation = useMutation(
    trpc.documents.analyzeScanWithAI.mutationOptions({
      onSuccess: (data) => {
        if (data.success) {
          setAnalysis(data.analysis);
          toast.success("Scan analysis complete!");
        } else {
          toast.error(data.error || "Analysis failed");
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Analysis failed";
        toast.error(message);
      },
    }),
  );

  const handleAnalyze = async () => {
    if (!scanResult?.extractedData) {
      toast.error("No extracted data available");
      return;
    }

    const extractedData = scanResult.extractedData as Record<string, unknown>;
    const flaggedTests = (
      Array.isArray(extractedData.flaggedTests)
        ? extractedData.flaggedTests
        : Array.isArray(scanResult.flaggedTests)
          ? scanResult.flaggedTests
          : []
    ) as Array<{ name: string; value?: string; unit?: string; flagged?: boolean }>;

    analyzeMutation.mutate({
      extractedTests: flaggedTests.length > 0 ? flaggedTests : [{ name: "No specific tests" }],
      patientAge: typeof extractedData.patientAge === "number" ? extractedData.patientAge : undefined,
      patientSex:
        extractedData.patientSex === "male" ||
        extractedData.patientSex === "female" ||
        extractedData.patientSex === "other"
          ? extractedData.patientSex
          : undefined,
    });
  };

  const normalizedAnalysis: ScanAnalysis | null =
    analysis ||
    (scanResult?.analysis
      ? {
          summary: scanResult.analysis.summary || scanResult.plainLanguageSummary || "",
          urgency: scanResult.analysis.urgency || scanResult.urgency || "MODERATE",
          recommendations:
            scanResult.analysis.recommendations || scanResult.recommendations || [],
        }
      : scanResult?.plainLanguageSummary || scanResult?.urgency || scanResult?.recommendations
        ? {
            summary: scanResult.plainLanguageSummary || "",
            urgency: scanResult.urgency || "MODERATE",
            recommendations: scanResult.recommendations || [],
          }
        : null);

  if (!scanResult) {
    return null;
  }

  const urgencyColors: Record<"LOW" | "MODERATE" | "HIGH", string> = {
    LOW: "bg-green-100 text-green-800 border-green-300",
    MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    HIGH: "bg-red-100 text-red-800 border-red-300",
  };

  const urgencyBgColors: Record<"LOW" | "MODERATE" | "HIGH", string> = {
    LOW: "bg-green-50",
    MODERATE: "bg-yellow-50",
    HIGH: "bg-red-50",
  };

  return (
    <div className="flex flex-col gap-4 border-l border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">📋 Scan Analysis</h2>
        {!analysis && (
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
          </Button>
        )}
      </div>

      {normalizedAnalysis && (
        <div className={`rounded-lg border-l-4 p-4 ${urgencyBgColors[normalizedAnalysis.urgency]}`}>
          <div
            className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${urgencyColors[normalizedAnalysis.urgency]}`}
          >
            Urgency: {normalizedAnalysis.urgency}
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-800">{normalizedAnalysis.summary}</p>

          {normalizedAnalysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-700">Next Steps</h3>
              <ul className="space-y-1">
                {normalizedAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setAnalysis(null);
              analyzeMutation.reset();
            }}
          >
            Run New Analysis
          </Button>
        </div>
      )}

      {!normalizedAnalysis && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center">
          <p className="text-sm text-slate-600">
            {analyzeMutation.isPending ? (
              <span>Analyzing your scan with AI...</span>
            ) : (
              <span>Click "Analyze" to process your medical data with AI</span>
            )}
          </p>
        </div>
      )}

      {analyzeMutation.isError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {analyzeMutation.error instanceof Error
              ? analyzeMutation.error.message
              : "Analysis failed"}
          </p>
        </div>
      )}
    </div>
  );
}

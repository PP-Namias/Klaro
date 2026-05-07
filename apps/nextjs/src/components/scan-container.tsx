"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UploadForm } from "~/components/upload-form";
import { ScanResults } from "~/components/scan-results";

interface ScanResult {
  requestId: string;
  status: "completed" | "error" | "pending";
  language?: string;
  analysis?: Record<string, unknown>;
  extractedData?: Record<string, unknown>;
  confidence?: number;
  plainLanguageSummary?: string;
  recommendations?: string[];
  warnings?: string[];
  timestamp?: string;
  error?: string;
}

export function ScanContainer() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("id");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get result from sessionStorage
    const stored = sessionStorage.getItem("scanResult");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
      } catch (err) {
        console.error("Failed to parse stored scan result", err);
      }
    }
    setIsLoading(false);
  }, [scanId]);

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show results if they exist
  if (result) {
    return <ScanResults onScanAgain={() => {
      sessionStorage.removeItem("scanResult");
      setResult(null);
    }} />;
  }

  // Show upload form if no results
  return <UploadForm />;
}

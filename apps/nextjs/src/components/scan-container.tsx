"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UploadForm } from "~/components/upload-form";
import { ScanResults } from "~/components/scan-results";
import {
  clearScanAnalysisSession,
  readScanAnalysisSession,
  type ScanAnalysisSession,
} from "~/components/scan-session";

export function ScanContainer() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("id");
  const [result, setResult] = useState<ScanAnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readScanAnalysisSession();
    if (stored && (!scanId || stored.requestId === scanId)) {
      setResult(stored);
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
      clearScanAnalysisSession();
      setResult(null);
    }} />;
  }

  // Show upload form if no results
  return <UploadForm />;
}

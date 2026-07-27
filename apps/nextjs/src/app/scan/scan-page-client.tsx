"use client";

import { useSearchParams } from "next/navigation";

import { ScannerUI } from "~/layouts/SampleScanner/ScannerUI";

export function ScanPageClient() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id") ?? undefined;

  return <ScannerUI initialAnalysisId={analysisId} />;
}

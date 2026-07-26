/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/no-empty-function, @typescript-eslint/no-unnecessary-condition */

"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";

import { ConfidenceScore } from "~/components/scan/ConfidenceScore";
import { DisclaimerBanner } from "~/components/scan/DisclaimerBanner";
import { PlainLanguageSummary } from "~/components/scan/PlainLanguageSummary";
import { SeverityIndicator } from "~/components/scan/SeverityIndicator";
import { TanongMoCard } from "~/components/scan/TanongMoCard";
import { useTRPC } from "~/trpc/react";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.documents.byId.queryOptions({ id }),
  );

  const deleteMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.list.queryKey(),
        });
        router.push("/documents");
      },
    }),
  );

  const handleDelete = useCallback(() => {
    if (window.confirm("Delete this document? This action cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  }, [id, deleteMutation]);

  const handleBookConsultation = useCallback(() => {
    router.push("/facilities");
  }, [router]);

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "2rem",
          fontFamily: "var(--font-geist)",
        }}
      >
        <div
          style={{
            height: 40,
            width: "60%",
            background: "#f3f4f6",
            borderRadius: 8,
            marginBottom: 24,
          }}
        />
        <div style={{ height: 200, background: "#f3f4f6", borderRadius: 12 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "var(--font-geist)",
        }}
      >
        <h2>Document not found</h2>
        <button onClick={() => router.push("/documents")}>
          Back to Documents
        </button>
      </div>
    );
  }

  const { document: doc, analysis: docAnalysis } = data;

  const getSeverityLevel = (): "low" | "moderate" | "high" => {
    if (!docAnalysis?.tanqmoCard || typeof docAnalysis.tanqmoCard !== "object")
      return "low";
    const card = docAnalysis.tanqmoCard as Record<string, unknown>;
    const severity = String(card.severity ?? "").toLowerCase();
    if (severity === "high" || severity === "moderate") return severity;
    return "low";
  };

  const getTanongMoQuestions = (): string[] => {
    if (!docAnalysis?.tanqmoCard || typeof docAnalysis.tanqmoCard !== "object")
      return [];
    const card = docAnalysis.tanqmoCard as Record<string, unknown>;
    return (card.questions as string[]) ?? [];
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "2rem 1.5rem",
        fontFamily: "var(--font-geist)",
      }}
    >
      {/* Back + Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => router.push("/documents")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontFamily: "var(--font-geist)",
          }}
          type="button"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleDelete}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #fecaca",
            background: "#fff",
            cursor: "pointer",
            color: "#ef4444",
            fontSize: "0.85rem",
            fontFamily: "var(--font-geist)",
          }}
          type="button"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Document header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          padding: "16px 20px",
          borderRadius: 14,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <FileText size={28} color="#6366f1" />
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>
            {doc.fileName}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "0.85rem" }}>
            {doc.mimeType} &middot;{" "}
            {new Date(doc.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <SeverityIndicator level={getSeverityLevel()} size="md" />
        </div>
      </div>

      {/* Analysis results */}
      {docAnalysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {doc.confidence && (
            <ConfidenceScore score={parseFloat(String(doc.confidence)) * 100} />
          )}

          {docAnalysis.plainLanguageSummary && (
            <PlainLanguageSummary
              summary={docAnalysis.plainLanguageSummary}
              dialect="English"
              onDialectChange={() => {}}
            />
          )}

          {getTanongMoQuestions().length > 0 && (
            <TanongMoCard
              questions={getTanongMoQuestions()}
              severity={getSeverityLevel()}
              onBookConsultation={handleBookConsultation}
            />
          )}

          <DisclaimerBanner type="medical" />
        </div>
      )}

      {!docAnalysis && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
          <p>This document has not been analyzed yet.</p>
        </div>
      )}
    </div>
  );
}

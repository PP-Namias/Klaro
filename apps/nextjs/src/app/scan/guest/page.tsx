"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Lock, Sparkles, Upload, UserPlus } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { DropZone } from "~/components/drop-zone";
import { UploadProgress, type UploadStage } from "~/components/upload-progress";
import { validateFiles, fileToBase64 } from "~/lib/file-validation";

export default function GuestScanPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const scanMutation = trpc.documents.scanGuestImage.useMutation({
    onSuccess: () => {
      setStage("complete");
      setProgress(100);
      setShowUpgrade(true);
    },
    onError: (err) => {
      setStage("error");
      setError(err.message);
    },
  });

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const { valid, invalid } = await validateFiles(files);

      if (invalid.length > 0) {
        setError(invalid[0]?.error ?? "Invalid file");
        setStage("error");
        return;
      }

      if (valid.length === 0) {
        setError("No valid files selected.");
        setStage("error");
        return;
      }

      setStage("validating");
      setProgress(10);
      setError(null);

      try {
        const file = valid[0]!;
        setStage("uploading");
        setProgress(30);
        const base64 = await fileToBase64(file);
        setStage("processing");
        setProgress(70);
        scanMutation.mutate({
          base64Image: base64,
          fileName: file.name,
          language: "Filipino",
        });
      } catch (err) {
        setStage("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [scanMutation],
  );

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "2rem 1.5rem",
        fontFamily: "var(--font-geist)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Sparkles size={28} color="#6366f1" />
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700 }}>
          Quick Scan
        </h1>
        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem", lineHeight: 1.5 }}>
          Upload one document for a quick analysis.{" "}
          <strong>No account needed.</strong>
        </p>
      </div>

      {/* Upload area */}
      {stage === "idle" && (
        <DropZone onFilesSelected={handleFilesSelected} multiple={false} />
      )}

      {/* Progress */}
      <UploadProgress
        stage={stage === "error" ? "error" : stage}
        progress={progress}
        error={error ?? undefined}
      />

      {/* Upgrade prompt */}
      {showUpgrade && (
        <div
          style={{
            marginTop: 32,
            padding: "24px 20px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #eef2ff, #f0fdf4)",
            border: "1px solid #e0e7ff",
            textAlign: "center",
          }}
        >
          <UserPlus size={32} color="#6366f1" style={{ marginBottom: 12 }} />
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#1a1a1a",
            }}
          >
            Create an Account for Full Access
          </h3>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "0.85rem",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Sign up to unlock unlimited scans, chat with Clara,
            track your health history, and book doctor appointments.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            <button
              onClick={() => router.push("/signup")}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: "#6366f1",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                fontFamily: "var(--font-geist)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              type="button"
            >
              <UserPlus size={18} /> Sign Up Free
            </button>
            <button
              onClick={() => router.push("/login")}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#666",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontFamily: "var(--font-geist)",
              }}
              type="button"
            >
              I already have an account
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "center",
              gap: 20,
              fontSize: "0.8rem",
              color: "#999",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Lock size={12} /> Private & secure
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FileText size={12} /> Unlimited scans
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Upload size={12} /> Free to use
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

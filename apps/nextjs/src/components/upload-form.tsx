"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@klaro/ui/button";
import { toast } from "@klaro/ui/toast";
import { LANGUAGE_TO_DIALECT } from "@klaro/validators/language";

import { MedicalDisclaimerOverlay } from "~/components/medical-disclaimer-overlay";
import { saveScanAnalysisSession } from "~/components/scan-session";
import { useMedicalDisclaimer } from "~/hooks/use-medical-disclaimer";
import { useLanguage } from "~/providers/language-provider";
import { useTRPC } from "~/trpc/react";

interface SelectedFile {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
}

type ScanUIState = "idle" | "uploading" | "processing" | "completed" | "error";

const maxFileSize = 50 * 1024 * 1024; // 50MB for PDFs
const acceptedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "image/tiff",
  "image/bmp",
  "image/gif",
]);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part after the comma
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanUIState>("idle");
  const [cameraActive, setCameraActive] = useState(false);

  const { t, language } = useLanguage();

  const isProcessing = scanState === "uploading" || scanState === "processing";

  const trpc = useTRPC();

  // Blocking consent gate — no document may be read before the Terms of
  // Service, Terms & Conditions and medical disclaimer are accepted.
  const disclaimer = useMedicalDisclaimer();
  const recordConsent = useMutation(trpc.auth.recordConsent.mutationOptions());

  const scanGuestImage = useMutation(
    trpc.documents.scanGuestImage.mutationOptions({
      onSuccess: (result) => {
        if (result.status === "error") {
          setScanState("error");
          const message =
            "error" in result ? (result.error ?? "Scan failed") : "Scan failed";
          setUploadStatus(message);
          saveScanAnalysisSession({
            requestId: result.requestId,
            status: "error",
            language: result.language,
            error: message,
            warnings: ["scan_failed"],
            timestamp: result.timestamp,
          });
          toast.error(message);
          return;
        }

        setScanState("completed");
        setUploadStatus(t("upload.scanComplete"));
        saveScanAnalysisSession({
          requestId: result.requestId,
          status: "completed",
          source: "source" in result ? result.source : undefined,
          language: result.language,
          confidence:
            "confidence" in result && typeof result.confidence === "number"
              ? result.confidence
              : undefined,
          extractedData:
            "extractedData" in result && result.extractedData
              ? result.extractedData
              : undefined,
          plainLanguageSummary:
            "plainLanguageSummary" in result &&
            typeof result.plainLanguageSummary === "string"
              ? result.plainLanguageSummary
              : undefined,
          urgency:
            "urgency" in result &&
            (result.urgency === "LOW" ||
              result.urgency === "MODERATE" ||
              result.urgency === "HIGH")
              ? result.urgency
              : undefined,
          recommendations:
            "recommendations" in result && Array.isArray(result.recommendations)
              ? result.recommendations
              : undefined,
          warnings:
            "warnings" in result && Array.isArray(result.warnings)
              ? result.warnings
              : undefined,
          timestamp: result.timestamp,
          error:
            "error" in result && typeof result.error === "string"
              ? result.error
              : undefined,
          analysis:
            "analysis" in result && result.analysis
              ? result.analysis
              : undefined,
        });
        toast.success(t("upload.success"));
        router.push(`/scan?id=${result.requestId}`);
      },
      onError: () => {
        setScanState("error");
        const message = t("upload.scanFailedRetry");
        setUploadStatus(message);
        toast.error(message);
      },
    }),
  );

  // Request camera on mount
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!mounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraActive(true);
        }
      } catch (err) {
        console.warn("Camera not available or permission denied", err);
        setCameraActive(false);
      }
    }

    void startCamera();
    return () => {
      mounted = false;
      if (
        videoRef.current &&
        videoRef.current.srcObject instanceof MediaStream
      ) {
        const st = videoRef.current.srcObject;
        st.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) {
        URL.revokeObjectURL(selected.previewUrl);
      }
    };
  }, [selected]);

  const clearSelection = () => {
    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
    }
    setSelected(null);
    setError(null);
    setUploadStatus(null);
    setScanState("idle");
  };

  const selectFile = (file: File) => {
    if (!acceptedTypes.has(file.type)) {
      setError(t("upload.fileTypeNotSupported"));
      setSelected(null);
      setScanState("error");
      return;
    }

    if (file.size > maxFileSize) {
      setError(t("upload.fileSizeTooLarge"));
      setSelected(null);
      setScanState("error");
      return;
    }

    let previewUrl: string | undefined;
    let kind: "image" | "pdf";

    if (file.type === "application/pdf") {
      kind = "pdf";
    } else {
      kind = "image";
      previewUrl = URL.createObjectURL(file);
    }

    setError(null);
    setSelected({ file, previewUrl, kind });
    setUploadStatus(null);
    setScanState("idle");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) selectFile(file);
  };

  const handleAcceptConsent = () => {
    disclaimer.acceptDisclaimer();
    // Proof of consent is recorded server-side; it carries no medical content.
    recordConsent.mutate({});
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!selected) {
      setError(t("upload.selectFile"));
      setScanState("error");
      return;
    }

    if (!disclaimer.requireConsent()) return;

    const pendingRequestId = `scan-pending-${Date.now()}`;
    setScanState("uploading");
    setUploadStatus(t("upload.uploadingDoc"));
    try {
      saveScanAnalysisSession({
        requestId: pendingRequestId,
        status: "pending",
        language: LANGUAGE_TO_DIALECT[language],
        plainLanguageSummary: t("upload.sessionUploading"),
        warnings: ["processing_in_progress"],
        timestamp: new Date().toISOString(),
      });

      const base64 = await fileToBase64(selected.file);
      setScanState("processing");
      setUploadStatus(t("upload.processingWithGemini"));
      scanGuestImage.mutate({
        base64Image: base64,
        fileName: selected.file.name,
        language: LANGUAGE_TO_DIALECT[language] as
          | "English"
          | "Filipino"
          | "Bisaya"
          | "Ilocano",
      });
    } catch (err) {
      setScanState("error");
      const msg =
        err instanceof Error ? err.message : t("upload.failedReadFile");
      setError(msg);
      setUploadStatus(msg);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const data = c.toDataURL("image/png");
    const base64 = data.split(",")[1] || data;
    const blob = await (await fetch(data)).blob();
    const file = new File([blob], `camera-${Date.now()}.png`, {
      type: "image/png",
    });

    const pendingRequestId = `scan-pending-${Date.now()}`;
    setScanState("uploading");
    setUploadStatus(t("upload.uploadingImage"));
    try {
      saveScanAnalysisSession({
        requestId: pendingRequestId,
        status: "pending",
        language: LANGUAGE_TO_DIALECT[language],
        plainLanguageSummary: t("upload.imageUploading"),
        warnings: ["processing_in_progress"],
        timestamp: new Date().toISOString(),
      });

      setScanState("processing");
      setUploadStatus(t("upload.processingImage"));
      scanGuestImage.mutate({
        base64Image: base64,
        fileName: file.name,
        language: LANGUAGE_TO_DIALECT[language] as
          | "English"
          | "Filipino"
          | "Bisaya"
          | "Ilocano",
      });
    } catch (err) {
      setScanState("error");
      const message =
        err instanceof Error ? err.message : t("upload.failedProcessImage");
      setUploadStatus(message);
      toast.error(message);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem",
        minHeight: "100%",
        border: isDragging ? "2px dashed #1976d2" : "2px solid transparent",
        backgroundColor: isDragging
          ? "rgba(227, 242, 253, 0.5)"
          : "transparent",
        transition: "all 0.3s ease",
        borderRadius: "12px",
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Large Camera Preview Section - Matches Image Layout */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "60vh",
          aspectRatio: "16 / 9",
          margin: "0 auto",
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #e0e0e0",
        }}
      >
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
              muted
            />
            {/* Center button overlay - "Take a photo & Scan here" */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={isProcessing}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  padding: "1rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "500",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("upload.takePhoto")}
              </Button>
            </div>
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
              color: "#666",
              fontSize: "1rem",
              textAlign: "center",
            }}
          >
            <p>{t("upload.cameraNotAvailable")}</p>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Drag and Drop Upload Zone Below Camera - Matches Image Layout */}
      <div
        style={{
          padding: "1rem",
          border: isDragging ? "2px dashed #1976d2" : "2px dashed #ccc",
          borderRadius: "8px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          backgroundColor: isDragging ? "#e3f2fd" : "#fafafa",
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            type="button"
            variant="outline"
            style={{
              width: "100%",
              padding: "1.5rem",
              color: "#666",
              fontSize: "1rem",
              backgroundColor: "transparent",
              border: "none",
              pointerEvents: "none",
            }}
            disabled={isProcessing}
          >
            {t("upload.dragOrUpload")}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,image/tiff,image/bmp,image/gif"
          style={{ display: "none" }}
          onChange={(event) => handleFiles(event.target.files)}
          disabled={isProcessing}
        />
      </div>

      {/* Error and Status Messages */}
      {error && (
        <p
          role="alert"
          style={{
            color: "#d32f2f",
            padding: "1rem",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
          }}
        >
          {error}
        </p>
      )}
      {uploadStatus && (
        <p
          aria-live="polite"
          style={{
            color: "#1976d2",
            padding: "1rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
          }}
        >
          {uploadStatus}
        </p>
      )}

      {scanState === "processing" && (
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "#0f172a",
            backgroundColor: "#fef9c3",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
          }}
        >
          {t("upload.schedulerLoading")}
        </p>
      )}

      {/* File Preview Section */}
      {selected && (
        <div
          style={{
            padding: "1.5rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>
                {selected.file.name}
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0 0",
                  color: "#666",
                  fontSize: "0.875rem",
                }}
              >
                {formatBytes(selected.file.size)}
              </p>
            </div>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                backgroundColor: "#e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            >
              {selected.kind === "pdf" ? "PDF" : "IMAGE"}
            </span>
          </div>
          {selected.kind === "image" && selected.previewUrl && (
            <img
              src={selected.previewUrl}
              alt="Selected medical document"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "contain",
                marginBottom: "1rem",
                borderRadius: "4px",
              }}
            />
          )}
          {selected.kind === "pdf" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                backgroundColor: "#f5f5f5",
                borderRadius: "0.5rem",
                fontSize: "3rem",
                marginBottom: "1rem",
              }}
            >
              📄
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={isProcessing}
            >
              {t("upload.removeFile")}
            </Button>
            <Button
              type="button"
              style={{ backgroundColor: "#4caf50", color: "white" }}
              disabled={!selected || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? t("upload.scanning") : t("upload.scanWithAI")}
            </Button>
          </div>
        </div>
      )}

      <MedicalDisclaimerOverlay
        isOpen={disclaimer.isShowing}
        onAccept={handleAcceptConsent}
        onDecline={disclaimer.declineDisclaimer}
      />
    </div>
  );
}

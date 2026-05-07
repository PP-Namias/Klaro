"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@klaro/ui/button";
import { toast } from "@klaro/ui/toast";

import { useTRPC } from "~/trpc/react";

interface SelectedFile {
  file: File;
  previewUrl?: string;
  kind: "image" | "pdf";
}

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

const styles = {
  upload__form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
  upload__dropzone: {
    padding: "2rem",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "all 0.3s ease",
    backgroundColor: "#fafafa",
  },
  upload__dropzoneActive: {
    padding: "2rem",
    border: "2px dashed #1976d2",
    borderRadius: "8px",
    textAlign: "center" as const,
    cursor: "pointer",
    backgroundColor: "#e3f2fd",
  },
  upload__dropzoneInner: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1rem",
  },
  upload__dropzoneLabel: {
    fontSize: "0.875rem",
    color: "#666",
  },
  upload__dropzoneTitle: {
    margin: 0,
    fontSize: "1.5rem",
  },
  upload__dropzoneCopy: {
    margin: 0,
    color: "#666",
  },
  upload__dropzoneTags: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  upload__dropzoneTag: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
  upload__dropzoneButton: {
    marginTop: "0.5rem",
  },
  upload__fileInput: {
    display: "none",
  },
  upload__error: {
    color: "#d32f2f",
    padding: "1rem",
    backgroundColor: "#ffebee",
    borderRadius: "4px",
  },
  upload__status: {
    color: "#1976d2",
    padding: "1rem",
    backgroundColor: "#e3f2fd",
    borderRadius: "4px",
  },
  upload__preview: {
    padding: "1.5rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  upload__previewMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  upload__previewName: {
    margin: 0,
    fontWeight: "500" as const,
  },
  upload__previewSize: {
    margin: "0.25rem 0 0 0",
    color: "#666",
    fontSize: "0.875rem",
  },
  upload__previewBadge: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    fontSize: "0.875rem",
  },
  upload__previewImage: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain" as const,
    marginBottom: "1rem",
    borderRadius: "4px",
  },
  upload__previewActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
  },
  upload__submit: {
    backgroundColor: "#4caf50",
    color: "white",
  },
  upload__hint: {
    textAlign: "center" as const,
    color: "#999",
  },
};

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const trpc = useTRPC();

  // Use the public guest scan endpoint
  const scanGuestImage = useMutation(
    trpc.documents.scanGuestImage.mutationOptions({
      onSuccess: (result) => {
        setIsProcessing(false);
        if (result.status === "error") {
          setUploadStatus(result.error || "Scan failed");
          toast.error(result.error || "Scan failed");
        } else {
          // Save result to sessionStorage for results page
          sessionStorage.setItem("scanResult", JSON.stringify(result));
          toast.success("Document scanned successfully!");
          // Navigate to results page
          router.push(`/scan?id=${result.requestId}`);
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        const message = "Could not scan the document. Please try again.";
        setUploadStatus(message);
        toast.error(message);
      },
    }),
  );

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) {
        URL.revokeObjectURL(selected.previewUrl);
      }
    };
  }, [selected]);

  // Request camera on mount (camera-first UX)
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!mounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        // user denied or not available - keep file input fallback
        console.warn("Camera not available or permission denied", err);
      }
    }

    void startCamera();
    return () => {
      mounted = false;
      // stop any active tracks
      if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
        const st = videoRef.current.srcObject as MediaStream;
        st.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const clearSelection = () => {
    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
    }
    setSelected(null);
    setError(null);
    setUploadStatus(null);
  };

  const selectFile = (file: File) => {
    if (!acceptedTypes.has(file.type)) {
      setError("File type not supported. Please use PNG, JPG, PDF, WebP, TIFF, BMP, or GIF.");
      setSelected(null);
      return;
    }

    if (file.size > maxFileSize) {
      setError("File size must be under 50 MB.");
      setSelected(null);
      return;
    }

    let previewUrl: string | undefined;
    let kind: "image" | "pdf";

    if (file.type === "application/pdf") {
      kind = "pdf";
      // For PDFs, we don't create a preview URL
    } else {
      kind = "image";
      previewUrl = URL.createObjectURL(file);
    }

    setError(null);
    setSelected({ file, previewUrl, kind });
    setUploadStatus(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) selectFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selected) {
      setError("Please select a file to scan.");
      return;
    }

    setIsProcessing(true);
    setUploadStatus("Processing file...");

    try {
      const base64 = await fileToBase64(selected.file);
      scanGuestImage.mutate({
        base64Image: base64,
        fileName: selected.file.name,
        language: "English",
      });
    } catch (err) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : "Failed to read file";
      setError(msg);
      setUploadStatus(msg);
    }
  };

  return (
    <div style={styles.upload__form as any}>
      <div style={isDragging ? (styles.upload__dropzoneActive as any) : (styles.upload__dropzone as any)}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ position: "relative", width: "100%", height: "420px", backgroundColor: "#000", borderRadius: 8, overflow: "hidden" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Trigger file input fallback
                inputRef.current?.click();
              }}
              disabled={isProcessing}
            >
              Select file
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                // Capture photo from video
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
                // create a fake File object
                const blob = await (await fetch(data)).blob();
                const file = new File([blob], `camera-${Date.now()}.png`, { type: "image/png" });
                selectFile(file);
                // auto-submit after capture
                setIsProcessing(true);
                setUploadStatus("Processing captured image...");
                try {
                  const b64 = base64;
                  scanGuestImage.mutate({ base64Image: b64, fileName: file.name, language: "English" });
                } catch (err) {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
            >
              📸 Capture
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,image/tiff,image/bmp,image/gif"
          style={styles.upload__fileInput as any}
          onChange={(event) => handleFiles(event.target.files)}
          disabled={isProcessing}
        />
      </div>

      {error ? <p style={styles.upload__error as any}>{error}</p> : null}
      {uploadStatus ? (
        <p style={styles.upload__status as any}>{uploadStatus}</p>
      ) : null}

      {selected && (selected.kind === "image" || selected.kind === "pdf") ? (
        <div style={styles.upload__preview as any}>
          <div style={styles.upload__previewMeta as any}>
            <div>
              <p style={styles.upload__previewName as any}>{selected.file.name}</p>
              <p style={styles.upload__previewSize as any}>
                {formatBytes(selected.file.size)}
              </p>
            </div>
            <span style={styles.upload__previewBadge as any}>
              {selected.kind === "pdf" ? "PDF" : "IMAGE"}
            </span>
          </div>
          {selected.kind === "image" && selected.previewUrl ? (
            <img
              src={selected.previewUrl}
              alt="Selected medical document"
              style={styles.upload__previewImage as any}
            />
          ) : selected.kind === "pdf" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                backgroundColor: "#f5f5f5",
                borderRadius: "0.5rem",
                fontSize: "3rem",
              }}
            >
              📄
            </div>
          ) : null}
          <div style={styles.upload__previewActions as any}>
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={isProcessing}
            >
              Remove file
            </Button>
            <Button
              type="button"
              style={styles.upload__submit as any}
              disabled={!selected || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? "Scanning..." : "Scan with AI"}
            </Button>
          </div>
        </div>
      ) : (
        <p style={styles.upload__hint as any}>
          Add a file to see the preview and submit for analysis.
        </p>
      )}
    </div>
  );
}

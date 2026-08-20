"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, RotateCcw, X } from "lucide-react";

import useFocusTrap from "~/components/useFocusTrap";
import styles from "./camera-capture.module.css";

type CameraErrorKind = "permission" | "unavailable" | "unknown";
type CameraStatus = "starting" | "ready" | "error";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

const ERROR_COPY: Record<CameraErrorKind, string> = {
  permission:
    "Camera access was denied. Please allow camera access in your browser settings, then retry, or upload a photo instead.",
  unavailable:
    "No rear camera was found on this device. You can upload a photo of your medical record instead.",
  unknown:
    "The camera could not be started. Please try again, or upload a photo instead.",
};

function getCameraError(error: unknown): CameraErrorKind {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "permission";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "unavailable";
    }
  }
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = String((error as { name: unknown }).name);
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "permission";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "unavailable";
    }
  }
  return "unknown";
}

function stopMediaStream(stream: unknown) {
  if (typeof MediaStream === "undefined") return;
  if (stream instanceof MediaStream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [errorKind, setErrorKind] = useState<CameraErrorKind>("unknown");
  const [retryKey, setRetryKey] = useState(0);

  useFocusTrap(rootRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const video = videoRef.current;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorKind(getCameraError(error));
        setStatus("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopMediaStream(video?.srcObject);
      if (video) {
        video.srcObject = null;
      }
    };
  }, [isOpen, retryKey]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    onCapture(canvas.toDataURL("image/jpeg", 0.92));
  }, [onCapture]);

  const handleRetry = useCallback(() => {
    setErrorKind("unknown");
    setStatus("starting");
    setRetryKey((value) => value + 1);
  }, []);

  if (!isOpen) return null;

  const isError = status === "error";
  const errorMessage = ERROR_COPY[errorKind];

  return (
    <div
      ref={rootRef}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Camera capture"
    >
      <div className={styles.viewport}>
        {!isError && (
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
            muted
          >
            <track
              kind="captions"
              label="Camera preview"
              srcLang="en"
              src="data:text/vtt,WEBVTT%0A%0A00:00.000%20--%3E%2000:10.000%0ACamera%20preview"
              default
            />
          </video>
        )}

        {!isError && (
          <p className={styles.hint}>Align your medical record within the frame</p>
        )}

        {status === "starting" && (
          <div className={styles.statusOverlay} role="status">
            <span className={styles.statusSpinner} aria-hidden="true" />
            <span>Requesting camera access...</span>
          </div>
        )}

        {isError && (
          <div className={styles.errorPanel}>
            <div className={styles.errorIcon}>
              <AlertTriangle size={32} strokeWidth={1.75} />
            </div>
            <h2 className={styles.errorTitle}>Camera unavailable</h2>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <div className={styles.errorActions}>
              <button className={styles.retryBtn} onClick={handleRetry} type="button">
                <RotateCcw size={16} /> Retry
              </button>
              <button className={styles.doneBtn} onClick={onClose} type="button">
                Done
              </button>
            </div>
          </div>
        )}

        <button
          className={styles.closeBtn}
          onClick={onClose}
          type="button"
          aria-label="Close camera"
        >
          <X size={22} />
        </button>

        {status === "ready" && (
          <div className={styles.shutterRow}>
            <button
              className={styles.shutterBtn}
              onClick={handleCapture}
              type="button"
              aria-label="Capture photo"
            >
              <span className={styles.shutterInner} />
            </button>
          </div>
        )}

        {status === "starting" && <Camera className={styles.decorIcon} size={96} strokeWidth={1} />}
      </div>
    </div>
  );
}
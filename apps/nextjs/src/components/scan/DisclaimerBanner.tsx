"use client";

import { AlertTriangle, Info } from "lucide-react";

interface DisclaimerBannerProps {
  type?: "info" | "warning" | "medical";
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const defaultMessages = {
  info: "This information is for educational purposes only.",
  warning: "Some information could not be verified against your document.",
  medical:
    "This is not medical advice. Always consult a healthcare professional.",
};

const bannerStyles = {
  info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", Icon: Info },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#d97706",
    Icon: AlertTriangle,
  },
  medical: {
    bg: "#fef2f2",
    border: "#fecaca",
    color: "#dc2626",
    Icon: AlertTriangle,
  },
};

export function DisclaimerBanner({
  type = "medical",
  message,
  dismissible = false,
  onDismiss,
}: DisclaimerBannerProps) {
  const config = bannerStyles[type];
  const { Icon } = config;
  const text = message ?? defaultMessages[type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 12,
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: "0.85rem",
        fontFamily: "var(--font-geist)",
        lineHeight: 1.5,
        color: config.color,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ flex: 1 }}>{text}</span>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: config.color,
            padding: 2,
            opacity: 0.6,
          }}
          type="button"
        >
          &times;
        </button>
      )}
    </div>
  );
}

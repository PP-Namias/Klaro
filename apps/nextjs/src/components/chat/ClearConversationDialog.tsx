"use client";

import { Trash2 } from "lucide-react";

interface ClearConversationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ClearConversationDialog({
  onConfirm,
  onCancel,
  isOpen,
  title = "Clear conversation?",
  description = "This will delete all messages in this conversation. This action cannot be undone.",
  confirmLabel = "Clear",
  cancelLabel = "Cancel",
}: ClearConversationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-dialog-title"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={20} color="#ef4444" />
          </div>
          <h2
            id="clear-dialog-title"
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 600,
              fontFamily: "var(--font-geist)",
            }}
          >
            {title}
          </h2>
        </div>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.9rem",
            color: "#666",
            lineHeight: 1.5,
            fontFamily: "var(--font-geist)",
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #eaeaea",
              background: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-geist)",
              fontSize: "0.9rem",
            }}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-geist)",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

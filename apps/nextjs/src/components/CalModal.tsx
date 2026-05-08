"use client";

import React from "react";

type CalModalProps = {
  open: boolean;
  onClose: () => void;
  url?: string;
};

export function CalModal({
  open,
  onClose,
  url = "https://cal.com/pp-namias/1-hour-session-with-clara?embed=1",
}: Readonly<CalModalProps>) {
  if (!open) return null;

  return (
    <dialog
      open={open}
      className="cal-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="cal-modal"
        style={{
          width: "min(960px, 95%)",
          height: "80%",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "0.5rem 1rem",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>Book a session with Clara</strong>
          <button aria-label="close-cal-modal" onClick={onClose}>
            Close
          </button>
        </div>

        <iframe
          title="Cal.com scheduling"
          src={url}
          style={{ flex: 1, border: 0 }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </dialog>
  );
}

export default CalModal;

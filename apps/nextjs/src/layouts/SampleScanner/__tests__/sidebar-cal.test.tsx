// @vitest-environment jsdom
import React, { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CalModal from "../../../components/CalModal";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

function ModalHarness({ onBooked }: { onBooked?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Book a Doctor
      </button>
      <CalModal
        open={open}
        onClose={() => setOpen(false)}
        onBooked={onBooked}
      />
    </>
  );
}

describe("CalModal integration", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens the modal, lazy-loads the iframe, and loads scheduler", () => {
    render(<ModalHarness />);
    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));

    expect(
      screen.getByRole("dialog", { name: /book a doctor/i }),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /new tab/i }),
    ).not.toBeNull();
    expect(screen.getByTitle("Cal.com scheduling")).not.toBeNull();
  });

  it("closes from the close button and restores the modal state", () => {
    render(<ModalHarness />);
    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));
    fireEvent.click(screen.getByLabelText(/close booking modal/i));

    expect(
      screen.queryByRole("dialog", { name: /book a doctor/i }),
    ).toBeNull();
  });

  it("handles booking messages and stores confirmation", async () => {
    const onBooked = vi.fn();

    render(<ModalHarness onBooked={onBooked} />);
    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "booking.created" },
          origin: "https://cal.com",
        }),
      );
    });

    expect(onBooked).toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: /book a doctor/i }),
    ).toBeNull();
    expect(sessionStorage.getItem("SCAN_CAL_BOOKING")).toContain("cal.com");
  });
});

// @vitest-environment jsdom
import React, { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CalModal from "../../../components/CalModal";

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
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("opens the modal, lazy-loads the iframe, and loads scheduler", async () => {
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));

    expect(screen.getByText(/loading scheduling tool/i)).not.toBeNull();
    expect(screen.getByTitle("Cal.com scheduling-preload")).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(
      screen.getByRole("link", { name: /open in new tab/i }),
    ).not.toBeNull();
  });

  it("closes from the close button and restores the modal state", () => {
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));
    fireEvent.click(screen.getByLabelText(/close booking modal/i));

    expect(screen.queryByRole("dialog", { name: /book a doctor/i })).toBeNull();
  });

  it("handles booking messages and stores confirmation", async () => {
    const onBooked = vi.fn();

    render(<ModalHarness onBooked={onBooked} />);
    fireEvent.click(screen.getByRole("button", { name: /book a doctor/i }));

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "booking.created" },
        origin: "https://cal.com",
      }),
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(onBooked).toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: /book a doctor/i })).toBeNull();
    expect(sessionStorage.getItem("SCAN_CAL_BOOKING")).toContain("cal.com");
  });
});

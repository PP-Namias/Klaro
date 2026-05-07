import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "../Sidebar";

// Basic smoke test: clicking "Book a Doctor" opens the CalModal iframe
describe("Sidebar Cal.com integration", () => {
  it("opens Cal.com modal with iframe when Book a Doctor clicked", () => {
    render(<Sidebar />);

    const button = screen.getByRole("button", { name: /book a doctor/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    const iframe = screen.getByTitle("Cal.com scheduling");
    expect(iframe).toBeInTheDocument();
    // iframe src should include the booking path
    // Note: JSDOM may not load real iframes; we only check the src attribute
    expect(iframe.getAttribute("src")).toMatch(/cal.com\/pp-namias\/1-hour-session-with-clara/);
  });
});

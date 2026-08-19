// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatInput } from "../ChatInput";

const DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("ChatInput", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the textarea and action buttons", () => {
    render(<ChatInput onSend={() => {}} onCameraClick={() => {}} />);
    expect(screen.getByPlaceholderText(/upload a medical document/i)).toBeTruthy();
    expect(screen.getAllByRole("button").length).toBe(3);
  });

  it("sends text content on Enter", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/upload a medical document/i);
    fireEvent.change(textarea, { target: { value: "hello clara" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("hello clara", undefined);
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("shows the external attachment thumbnail and sends it as the image", () => {
    const onSend = vi.fn();
    render(
      <ChatInput
        onSend={onSend}
        externalAttachment={DATA_URL}
        onExternalAttachmentClear={() => {}}
      />,
    );
    const img = screen.getByAltText("Attachment preview") as HTMLImageElement;
    expect(img.src).toBe(DATA_URL);
    const textarea = screen.getByPlaceholderText(/upload a medical document/i);
    fireEvent.change(textarea, { target: { value: "what is this?" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("what is this?", DATA_URL);
  });

  it("clears the external attachment via its remove button", () => {
    const onClear = vi.fn();
    render(
      <ChatInput
        onSend={() => {}}
        externalAttachment={DATA_URL}
        onExternalAttachmentClear={onClear}
      />,
    );
    const removeButtons = screen.getAllByRole("button");
    const remove = removeButtons.find((b) => b.querySelector("svg"));
    fireEvent.click(remove as HTMLElement);
    expect(onClear).toHaveBeenCalled();
  });

  it("does not send when empty and no attachment is present", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText(/upload a medical document/i);
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });
});
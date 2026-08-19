// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ChatMessage as ChatMessageType } from "~/hooks/use-chat";
import { ChatMessage } from "../ChatMessage";

vi.mock("next/image", () => ({
  default: (props: { src?: string; alt?: string }) => (
    <img src={props.src} alt={props.alt} />
  ),
}));

function userMessage(
  overrides: Partial<ChatMessageType> = {},
): ChatMessageType {
  return {
    id: "user-1",
    sender: "user",
    text: "Standard text",
    timestamp: Date.now(),
    ...overrides,
  };
}

function claraMessage(
  overrides: Partial<ChatMessageType> = {},
): ChatMessageType {
  return {
    id: "clara-1",
    sender: "clara",
    text: "Clara answer",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("ChatMessage", () => {
  it("renders standard user text without images", () => {
    render(<ChatMessage message={userMessage()} />);

    expect(screen.getByText("Standard text")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders image attachments alongside user text", () => {
    const image = "data:image/png;base64,mockBase64String123";
    render(
      <ChatMessage
        message={userMessage({ text: "Analyze this scan", image })}
      />,
    );

    expect(screen.getByText("Analyze this scan")).toBeTruthy();
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toBe(image);
    expect(images[0].getAttribute("alt")).toBe("Attached");
  });

  it("renders the Clara avatar alongside assistant text", () => {
    render(<ChatMessage message={claraMessage()} />);

    expect(screen.getByText("Clara answer")).toBeTruthy();
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("alt")).toBe("Clara");
  });

  it("renders both avatar and attachment when Clara carries an image", () => {
    const image = "data:image/jpeg;base64,mockScan123";
    render(<ChatMessage message={claraMessage({ text: "", image })} />);

    expect(screen.getByAltText("Clara")).toBeTruthy();
    const attached = screen.getByAltText("Attached");
    expect(attached.getAttribute("src")).toBe(image);
  });
});

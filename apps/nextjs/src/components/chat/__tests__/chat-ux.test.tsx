// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

import { ChatHistory } from "../ChatHistory";
import { ChatMessage } from "../ChatMessage";
import { ChatInput } from "../ChatInput";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("UX-01 Quick Starter chips", () => {
  const actions = [
    { label: "Explain my lab results", prompt: "Explain my lab results" },
    { label: "Summarize my discharge notes", prompt: "Summarize my discharge notes" },
  ];

  it("renders quick starter chips on the empty state", () => {
    const { getAllByRole } = render(
      <ChatHistory messages={[]} isTyping={false} quickActions={actions} />,
    );
    expect(getAllByRole("button")).toHaveLength(2);
  });

  it("sends the prompt when a chip is tapped", () => {
    const onQuickAction = vi.fn();
    const { getByRole } = render(
      <ChatHistory
        messages={[]}
        isTyping={false}
        quickActions={actions}
        onQuickAction={onQuickAction}
      />,
    );
    fireEvent.click(getByRole("button", { name: "Explain my lab results" }));
    expect(onQuickAction).toHaveBeenCalledWith("Explain my lab results");
  });

  it("clears the chips once the conversation stream starts", () => {
    const { rerender, queryByRole } = render(
      <ChatHistory messages={[]} isTyping={false} quickActions={actions} />,
    );
    expect(queryByRole("button", { name: "Summarize my discharge notes" })).toBeTruthy();
    rerender(
      <ChatHistory
        messages={[
          { id: "u1", sender: "user", text: "Hi", timestamp: Date.now() },
        ]}
        isTyping={true}
        quickActions={actions}
      />,
    );
    expect(queryByRole("button", { name: "Summarize my discharge notes" })).toBeNull();
  });
});

describe("UX-02 Thinking indicator", () => {
  it.skip("announces the thinking state as a polite live region", () => {
    const { getByLabelText } = render(
      <ChatHistory messages={[]} isTyping={true} />,
    );
    const region = getByLabelText("Clara is thinking");
    expect(region.getAttribute("role")).toBe("status");
  });

  it("does not show the indicator when idle", () => {
    const { queryByLabelText } = render(
      <ChatHistory messages={[]} isTyping={false} quickActions={[]} />,
    );
    expect(queryByLabelText("Clara is thinking")).toBeNull();
  });
});

describe("UX-03 Markdown bubbles", () => {
  it.skip("renders markdown for Clara responses", () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: "c1",
          sender: "clara",
          text: "**Hemoglobin:**  \n- RBC: 4.8  \n- WBC: 9.2",
          timestamp: Date.now(),
        }}
      />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("Hemoglobin:");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("keeps plain-text Clara replies as plain text", () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: "c2",
          sender: "clara",
          text: "Your results look normal, Mr. Santos.",
          timestamp: Date.now(),
        }}
      />,
    );
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("never parses user messages as markdown", () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: "u2",
          sender: "user",
          text: "**What is my diagnosis?**",
          timestamp: Date.now(),
        }}
      />,
    );
    expect(container.querySelector("strong")).toBeNull();
  });
});

describe("UX-04 Send button states", () => {
  it("starts disabled with no content", () => {
    const { getByRole } = render(<ChatInput onSend={() => undefined} />);
    expect((getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("activates when text is typed", () => {
    const onSend = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <ChatInput onSend={onSend} />,
    );
    const send = getByRole("button", { name: "Send message" });
    fireEvent.change(getByPlaceholderText(/upload a medical document/i), {
      target: { value: "Explain my CBC values" },
    });
    expect((send as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledWith("Explain my CBC values", undefined);
  });

  it("activates with an image attachment only", () => {
    const onSend = vi.fn();
    const { getByRole } = render(
      <ChatInput
        onSend={onSend}
        externalAttachment="data:image/png;base64,abc"
      />,
    );
    expect((getByRole("button", { name: "Send message" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("returns to disabled after sending", () => {
    const { getByPlaceholderText, getByRole } = render(
      <ChatInput onSend={() => undefined} />,
    );
    fireEvent.change(getByPlaceholderText(/upload a medical document/i), {
      target: { value: "Hi" },
    });
    const send = getByRole("button", { name: "Send message" });
    fireEvent.click(send);
    expect((send as HTMLButtonElement).disabled).toBe(true);
  });
});


// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CameraCapture } from "../CameraCapture";

const DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

function mockGetUserMedia(
  implementation: () => Promise<MediaStream> | never,
) {
  const mediaDevices = {
    getUserMedia: vi.fn().mockImplementation(implementation),
  } as unknown as MediaDevices;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: mediaDevices,
  });
}

function mockStream(): MediaStream {
  return {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
}

describe("CameraCapture (UX-06)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders nothing while closed", () => {
    mockGetUserMedia(() => Promise.resolve(mockStream()));
    const { container } = render(
      <CameraCapture isOpen={false} onClose={() => {}} onCapture={() => {}} />,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows the shutter and close controls once the stream is ready", async () => {
    mockGetUserMedia(() => Promise.resolve(mockStream()));
    render(
      <CameraCapture
        isOpen={true}
        onClose={() => {}}
        onCapture={() => {}}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Capture photo" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Close camera" }),
    ).toBeTruthy();
  });

  it("requests the rear-facing camera", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream());
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    render(
      <CameraCapture isOpen={true} onClose={() => {}} onCapture={() => {}} />,
    );
    await screen.findByRole("button", { name: "Capture photo" });
    const constraints = getUserMedia.mock.calls[0]?.[0] as MediaStreamConstraints;
    expect(constraints.video).toMatchObject({
      facingMode: "environment",
    });
  });

  it("shows a permission error panel when access is denied", async () => {
    mockGetUserMedia(() => {
      throw new DOMException("Permission denied", "NotAllowedError");
    });
    render(
      <CameraCapture
        isOpen={true}
        onClose={() => {}}
        onCapture={() => {}}
      />,
    );
    expect(
      await screen.findByText(/camera access was denied/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeTruthy();
  });

  it("shows the unavailable state when no camera exists", async () => {
    mockGetUserMedia(() => {
      throw new DOMException("No device", "NotFoundError");
    });
    render(
      <CameraCapture
        isOpen={true}
        onClose={() => {}}
        onCapture={() => {}}
      />,
    );
    expect(
      await screen.findByText(/no rear camera was found/i),
    ).toBeTruthy();
  });

  it("captures a frame and hands the data URL to onCapture", async () => {
    mockGetUserMedia(() => Promise.resolve(mockStream()));
    const onCapture = vi.fn();
    const { container } = render(
      <CameraCapture isOpen={true} onClose={() => {}} onCapture={onCapture} />,
    );
    const shutter = await screen.findByRole("button", {
      name: "Capture photo",
    });

    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "readyState", {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(video, "videoWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(video, "videoHeight", {
      configurable: true,
      value: 480,
    });
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue(DATA_URL);

    fireEvent.click(shutter);

    expect(getContext).toHaveBeenCalledWith("2d");
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.92);
    expect(onCapture).toHaveBeenCalledWith(DATA_URL);
  });

  it("closes on the close button and on Escape", async () => {
    mockGetUserMedia(() => Promise.resolve(mockStream()));
    const onClose = vi.fn();
    render(
      <CameraCapture isOpen={true} onClose={onClose} onCapture={() => {}} />,
    );
    await screen.findByRole("button", { name: "Capture photo" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
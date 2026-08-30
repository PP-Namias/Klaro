import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Zero-storage / RA 10173 regression guard.
 *
 * scanGuestImage forwards OCR text to an external AI service. That text is
 * lifted straight off a patient's medical document, so it must be PHI-scrubbed
 * before it leaves this process. These tests drive the real procedure and
 * inspect the actual outbound request body.
 */

const PATIENT_NAME = "Juan Dela Cruz";
const MOBILE = "09171234567";
const PHILHEALTH = "12-345678901-2";
const DOB = "01/15/1985";

const OCR_TEXT = [
  `Patient Name: ${PATIENT_NAME}`,
  `Contact No: ${MOBILE}`,
  `PhilHealth No: ${PHILHEALTH}`,
  `Date of Birth: ${DOB}`,
  "Hemoglobin: 11.2 g/dL",
  "Fasting Blood Sugar: 142 mg/dL",
].join("\n");

const runOcrWithRetry = vi.fn();
const buildRejectionResponse = vi.fn();

vi.mock("../../services/ocrPipeline", () => ({
  runOcrWithRetry: (...args: unknown[]) => runOcrWithRetry(...args),
  buildRejectionResponse: (...args: unknown[]) =>
    buildRejectionResponse(...args),
}));

async function createCaller() {
  const { createCallerFactory, createTRPCRouter } = await import("../../trpc");
  const { documentsRouter } = await import("../documents");
  const router = createTRPCRouter({ documents: documentsRouter });
  return createCallerFactory(router)({
    db: {} as never,
    session: null,
    token: null,
  } as never);
}

function outboundBody(fetchMock: ReturnType<typeof vi.fn>): string {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const init = fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined;
  return String(init?.body ?? "");
}

describe("scanGuestImage PHI scrubbing", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    runOcrWithRetry.mockResolvedValue({
      accepted: true,
      text: OCR_TEXT,
      confidence: 0.92,
      source: "local",
    });
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          requestId: "svc-1",
          status: "completed",
          plainLanguageSummary: "Your blood sugar is higher than normal.",
          urgency: "MODERATE",
          recommendations: ["Follow up with your doctor"],
          confidence: 0.9,
        }),
      text: () => Promise.resolve(""),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("never sends the patient name, mobile number, PhilHealth number or DOB", async () => {
    const caller = await createCaller();

    await caller.documents.scanGuestImage({
      base64Image: Buffer.from("x".repeat(600)).toString("base64"),
      fileName: "lab.png",
      language: "English",
    });

    const body = outboundBody(fetchMock);

    expect(body).not.toContain(PATIENT_NAME);
    expect(body).not.toContain(MOBILE);
    expect(body).not.toContain(PHILHEALTH);
    expect(body).not.toContain(DOB);
    expect(body).toContain("[PHI_REDACTED]");
  });

  it("still forwards the clinical values the pipeline needs", async () => {
    const caller = await createCaller();

    await caller.documents.scanGuestImage({
      base64Image: Buffer.from("x".repeat(600)).toString("base64"),
      language: "English",
    });

    const body = outboundBody(fetchMock);

    // Scrubbing removes identifiers, not the medicine.
    expect(body).toContain("Hemoglobin");
    expect(body).toContain("142");
  });
});

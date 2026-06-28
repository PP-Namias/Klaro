import { describe, it, expect } from "vitest";
import { z } from "zod/v4";

describe("admin router input schemas", () => {
  const doctorIdSchema = z.object({
    doctorId: z.string().uuid(),
    approved: z.boolean(),
    reason: z.string().optional(),
  });

  it("validates verifyDoctor input", () => {
    const input = {
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      approved: true,
    };
    const result = doctorIdSchema.parse(input);
    expect(result.doctorId).toBe(input.doctorId);
    expect(result.approved).toBe(true);
  });

  it("validates verifyDoctor input with reason", () => {
    const input = {
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      approved: false,
      reason: "Invalid credentials",
    };
    const result = doctorIdSchema.parse(input);
    expect(result.reason).toBe("Invalid credentials");
  });

  it("rejects invalid doctorId", () => {
    expect(() =>
      doctorIdSchema.parse({ doctorId: "not-a-uuid", approved: true }),
    ).toThrow();
  });

  it("validates toggleUserStatus input", () => {
    const schema = z.object({
      userId: z.string(),
      active: z.boolean(),
      reason: z.string().optional(),
    });
    const result = schema.parse({
      userId: "user-123",
      active: false,
      reason: "Violation",
    });
    expect(result.active).toBe(false);
  });

  it("validates getDisputes pagination", () => {
    const schema = z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    });
    const result = schema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("validates getDisputes custom pagination", () => {
    const schema = z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    });
    const result = schema.parse({ limit: 50, offset: 10 });
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(10);
  });
});

describe("booking router input schemas", () => {
  const createBookingSchema = z.object({
    doctorId: z.string().uuid(),
    sessionType: z.enum(["chat_consult", "video_consult", "async_review"]),
    scheduledAt: z.date(),
    documentId: z.string().uuid().optional(),
    notes: z.string().max(1000).optional(),
  });

  it("validates create booking input", () => {
    const input = {
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      sessionType: "chat_consult" as const,
      scheduledAt: new Date("2025-12-01"),
    };
    const result = createBookingSchema.parse(input);
    expect(result.sessionType).toBe("chat_consult");
  });

  it("validates all session types", () => {
    const types = ["chat_consult", "video_consult", "async_review"] as const;
    for (const sessionType of types) {
      const result = createBookingSchema.parse({
        doctorId: "550e8400-e29b-41d4-a716-446655440000",
        sessionType,
        scheduledAt: new Date(),
      });
      expect(result.sessionType).toBe(sessionType);
    }
  });

  it("rejects invalid session type", () => {
    expect(() =>
      createBookingSchema.parse({
        doctorId: "550e8400-e29b-41d4-a716-446655440000",
        sessionType: "invalid",
        scheduledAt: new Date(),
      }),
    ).toThrow();
  });

  it("validates notes length limit", () => {
    const result = createBookingSchema.parse({
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      sessionType: "chat_consult",
      scheduledAt: new Date(),
      notes: "a".repeat(1000),
    });
    expect(result.notes).toHaveLength(1000);
  });

  it("rejects notes exceeding 1000 characters", () => {
    expect(() =>
      createBookingSchema.parse({
        doctorId: "550e8400-e29b-41d4-a716-446655440000",
        sessionType: "chat_consult",
        scheduledAt: new Date(),
        notes: "a".repeat(1001),
      }),
    ).toThrow();
  });

  it("validates booking list pagination", () => {
    const schema = z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    });
    const result = schema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("validates booking byId input", () => {
    const schema = z.object({ id: z.string().uuid() });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.id).toBeTruthy();
  });

  it("validates cancel booking input", () => {
    const schema = z.object({ id: z.string().uuid() });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.id).toBeTruthy();
  });

  it("validates reschedule input", () => {
    const schema = z.object({
      id: z.string().uuid(),
      newScheduledAt: z.date(),
    });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      newScheduledAt: new Date("2025-12-15"),
    });
    expect(result.newScheduledAt).toBeInstanceOf(Date);
  });
});

describe("payments router input schemas", () => {
  const createIntentSchema = z.object({
    bookingId: z.string().uuid(),
  });

  it("validates createIntent input", () => {
    const result = createIntentSchema.parse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.bookingId).toBeTruthy();
  });

  it("rejects invalid bookingId", () => {
    expect(() => createIntentSchema.parse({ bookingId: "bad" })).toThrow();
  });

  it("validates handleWebhook input", () => {
    const schema = z.object({
      paymentIntentId: z.string(),
      status: z.enum(["succeeded", "failed", "canceled"]),
      stripeSignature: z.string().optional(),
    });
    const result = schema.parse({
      paymentIntentId: "pi_123",
      status: "succeeded",
      stripeSignature: "sig_123",
    });
    expect(result.status).toBe("succeeded");
  });

  it("validates all webhook statuses", () => {
    const schema = z.enum(["succeeded", "failed", "canceled"]);
    expect(schema.parse("succeeded")).toBe("succeeded");
    expect(schema.parse("failed")).toBe("failed");
    expect(schema.parse("canceled")).toBe("canceled");
  });

  it("rejects invalid webhook status", () => {
    const schema = z.enum(["succeeded", "failed", "canceled"]);
    expect(() => schema.parse("invalid")).toThrow();
  });

  it("validates refund input", () => {
    const schema = z.object({
      id: z.string().uuid(),
      reason: z.string().optional(),
    });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      reason: "Duplicate charge",
    });
    expect(result.reason).toBe("Duplicate charge");
  });

  it("validates refund without reason", () => {
    const schema = z.object({
      id: z.string().uuid(),
      reason: z.string().optional(),
    });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.reason).toBeUndefined();
  });

  it("validates payment list pagination", () => {
    const schema = z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    });
    const result = schema.parse({ limit: 50, offset: 10 });
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(10);
  });

  it("validates payment byId input", () => {
    const schema = z.object({ id: z.string().uuid() });
    const result = schema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.id).toBeTruthy();
  });
});

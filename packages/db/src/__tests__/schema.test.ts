import { describe, it, expect } from "vitest";
import {
  document,
  analysis,
  chatMessage,
  doctor,
  facility,
  booking,
  payment,
  doctorAvailability,
  documentStatusEnum,
  analysisStatusEnum,
  bookingStatusEnum,
  paymentStatusEnum,
  sessionTypeEnum,
  ownershipEnum,
  CreateDocumentSchema,
  CreateAnalysisSchema,
  CreateBookingSchema,
  CreatePaymentSchema,
} from "../schema";

describe("document table", () => {
  it("has id UUID primary key", () => {
    expect(document.id).toBeDefined();
  });

  it("has userId text not null", () => {
    expect(document.userId).toBeDefined();
  });

  it("has fileName varchar 255", () => {
    expect(document.fileName).toBeDefined();
  });

  it("has mimeType varchar 100", () => {
    expect(document.mimeType).toBeDefined();
  });

  it("has fileSize integer", () => {
    expect(document.fileSize).toBeDefined();
  });

  it("has storageUrl text", () => {
    expect(document.storageUrl).toBeDefined();
  });

  it("has status with default uploaded", () => {
    expect(document.status).toBeDefined();
  });

  it("has ocrText text", () => {
    expect(document.ocrText).toBeDefined();
  });

  it("has confidence decimal", () => {
    expect(document.confidence).toBeDefined();
  });

  it("has createdAt timestamp with default", () => {
    expect(document.createdAt).toBeDefined();
  });

  it("has updatedAt timestamp with onUpdate", () => {
    expect(document.updatedAt).toBeDefined();
  });
});

describe("analysis table", () => {
  it("has id UUID primary key", () => {
    expect(analysis.id).toBeDefined();
  });

  it("has documentId UUID with cascade delete", () => {
    expect(analysis.documentId).toBeDefined();
  });

  it("has userId text not null", () => {
    expect(analysis.userId).toBeDefined();
  });

  it("has extractedFields jsonb", () => {
    expect(analysis.extractedFields).toBeDefined();
  });

  it("has flaggedValues jsonb", () => {
    expect(analysis.flaggedValues).toBeDefined();
  });

  it("has plainLanguageSummary text", () => {
    expect(analysis.plainLanguageSummary).toBeDefined();
  });

  it("has tanqmoCard jsonb", () => {
    expect(analysis.tanqmoCard).toBeDefined();
  });

  it("has status with default pending", () => {
    expect(analysis.status).toBeDefined();
  });

  it("has errorMessage text", () => {
    expect(analysis.errorMessage).toBeDefined();
  });
});

describe("chatMessage table", () => {
  it("has id UUID primary key", () => {
    expect(chatMessage.id).toBeDefined();
  });

  it("has analysisId with cascade delete", () => {
    expect(chatMessage.analysisId).toBeDefined();
  });

  it("has role varchar 20", () => {
    expect(chatMessage.role).toBeDefined();
  });

  it("has content text not null", () => {
    expect(chatMessage.content).toBeDefined();
  });

  it("has dialect default Filipino", () => {
    expect(chatMessage.dialect).toBeDefined();
  });
});

describe("doctor table", () => {
  it("has id UUID primary key", () => {
    expect(doctor.id).toBeDefined();
  });

  it("has userId text not null", () => {
    expect(doctor.userId).toBeDefined();
  });

  it("has name varchar 255", () => {
    expect(doctor.name).toBeDefined();
  });

  it("has specialization varchar 255", () => {
    expect(doctor.specialization).toBeDefined();
  });

  it("has licenseNumber unique", () => {
    expect(doctor.licenseNumber).toBeDefined();
  });

  it("has prcStatus default pending", () => {
    expect(doctor.prcStatus).toBeDefined();
  });

  it("has pricePerSession decimal", () => {
    expect(doctor.pricePerSession).toBeDefined();
  });

  it("has isActive default true", () => {
    expect(doctor.isActive).toBeDefined();
  });
});

describe("facility table", () => {
  it("has id UUID primary key", () => {
    expect(facility.id).toBeDefined();
  });

  it("has name varchar 255", () => {
    expect(facility.name).toBeDefined();
  });

  it("has facilityType varchar 100", () => {
    expect(facility.facilityType).toBeDefined();
  });

  it("has ownership default private", () => {
    expect(facility.ownership).toBeDefined();
  });

  it("has address text not null", () => {
    expect(facility.address).toBeDefined();
  });

  it("has latitude decimal", () => {
    expect(facility.latitude).toBeDefined();
  });

  it("has longitude decimal", () => {
    expect(facility.longitude).toBeDefined();
  });

  it("has phoneNumber varchar 20", () => {
    expect(facility.phoneNumber).toBeDefined();
  });

  it("has isPhilHealthAccredited default false", () => {
    expect(facility.isPhilHealthAccredited).toBeDefined();
  });

  it("has acceptedSpecialties jsonb", () => {
    expect(facility.acceptedSpecialties).toBeDefined();
  });

  it("has openingHours jsonb", () => {
    expect(facility.openingHours).toBeDefined();
  });
});

describe("booking table", () => {
  it("has id UUID primary key", () => {
    expect(booking.id).toBeDefined();
  });

  it("has userId text not null", () => {
    expect(booking.userId).toBeDefined();
  });

  it("has doctorId with restrict delete", () => {
    expect(booking.doctorId).toBeDefined();
  });

  it("has documentId with set null delete", () => {
    expect(booking.documentId).toBeDefined();
  });

  it("has sessionType not null", () => {
    expect(booking.sessionType).toBeDefined();
  });

  it("has scheduledAt timestamp not null", () => {
    expect(booking.scheduledAt).toBeDefined();
  });

  it("has status default scheduled", () => {
    expect(booking.status).toBeDefined();
  });

  it("has notes text", () => {
    expect(booking.notes).toBeDefined();
  });
});

describe("payment table", () => {
  it("has id UUID primary key", () => {
    expect(payment.id).toBeDefined();
  });

  it("has bookingId with cascade delete", () => {
    expect(payment.bookingId).toBeDefined();
  });

  it("has userId text not null", () => {
    expect(payment.userId).toBeDefined();
  });

  it("has amount decimal", () => {
    expect(payment.amount).toBeDefined();
  });

  it("has currency default PHP", () => {
    expect(payment.currency).toBeDefined();
  });

  it("has status default pending", () => {
    expect(payment.status).toBeDefined();
  });

  it("has stripePaymentIntentId varchar 255", () => {
    expect(payment.stripePaymentIntentId).toBeDefined();
  });

  it("has failureReason text", () => {
    expect(payment.failureReason).toBeDefined();
  });
});

describe("doctorAvailability table", () => {
  it("has id UUID primary key", () => {
    expect(doctorAvailability.id).toBeDefined();
  });

  it("has doctorId with cascade delete", () => {
    expect(doctorAvailability.doctorId).toBeDefined();
  });

  it("has dayOfWeek varchar 10", () => {
    expect(doctorAvailability.dayOfWeek).toBeDefined();
  });

  it("has startTime varchar 8", () => {
    expect(doctorAvailability.startTime).toBeDefined();
  });

  it("has endTime varchar 8", () => {
    expect(doctorAvailability.endTime).toBeDefined();
  });
});

describe("schema enums", () => {
  it("documentStatusEnum has uploaded", () => {
    expect(documentStatusEnum.enumValues).toContain("uploaded");
  });

  it("documentStatusEnum has processing", () => {
    expect(documentStatusEnum.enumValues).toContain("processing");
  });

  it("documentStatusEnum has analyzed", () => {
    expect(documentStatusEnum.enumValues).toContain("analyzed");
  });

  it("documentStatusEnum has failed", () => {
    expect(documentStatusEnum.enumValues).toContain("failed");
  });

  it("analysisStatusEnum has pending", () => {
    expect(analysisStatusEnum.enumValues).toContain("pending");
  });

  it("analysisStatusEnum has completed", () => {
    expect(analysisStatusEnum.enumValues).toContain("completed");
  });

  it("analysisStatusEnum has error", () => {
    expect(analysisStatusEnum.enumValues).toContain("error");
  });

  it("bookingStatusEnum has scheduled", () => {
    expect(bookingStatusEnum.enumValues).toContain("scheduled");
  });

  it("bookingStatusEnum has confirmed", () => {
    expect(bookingStatusEnum.enumValues).toContain("confirmed");
  });

  it("bookingStatusEnum has in_progress", () => {
    expect(bookingStatusEnum.enumValues).toContain("in_progress");
  });

  it("bookingStatusEnum has completed", () => {
    expect(bookingStatusEnum.enumValues).toContain("completed");
  });

  it("bookingStatusEnum has cancelled", () => {
    expect(bookingStatusEnum.enumValues).toContain("cancelled");
  });

  it("paymentStatusEnum has pending", () => {
    expect(paymentStatusEnum.enumValues).toContain("pending");
  });

  it("paymentStatusEnum has completed", () => {
    expect(paymentStatusEnum.enumValues).toContain("completed");
  });

  it("paymentStatusEnum has failed", () => {
    expect(paymentStatusEnum.enumValues).toContain("failed");
  });

  it("paymentStatusEnum has refunded", () => {
    expect(paymentStatusEnum.enumValues).toContain("refunded");
  });

  it("sessionTypeEnum has chat_consult", () => {
    expect(sessionTypeEnum.enumValues).toContain("chat_consult");
  });

  it("sessionTypeEnum has video_consult", () => {
    expect(sessionTypeEnum.enumValues).toContain("video_consult");
  });

  it("sessionTypeEnum has async_review", () => {
    expect(sessionTypeEnum.enumValues).toContain("async_review");
  });

  it("ownershipEnum has public", () => {
    expect(ownershipEnum.enumValues).toContain("public");
  });

  it("ownershipEnum has private", () => {
    expect(ownershipEnum.enumValues).toContain("private");
  });
});

describe("Zod schemas", () => {
  it("CreateDocumentSchema accepts valid input", () => {
    const result = CreateDocumentSchema.safeParse({
      fileName: "lab-result.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("CreateAnalysisSchema accepts valid input", () => {
    const result = CreateAnalysisSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("CreateBookingSchema accepts valid input", () => {
    const result = CreateBookingSchema.safeParse({
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      sessionType: "chat_consult",
      scheduledAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("CreateBookingSchema rejects invalid sessionType", () => {
    const result = CreateBookingSchema.safeParse({
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      sessionType: "invalid",
      scheduledAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("CreatePaymentSchema accepts valid input", () => {
    const result = CreatePaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("CreatePaymentSchema requires positive amount", () => {
    const result = CreatePaymentSchema.safeParse({
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
      amount: -100,
    });
    expect(result.success).toBe(false);
  });
});

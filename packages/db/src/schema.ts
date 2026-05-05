import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { user } from "./auth-schema";

// Enums
export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "processing",
  "analyzed",
  "failed",
]);

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "completed",
  "error",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const sessionTypeEnum = pgEnum("session_type", [
  "chat_consult",
  "video_consult",
  "async_review",
]);

export const ownershipEnum = pgEnum("ownership", ["public", "private"]);


// Core domain tables
export const document = pgTable(
  "document",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: integer("file_size"),
    storageUrl: text("storage_url"),
    status: documentStatusEnum("status").default("uploaded").notNull(),
    ocrText: text("ocr_text"),
    confidence: decimal("confidence", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("document_user_id_idx").on(t.userId),
    index("document_status_idx").on(t.status),
  ],
);

export const analysis = pgTable(
  "analysis",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    extractedFields: jsonb("extracted_fields"),
    flaggedValues: jsonb("flagged_values"),
    plainLanguageSummary: text("plain_language_summary"),
    tanqmoCard: jsonb("tanqmo_card"),
    status: analysisStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("analysis_document_id_idx").on(t.documentId),
    index("analysis_user_id_idx").on(t.userId),
  ],
);

export const chatMessage = pgTable(
  "chat_message",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analysis.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    dialect: varchar("dialect", { length: 50 }).default("Filipino"), // Filipino, Bisaya, Ilocano
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("chat_message_analysis_id_idx").on(t.analysisId),
    index("chat_message_user_id_idx").on(t.userId),
  ],
);

export const doctor = pgTable(
  "doctor",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    specialization: varchar("specialization", { length: 255 }).notNull(),
    licenseNumber: varchar("license_number", { length: 100 }).notNull().unique(),
    prcStatus: varchar("prc_status", { length: 50 }).default("pending"), // pending, verified, expired
    bio: text("bio"),
    profileImageUrl: text("profile_image_url"),
    pricePerSession: decimal("price_per_session", { precision: 8, scale: 2 }).notNull(),
    availableSessionTypes: jsonb("available_session_types"), // ['chat_consult', 'video_consult', 'async_review']
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("doctor_user_id_idx").on(t.userId),
    index("doctor_prc_status_idx").on(t.prcStatus),
  ],
);

export const facility = pgTable(
  "facility",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    facilityType: varchar("facility_type", { length: 100 }), // hospital, clinic, health_unit
    ownership: ownershipEnum("ownership").default("private").notNull(),
    address: text("address").notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    isPhilHealthAccredited: boolean("is_philhealth_accredited").default(false),
    acceptedSpecialties: jsonb("accepted_specialties"),
    openingHours: jsonb("opening_hours"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("facility_location_idx").on(t.latitude, t.longitude),
    index("facility_type_idx").on(t.facilityType),
    index("facility_ownership_idx").on(t.ownership),
  ],
);


export const booking = pgTable(
  "booking",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctor.id, { onDelete: "restrict" }),
    documentId: uuid("document_id").references(() => document.id, {
      onDelete: "set null",
    }),
    sessionType: sessionTypeEnum("session_type").notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    status: bookingStatusEnum("status").default("scheduled").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("booking_user_id_idx").on(t.userId),
    index("booking_doctor_id_idx").on(t.doctorId),
    index("booking_status_idx").on(t.status),
  ],
);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("PHP"),
    status: paymentStatusEnum("status").default("pending").notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeClientSecret: text("stripe_client_secret"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("payment_booking_id_idx").on(t.bookingId),
    index("payment_user_id_idx").on(t.userId),
    index("payment_status_idx").on(t.status),
  ],
);

// Relations
export const documentRelations = relations(document, ({ one, many }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  analyses: many(analysis),
}));

export const analysisRelations = relations(analysis, ({ one, many }) => ({
  document: one(document, {
    fields: [analysis.documentId],
    references: [document.id],
  }),
  user: one(user, {
    fields: [analysis.userId],
    references: [user.id],
  }),
  chatMessages: many(chatMessage),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  analysis: one(analysis, {
    fields: [chatMessage.analysisId],
    references: [analysis.id],
  }),
  user: one(user, {
    fields: [chatMessage.userId],
    references: [user.id],
  }),
}));

export const doctorAvailability = pgTable(
  "doctor_availability",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctor.id, { onDelete: "cascade" }),
    dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(), // e.g., Monday
    startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS
    endTime: varchar("end_time", { length: 8 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("doctor_availability_doctor_id_idx").on(t.doctorId)],
);

export const doctorRelations = relations(doctor, ({ one, many }) => ({
  user: one(user, {
    fields: [doctor.userId],
    references: [user.id],
  }),
  availability: many(doctorAvailability),
  bookings: many(booking),
}));

export const facilityRelations = relations(facility, ({ many }) => ({
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
  doctor: one(doctor, {
    fields: [booking.doctorId],
    references: [doctor.id],
  }),
  document: one(document, {
    fields: [booking.documentId],
    references: [document.id],
  }),
  payments: many(payment),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  booking: one(booking, {
    fields: [payment.bookingId],
    references: [booking.id],
  }),
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
}));

// Zod Schemas
export const CreateDocumentSchema = z.object({
  fileName: z.string().max(255),
  mimeType: z.string().max(100).optional(),
  fileSize: z.number().optional(),
});

export const CreateAnalysisSchema = z.object({
  documentId: z.uuid(),
  extractedFields: z.record(z.string(), z.any()).optional(),
  flaggedValues: z.array(z.any()).optional(),
});

export const CreateBookingSchema = z.object({
  doctorId: z.uuid(),
  sessionType: z.enum(["chat_consult", "video_consult", "async_review"]),
  scheduledAt: z.date(),
  documentId: z.uuid().optional(),
  notes: z.string().optional(),
});

export const CreatePaymentSchema = z.object({
  bookingId: z.uuid(),
  amount: z.number().positive(),
  currency: z.string().max(3).default("PHP"),
});

export * from "./auth-schema";

import { randomUUID } from "node:crypto";

import { db } from "./client";
import {
  analysis,
  booking,
  document,
  doctor,
  facility,
  payment,
  user,
} from "./schema";

async function seed() {
  const existingUsers = await db.select({ id: user.id }).from(user).limit(1);
  if (existingUsers.length > 0) {
    console.log("Seed skipped: users already exist.");
    return;
  }

  const patientId = randomUUID();
  const doctorUserId = randomUUID();
  const doctorId = randomUUID();
  const facilityId = randomUUID();
  const documentId = randomUUID();
  const analysisId = randomUUID();
  const bookingId = randomUUID();
  const paymentId = randomUUID();

  await db.insert(user).values([
    {
      id: patientId,
      name: "Mia Santos",
      email: "mia.santos@klaro.dev",
      emailVerified: true,
    },
    {
      id: doctorUserId,
      name: "Dr. Luis Navarro",
      email: "luis.navarro@klaro.dev",
      emailVerified: true,
    },
  ]);

  await db.insert(doctor).values({
    id: doctorId,
    userId: doctorUserId,
    name: "Dr. Luis Navarro",
    specialization: "Internal Medicine",
    licenseNumber: "PRC-IM-2024-0917",
    prcStatus: "verified",
    bio: "Focused on preventative care and metabolic health.",
    profileImageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
    pricePerSession: "1500.00",
    availableSessionTypes: ["chat_consult", "video_consult", "async_review"],
    isActive: true,
  });

  await db.insert(facility).values([
    {
      id: facilityId,
      name: "Klaro Wellcare Clinic",
      facilityType: "clinic",
      ownership: "private",
      address: "Ortigas Center, Pasig City",
      latitude: "14.5866",
      longitude: "121.0635",
      phoneNumber: "+63 2 8123 4567",
      isPhilHealthAccredited: true,
      acceptedSpecialties: ["Internal Medicine", "Endocrinology"],
      openingHours: {
        weekdays: "09:00-18:00",
        saturday: "09:00-13:00",
      },
    },
    {
      name: "St. Luke's Medical Center - Quezon City",
      facilityType: "hospital",
      ownership: "private",
      address: "279 E Rodriguez Sr. Ave, Quezon City, 1112 Metro Manila",
      latitude: "14.6225",
      longitude: "121.0242",
      isPhilHealthAccredited: true,
      acceptedSpecialties: ["General Medicine", "Cardiology", "Oncology"],
    },
    {
      name: "Philippine General Hospital (PGH)",
      facilityType: "hospital",
      ownership: "public",
      address: "Taft Ave, Ermita, Manila, 1000 Metro Manila",
      latitude: "14.5771",
      longitude: "120.9884",
      isPhilHealthAccredited: true,
      acceptedSpecialties: ["General Medicine", "Surgery", "Pediatrics"],
    },
    {
      name: "Makati Medical Center",
      facilityType: "hospital",
      ownership: "private",
      address: "2 Amorsolo Street, Legazpi Village, Makati, 1229 Metro Manila",
      latitude: "14.5592",
      longitude: "121.0145",
      isPhilHealthAccredited: true,
      acceptedSpecialties: ["General Medicine", "Neurology", "Gastroenterology"],
    },
  ]);

  await db.insert(document).values({
    id: documentId,
    userId: patientId,
    fileName: "lab-results-jan.pdf",
    mimeType: "application/pdf",
    fileSize: 118000,
    storageUrl: "https://example.com/documents/lab-results-jan.pdf",
    status: "analyzed",
    ocrText: "Glucose 118 mg/dL, Hemoglobin 13.2 g/dL, Creatinine 1.1 mg/dL",
    confidence: "0.92",
  });

  await db.insert(analysis).values({
    id: analysisId,
    documentId,
    userId: patientId,
    extractedFields: {
      glucose: "118 mg/dL",
      hemoglobin: "13.2 g/dL",
      creatinine: "1.1 mg/dL",
    },
    flaggedValues: [
      {
        label: "Glucose",
        value: "118 mg/dL",
        status: "Moderate",
      },
    ],
    plainLanguageSummary:
      "One value is above target, but the rest stay in range.",
    tanqmoCard: {
      title: "Glucose slightly elevated",
      nextStep: "Drink water, retest after fasting, and monitor over time.",
    },
    status: "completed",
  });

  await db.insert(booking).values({
    id: bookingId,
    userId: patientId,
    doctorId,
    documentId,
    sessionType: "chat_consult",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    status: "confirmed",
    notes: "Follow-up on lab results and next steps.",
  });

  await db.insert(payment).values({
    id: paymentId,
    bookingId,
    userId: patientId,
    amount: "1500.00",
    currency: "PHP",
    status: "completed",
  });

  console.log("Seeded Klaro sample data.");
}

try {
  await seed();
  process.exit(0);
} catch (error) {
  console.error("Seed failed", error);
  process.exit(1);
}
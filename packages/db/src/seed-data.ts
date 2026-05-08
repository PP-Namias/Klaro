import { randomUUID } from "node:crypto";

interface SeedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

interface SeedDoctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  prcStatus: "pending" | "verified" | "expired";
  bio?: string;
  profileImageUrl?: string;
  pricePerSession: string;
  availableSessionTypes: ("chat_consult" | "video_consult" | "async_review")[];
  isActive: boolean;
}

interface SeedFacility {
  id?: string;
  name: string;
  facilityType?: string;
  ownership: "public" | "private";
  address: string;
  latitude?: string;
  longitude?: string;
  phoneNumber?: string;
  isPhilHealthAccredited?: boolean;
  acceptedSpecialties?: string[];
  openingHours?: Record<string, string>;
}

interface SeedDocument {
  id: string;
  userId: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  storageUrl?: string;
  status: "uploaded" | "processing" | "analyzed" | "failed";
  ocrText?: string;
  confidence?: string;
}

interface SeedAnalysis {
  id: string;
  documentId: string;
  userId: string;
  extractedFields?: Record<string, string>;
  flaggedValues?: Record<string, string>[];
  plainLanguageSummary?: string;
  tanqmoCard?: Record<string, string>;
  status: "pending" | "completed" | "error";
}

interface SeedBooking {
  id: string;
  userId: string;
  doctorId: string;
  documentId?: string;
  sessionType: "chat_consult" | "video_consult" | "async_review";
  scheduledAt: Date;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

interface SeedPayment {
  id: string;
  bookingId: string;
  userId: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
}

export interface SeedData {
  users: SeedUser[];
  doctors: SeedDoctor[];
  facilities: SeedFacility[];
  documents: SeedDocument[];
  analyses: SeedAnalysis[];
  bookings: SeedBooking[];
  payments: SeedPayment[];
}

export const buildSeedData = (): SeedData => {
  const patientId = randomUUID();

  interface DoctorProfile {
    name: string;
    email: string;
    specialization: string;
    licenseNumber: string;
    prcStatus: "pending" | "verified";
    bio: string;
    profileImageUrl: string;
    pricePerSession: string;
    availableSessionTypes: ("chat_consult" | "video_consult" | "async_review")[];
    isActive: boolean;
  }

  const doctorProfiles: DoctorProfile[] = [
    {
      name: "Dr. Luis Navarro",
      email: "luis.navarro@klaro.dev",
      specialization: "Internal Medicine",
      licenseNumber: "PRC-IM-2024-0917",
      prcStatus: "verified" as const,
      bio: "Focused on preventative care and metabolic health.",
      profileImageUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
      pricePerSession: "1500.00",
      availableSessionTypes: ["chat_consult", "video_consult", "async_review"],
      isActive: true,
    },
    {
      name: "Dr. Camille Reyes",
      email: "camille.reyes@klaro.dev",
      specialization: "Cardiology",
      licenseNumber: "PRC-CARD-2023-1182",
      prcStatus: "verified" as const,
      bio: "Heart health, hypertension, and lifestyle coaching.",
      profileImageUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
      pricePerSession: "2000.00",
      availableSessionTypes: ["video_consult", "chat_consult"],
      isActive: true,
    },
    {
      name: "Dr. Paolo de la Cruz",
      email: "paolo.delacruz@klaro.dev",
      specialization: "Endocrinology",
      licenseNumber: "PRC-ENDO-2022-0441",
      prcStatus: "verified" as const,
      bio: "Specialist in glucose, thyroid, and hormone care.",
      profileImageUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
      pricePerSession: "1800.00",
      availableSessionTypes: ["chat_consult", "async_review", "video_consult"],
      isActive: true,
    },
    {
      name: "Dr. Sofia Lim",
      email: "sofia.lim@klaro.dev",
      specialization: "General Medicine",
      licenseNumber: "PRC-GM-2021-0229",
      prcStatus: "verified" as const,
      bio: "Primary care and wellness screening support.",
      profileImageUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
      pricePerSession: "1200.00",
      availableSessionTypes: ["chat_consult", "async_review"],
      isActive: true,
    },
    {
      name: "Dr. Jaime Ong",
      email: "jaime.ong@klaro.dev",
      specialization: "Gastroenterology",
      licenseNumber: "PRC-GASTRO-2020-307",
      prcStatus: "pending" as const,
      bio: "Digestive health, diet planning, and GI diagnostics.",
      profileImageUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
      pricePerSession: "1700.00",
      availableSessionTypes: ["video_consult", "async_review"],
      isActive: false,
    },
  ];

  const doctorUsers: SeedUser[] = doctorProfiles.map((doctor) => ({
    id: randomUUID(),
    name: doctor.name,
    email: doctor.email,
    emailVerified: true,
  }));

  const doctors: SeedDoctor[] = doctorProfiles.map((doctor, index) => ({
    id: randomUUID(),
    userId: doctorUsers[index]?.id ?? randomUUID(),
    name: doctor.name,
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    prcStatus: doctor.prcStatus,
    bio: doctor.bio,
    profileImageUrl: doctor.profileImageUrl,
    pricePerSession: doctor.pricePerSession,
    availableSessionTypes: doctor.availableSessionTypes,
    isActive: doctor.isActive,
  }));

  const users: SeedUser[] = [
    {
      id: patientId,
      name: "Mia Santos",
      email: "mia.santos@klaro.dev",
      emailVerified: true,
    },
    ...doctorUsers,
  ];

  const documents: SeedDocument[] = [
    {
      id: randomUUID(),
      userId: patientId,
      fileName: "lab-results-jan.pdf",
      mimeType: "application/pdf",
      fileSize: 118000,
      storageUrl: "https://example.com/documents/lab-results-jan.pdf",
      status: "analyzed",
      ocrText: "Glucose 118 mg/dL, Hemoglobin 13.2 g/dL, Creatinine 1.1 mg/dL",
      confidence: "0.92",
    },
    {
      id: randomUUID(),
      userId: patientId,
      fileName: "cbc-panel-feb.pdf",
      mimeType: "application/pdf",
      fileSize: 98000,
      storageUrl: "https://example.com/documents/cbc-panel-feb.pdf",
      status: "analyzed",
      ocrText: "WBC 8.1 x10^9/L, RBC 4.7 x10^12/L, HGB 14.5 g/dL",
      confidence: "0.89",
    },
  ];

  const analyses: SeedAnalysis[] = [
    {
      id: randomUUID(),
      documentId: documents[0]?.id ?? randomUUID(),
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
    },
    {
      id: randomUUID(),
      documentId: documents[1]?.id ?? randomUUID(),
      userId: patientId,
      extractedFields: {
        wbc: "8.1 x10^9/L",
        rbc: "4.7 x10^12/L",
        hgb: "14.5 g/dL",
      },
      flaggedValues: [],
      plainLanguageSummary:
        "Your blood count looks within the normal expected range.",
      tanqmoCard: {
        title: "Maintain healthy habits",
        nextStep: "Continue hydration, sleep, and balanced meals.",
      },
      status: "completed",
    },
  ];

  const bookings: SeedBooking[] = [
    {
      id: randomUUID(),
      userId: patientId,
      doctorId: doctors[0]?.id ?? randomUUID(),
      documentId: documents[0]?.id,
      sessionType: "chat_consult",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      status: "confirmed",
      notes: "Follow-up on lab results and next steps.",
    },
    {
      id: randomUUID(),
      userId: patientId,
      doctorId: doctors[1]?.id ?? randomUUID(),
      documentId: documents[1]?.id,
      sessionType: "video_consult",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      status: "scheduled",
      notes: "Discuss CBC panel and overall wellness plan.",
    },
  ];

  const payments: SeedPayment[] = [
    {
      id: randomUUID(),
      bookingId: bookings[0]?.id ?? randomUUID(),
      userId: patientId,
      amount: doctors[0]?.pricePerSession ?? "1500.00",
      currency: "PHP",
      status: "completed",
    },
  ];

  const facilities: SeedFacility[] = [
    {
      id: randomUUID(),
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
      acceptedSpecialties: [
        "General Medicine",
        "Neurology",
        "Gastroenterology",
      ],
    },
  ];

  return {
    users,
    doctors,
    facilities,
    documents,
    analyses,
    bookings,
    payments,
  };
};

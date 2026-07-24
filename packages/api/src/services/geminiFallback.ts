export interface FallbackConfig {
  enabled: boolean;
  mockDelay?: number;
  logFallback?: boolean;
}

export interface FallbackResult {
  data: Record<string, unknown>;
  isMock: boolean;
  fallbackReason: string;
}

export function getFallbackConfig(): FallbackConfig {
  return {
    enabled: process.env.GEMINI_FALLBACK_ENABLED !== "false",
    mockDelay: parseInt(process.env.GEMINI_MOCK_DELAY || "100", 10),
    logFallback: process.env.GEMINI_LOG_FALLBACK === "true",
  };
}

export function shouldUseFallback(error: any, config: FallbackConfig): boolean {
  if (!config.enabled) return false;

  if (error?.message?.includes("API key not configured")) return true;
  if (error?.code === 429) return true;
  if (error?.code === 500) return true;
  if (error?.code === 503) return true;
  if (error?.message?.includes("UNAVAILABLE")) return true;
  if (error?.message?.includes("RESOURCE_EXHAUSTED")) return true;

  return false;
}

export function generateMockPatientData(): Record<string, unknown> {
  return {
    patientName: "Juan Dela Cruz",
    dateOfBirth: "1985-06-15",
    gender: "Male",
    address: "123 Rizal Street, Quezon City",
    phoneNumber: "+63 917 123 4567",
    email: "juan.delacruz@email.com",
    emergencyContact: {
      name: "Maria Dela Cruz",
      relationship: "Wife",
      phone: "+63 918 765 4321",
    },
    insuranceProvider: "PhilHealth",
    policyNumber: "PH-1234567890",
    diagnosis: ["Hypertension Stage 1", "Type 2 Diabetes Mellitus"],
    medications: [
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
    ],
    allergies: ["Penicillin", "Sulfa drugs"],
    labResults: [
      {
        testName: "Fasting Blood Sugar",
        value: "126",
        unit: "mg/dL",
        referenceRange: "70-100",
      },
      {
        testName: "HbA1c",
        value: "7.2",
        unit: "%",
        referenceRange: "<5.7",
      },
      {
        testName: "Total Cholesterol",
        value: "220",
        unit: "mg/dL",
        referenceRange: "<200",
      },
    ],
    vitalSigns: [
      { type: "Blood Pressure", value: "140/90", unit: "mmHg" },
      { type: "Heart Rate", value: "78", unit: "bpm" },
      { type: "Temperature", value: "36.8", unit: "°C" },
    ],
    medicalHistory: ["Hypertension since 2018", "Diabetes diagnosed 2020"],
    notes: "Patient needs follow-up in 3 months. Continue current medications.",
  };
}

export function generateMockLabResults(): Record<string, unknown> {
  return {
    patientName: "Maria Santos",
    dateOfBirth: "1990-03-22",
    gender: "Female",
    diagnosis: [],
    medications: [],
    allergies: [],
    labResults: [
      {
        testName: "Complete Blood Count",
        value: "12.5",
        unit: "g/dL",
        referenceRange: "12.0-16.0",
      },
      {
        testName: "White Blood Cell Count",
        value: "7500",
        unit: "/uL",
        referenceRange: "4500-11000",
      },
      {
        testName: "Platelet Count",
        value: "250000",
        unit: "/uL",
        referenceRange: "150000-400000",
      },
    ],
    vitalSigns: [{ type: "Blood Pressure", value: "120/80", unit: "mmHg" }],
    medicalHistory: [],
    notes: "All values within normal range.",
  };
}

export async function geminiFallback(
  imageBase64: string,
  documentType?: string,
): Promise<FallbackResult> {
  const config = getFallbackConfig();

  if (!config.enabled) {
    throw new Error("Fallback is disabled");
  }

  if (config.mockDelay && config.mockDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, config.mockDelay));
  }

  const data =
    documentType === "lab_result"
      ? generateMockLabResults()
      : generateMockPatientData();

  if (config.logFallback) {
    console.log(
      "[GeminiFallback] Using mock data for document type:",
      documentType || "unknown",
    );
  }

  return {
    data,
    isMock: true,
    fallbackReason: "API unavailable or key not configured",
  };
}

export function formatFallbackResponse(
  result: FallbackResult,
): Record<string, unknown> {
  return {
    ...result.data,
    _fallback: {
      isMock: result.isMock,
      reason: result.fallbackReason,
      timestamp: new Date().toISOString(),
    },
  };
}

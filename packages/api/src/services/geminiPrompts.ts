export type DocumentType =
  | "lab_result"
  | "prescription"
  | "discharge_summary"
  | "medical_certificate"
  | "imaging_report"
  | "unknown";

export interface MedicalPromptConfig {
  documentType: DocumentType;
  language?: string;
  detailed?: boolean;
}

export function detectDocumentType(text: string): DocumentType {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("laboratory") ||
    lowerText.includes("lab result") ||
    lowerText.includes("blood") ||
    lowerText.includes("urine") ||
    lowerText.includes("specimen") ||
    lowerText.includes("hemoglobin") ||
    lowerText.includes("glucose") ||
    lowerText.includes("cholesterol")
  ) {
    return "lab_result";
  }

  if (
    lowerText.includes("prescription") ||
    lowerText.includes("medication") ||
    lowerText.includes("dosage") ||
    lowerText.includes("tablet") ||
    lowerText.includes("capsule") ||
    lowerText.includes("sig:")
  ) {
    return "prescription";
  }

  if (
    lowerText.includes("discharge") ||
    lowerText.includes("admission") ||
    lowerText.includes("diagnosis") ||
    lowerText.includes("procedure") ||
    lowerText.includes("attending physician")
  ) {
    return "discharge_summary";
  }

  if (
    lowerText.includes("certificate") ||
    lowerText.includes("fit to work") ||
    lowerText.includes("medical certificate")
  ) {
    return "medical_certificate";
  }

  if (
    lowerText.includes("x-ray") ||
    lowerText.includes("mri") ||
    lowerText.includes("ct scan") ||
    lowerText.includes("ultrasound") ||
    lowerText.includes("imaging")
  ) {
    return "imaging_report";
  }

  return "unknown";
}

export function buildSystemPrompt(config: MedicalPromptConfig): string {
  const langInstruction =
    config.language && config.language !== "en"
      ? `Respond in ${config.language}.`
      : "";

  return `You are a medical document analysis AI for Klaro, a Filipino health tech application.
Your task is to extract structured medical data from document images.
${langInstruction}

Rules:
1. Extract ALL visible text and data from the image
2. Map extracted data to the appropriate JSON fields
3. If a field is not found, use null
4. Preserve original values (don't convert units)
5. Include ALL lab tests, medications, and diagnoses found
6. Return ONLY valid JSON, no other text

You must return JSON with this exact structure:
{
  "documentType": "${config.documentType}",
  "patientName": string | null,
  "dateOfBirth": string | null,
  "gender": string | null,
  "address": string | null,
  "phoneNumber": string | null,
  "email": string | null,
  "emergencyContact": {
    "name": string | null,
    "relationship": string | null,
    "phone": string | null
  } | null,
  "insuranceProvider": string | null,
  "policyNumber": string | null,
  "diagnosis": string[],
  "medications": [
    {
      "name": string,
      "dosage": string,
      "frequency": string
    }
  ],
  "allergies": string[],
  "labResults": [
    {
      "testName": string,
      "value": string,
      "unit": string,
      "referenceRange": string
    }
  ],
  "vitalSigns": [
    {
      "type": string,
      "value": string,
      "unit": string
    }
  ],
  "medicalHistory": string[],
  "notes": string | null
}`;
}

export function buildExtractionPrompt(documentType: DocumentType): string {
  const prompts: Record<DocumentType, string> = {
    lab_result: `Focus on extracting:
- All laboratory test results with exact values, units, and reference ranges
- Patient identification information
- Date of the test
- Ordering physician if visible
- Any flagged abnormal values`,

    prescription: `Focus on extracting:
- Medication names (brand and generic if both visible)
- Dosages and frequency
- Duration of treatment
- Prescribing doctor
- Patient name
- Any special instructions`,

    discharge_summary: `Focus on extracting:
- Admission and discharge dates
- Principal diagnosis and secondary diagnoses
- Procedures performed
- Medications at discharge
- Follow-up instructions
- Attending physician`,

    medical_certificate: `Focus on extracting:
- Patient name
- Purpose of certificate
- Findings
- Date of examination
- Validity period
- Physician signature/name`,

    imaging_report: `Focus on extracting:
- Type of imaging study
- Findings
- Impression/conclusion
- Ordering physician
- Date of study`,

    unknown: `Extract all visible medical information including:
- Patient details
- Any test results
- Medications
- Diagnoses
- Dates and physician information`,
  };

  return prompts[documentType] || prompts.unknown;
}

export function buildUserPrompt(
  imageDescription?: string,
  additionalContext?: string,
): string {
  let prompt =
    "Analyze this medical document image and extract all visible data.";

  if (imageDescription) {
    prompt += `\n\nImage description: ${imageDescription}`;
  }

  if (additionalContext) {
    prompt += `\n\nAdditional context: ${additionalContext}`;
  }

  prompt += "\n\nReturn the extracted data as JSON.";

  return prompt;
}

export function validatePromptConfig(config: MedicalPromptConfig): string[] {
  const errors: string[] = [];

  const validTypes: DocumentType[] = [
    "lab_result",
    "prescription",
    "discharge_summary",
    "medical_certificate",
    "imaging_report",
    "unknown",
  ];

  if (!validTypes.includes(config.documentType)) {
    errors.push(`Invalid document type: ${config.documentType}`);
  }

  if (
    config.language &&
    !["en", "fil", "bisaya", "ilocano"].includes(config.language)
  ) {
    errors.push(`Unsupported language: ${config.language}`);
  }

  return errors;
}

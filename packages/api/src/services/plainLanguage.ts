export type LanguageCode = "en" | "fil" | "tl";

export interface PlainLanguageResult {
  plainText: string;
  language: LanguageCode;
  sections: PlainLanguageSection[];
}

export interface PlainLanguageSection {
  title: string;
  content: string;
  items: string[];
}

export interface PlainLanguageOptions {
  language?: LanguageCode;
  readingLevel?: "simple" | "standard" | "detailed";
  includeOriginal?: boolean;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    patientInformation: "Patient Information",
    diagnosis: "Diagnosis",
    medications: "Medications",
    labResults: "Lab Results",
    vitalSigns: "Vital Signs",
    allergies: "Allergies",
    medicalHistory: "Medical History",
    emergencyContact: "Emergency Contact",
    insurance: "Insurance",
    name: "Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    address: "Address",
    phone: "Phone",
    email: "Email",
    dosage: "Dosage",
    frequency: "Frequency",
    test: "Test",
    value: "Value",
    unit: "Unit",
    referenceRange: "Reference Range",
    type: "Type",
    relationship: "Relationship",
    provider: "Provider",
    policyNumber: "Policy Number",
  },
  fil: {
    patientInformation: "Impormasyon ng Pasyente",
    diagnosis: "Diagnosis",
    medications: "Gamot",
    labResults: "Resulta ng Laboratoryo",
    vitalSigns: "Mga Tanda ng Buhay",
    allergies: "Mga Alerhiya",
    medicalHistory: "Kasaysayan ng Kalusugan",
    emergencyContact: "Emergency Contact",
    insurance: "Insurance",
    name: "Pangalan",
    dateOfBirth: "Petsa ng Kapanganakan",
    gender: "Kasarian",
    address: "Address",
    phone: "Telepono",
    email: "Email",
    dosage: "Dosage",
    frequency: "Dalas",
    test: "Test",
    value: "Halaga",
    unit: "Unit",
    referenceRange: "Saklaw ng Reference",
    type: "Uri",
    relationship: "Ugnayan",
    provider: "Provider",
    policyNumber: " Numero ng Policy",
  },
  tl: {
    patientInformation: "Impormasyon ng Pasyente",
    diagnosis: "Diagnosis",
    medications: "Mga Tambal",
    labResults: "Mga Resulta sa Laboratoryo",
    vitalSigns: "Mga Vital Signs",
    allergies: "Mga Alerhiya",
    medicalHistory: "Kaagi nga Pag-ambit",
    emergencyContact: "Emergency Contact",
    insurance: "Insurance",
    name: "Ngalan",
    dateOfBirth: "Adlaw nga Natawhan",
    gender: "Kasarian",
    address: "Address",
    phone: "Telepono",
    email: "Email",
    dosage: "Dosage",
    frequency: "Kadaghan",
    test: "Test",
    value: "Bili",
    unit: "Unit",
    referenceRange: "Sakup sa Reference",
    type: "Tiyip",
    relationship: "Relasyon",
    provider: "Provider",
    policyNumber: "Numero sa Policy",
  },
};

export function getTranslation(language: LanguageCode, key: string): string {
  return translations[language]?.[key] || translations.en[key] || key;
}

export function formatPatientInfoSection(
  data: Record<string, unknown>,
  language: LanguageCode,
): PlainLanguageSection {
  const items: string[] = [];

  if (data.patientName) {
    items.push(`${getTranslation(language, "name")}: ${data.patientName}`);
  }
  if (data.dateOfBirth) {
    items.push(
      `${getTranslation(language, "dateOfBirth")}: ${data.dateOfBirth}`,
    );
  }
  if (data.gender) {
    items.push(`${getTranslation(language, "gender")}: ${data.gender}`);
  }
  if (data.address) {
    items.push(`${getTranslation(language, "address")}: ${data.address}`);
  }
  if (data.phoneNumber) {
    items.push(`${getTranslation(language, "phone")}: ${data.phoneNumber}`);
  }
  if (data.email) {
    items.push(`${getTranslation(language, "email")}: ${data.email}`);
  }

  return {
    title: getTranslation(language, "patientInformation"),
    content: items.join("\n"),
    items,
  };
}

export function formatDiagnosisSection(
  diagnoses: string[],
  language: LanguageCode,
): PlainLanguageSection {
  return {
    title: getTranslation(language, "diagnosis"),
    content: diagnoses.join(", "),
    items: diagnoses,
  };
}

export function formatMedicationsSection(
  medications: { name: string; dosage: string; frequency: string }[],
  language: LanguageCode,
): PlainLanguageSection {
  const items = medications.map(
    (m) => `${m.name} - ${m.dosage} (${m.frequency})`,
  );

  return {
    title: getTranslation(language, "medications"),
    content: items.join("\n"),
    items,
  };
}

export function formatLabResultsSection(
  labResults: {
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
  }[],
  language: LanguageCode,
): PlainLanguageSection {
  const items = labResults.map(
    (l) => `${l.testName}: ${l.value} ${l.unit} (ref: ${l.referenceRange})`,
  );

  return {
    title: getTranslation(language, "labResults"),
    content: items.join("\n"),
    items,
  };
}

export function generatePlainLanguageSummary(
  data: Record<string, unknown>,
  options: PlainLanguageOptions = {},
): PlainLanguageResult {
  const { language = "en" } = options;
  const sections: PlainLanguageSection[] = [];

  sections.push(formatPatientInfoSection(data, language));

  if (Array.isArray(data.diagnosis) && data.diagnosis.length > 0) {
    sections.push(formatDiagnosisSection(data.diagnosis as string[], language));
  }

  if (Array.isArray(data.medications) && data.medications.length > 0) {
    sections.push(
      formatMedicationsSection(
        data.medications as {
          name: string;
          dosage: string;
          frequency: string;
        }[],
        language,
      ),
    );
  }

  if (Array.isArray(data.labResults) && data.labResults.length > 0) {
    sections.push(
      formatLabResultsSection(
        data.labResults as {
          testName: string;
          value: string;
          unit: string;
          referenceRange: string;
        }[],
        language,
      ),
    );
  }

  const plainText = sections
    .map((s) => `${s.title}:\n${s.content}`)
    .join("\n\n");

  return {
    plainText,
    language,
    sections,
  };
}

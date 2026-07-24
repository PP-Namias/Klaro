export interface LabTestResult {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flagged: boolean;
  interpretation: string;
}

export interface LabResultsDemo {
  patientName: string;
  patientAge: number;
  patientSex: string;
  facilityName: string;
  physician: string;
  dateCollected: string;
  dateReported: string;
  summary: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  confidence: number;
  tests: LabTestResult[];
  warnings: string[];
  recommendations: string[];
  tanongMoQuestions: string[];
}

export const labResultsDemo: LabResultsDemo = {
  patientName: "Juan Dela Cruz",
  patientAge: 52,
  patientSex: "Male",
  facilityName: "Klaro Wellcare Clinic",
  physician: "Dr. Luis Navarro",
  dateCollected: "January 15, 2025",
  dateReported: "January 16, 2025",
  summary:
    "Ito ang resulta ng inyong Complete Blood Count (CBC) at Lipid Panel. Ang inyong Fasting Blood Sugar at Total Cholesterol ay nasa mataas na antas. Inirerekomenda naming magbaguhin sa diyeta at mag-ehersisyo. Kung hindi mag-improve sa loob ng 3 buwan, maaaring kailangan ng gamot.",
  urgency: "MODERATE",
  confidence: 0.92,
  tests: [
    {
      name: "Hemoglobin",
      value: "14.2",
      unit: "g/dL",
      referenceRange: "13.5 - 17.5",
      flagged: false,
      interpretation: "Normal — nasa tamang antas ang iyong hemoglobin.",
    },
    {
      name: "White Blood Cell Count",
      value: "9,800",
      unit: "/uL",
      referenceRange: "4,500 - 11,000",
      flagged: false,
      interpretation: "Normal — walang impeksyon na nakikita.",
    },
    {
      name: "Platelet Count",
      value: "245,000",
      unit: "/uL",
      referenceRange: "150,000 - 400,000",
      flagged: false,
      interpretation: "Normal — maayos ang inyong platelet count.",
    },
    {
      name: "Fasting Blood Sugar",
      value: "142",
      unit: "mg/dL",
      referenceRange: "70 - 100",
      flagged: true,
      interpretation:
        "Mataas — maaaring senyales ng pre-diabetes o type 2 diabetes. Kailangan ng follow-up test.",
    },
    {
      name: "Total Cholesterol",
      value: "245",
      unit: "mg/dL",
      referenceRange: "Below 200",
      flagged: true,
      interpretation:
        "Mataas — panganib para sa heart disease. Kailangan ng dietary changes.",
    },
    {
      name: "HDL Cholesterol",
      value: "38",
      unit: "mg/dL",
      referenceRange: "Above 40",
      flagged: true,
      interpretation:
        "Mababa — kulang sa protective cholesterol. Mag-ehersisyo regular.",
    },
    {
      name: "LDL Cholesterol",
      value: "165",
      unit: "mg/dL",
      referenceRange: "Below 130",
      flagged: true,
      interpretation: "Mataas — bad cholesterol ay nasa mapanganib na antas.",
    },
    {
      name: "Triglycerides",
      value: "195",
      unit: "mg/dL",
      referenceRange: "Below 150",
      flagged: true,
      interpretation: "Mataas — bawasan ang pagkain ng matataba at matatamis.",
    },
  ],
  warnings: [
    "Ang inyong Fasting Blood Sugar (142 mg/dL) ay nasa pre-diabetic range. Kailangan ng HbA1c test.",
    "Ang inyong Total Cholesterol (245 mg/dL) ay mataas. Panganib para sa cardiovascular disease.",
    "Ang inyong HDL (38 mg/dL) ay mababa. Kakailangan ng regular na ehersisyo.",
  ],
  recommendations: [
    "Mag-consult sa doktor para sa HbA1c test at cholesterol management plan.",
    "Bawasan ang pagkain ng matataba, matatamis, at maalat. Kumain ng gulay at isda.",
    "Mag-ehersisyo ng 30 minutos araw-araw — tulad ng paglalakad o paglangoy.",
  ],
  tanongMoQuestions: [
    "Doc, ano po ang gagawin ko para bumaba ang cholesterol ko?",
    "Kailangan ko na po bang uminom ng gamot para sa blood sugar?",
    "Ano po ang mga pagkain na dapat kong iwasan?",
    "Gaano kadalas po ako dapat magpa-check up?",
  ],
};

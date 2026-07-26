export interface TerminologyMapping {
  code: string;
  english: string;
  filipino: string;
  bisaya: string;
  ilocano: string;
  description: string;
}

export const TERMINOLOGY_DB: TerminologyMapping[] = [
  {
    code: "HGB",
    english: "Hemoglobin",
    filipino: "Hemoglobin (Dugo)",
    bisaya: "Hemoglobin (Dugo)",
    ilocano: "Hemoglobin (Dugo)",
    description: "Protein in red blood cells that carries oxygen",
  },
  {
    code: "HCT",
    english: "Hematocrit",
    filipino: "Hematocrit (Dugo)",
    bisaya: "Hematocrit (Dugo)",
    ilocano: "Hematocrit (Dugo)",
    description: "Percentage of blood volume that is red blood cells",
  },
  {
    code: "RBC",
    english: "Red Blood Cell Count",
    filipino: "Bilang ng Pulang Selula ng Dugo",
    bisaya: "Kantidad sa Pula nga Selula sa Dugo",
    ilocano: "Bilang ti Nabilang nga Nagnangisit a Selula",
    description: "Number of red blood cells per unit of blood",
  },
  {
    code: "WBC",
    english: "White Blood Cell Count",
    filipino: "Bilang ng Puting Selula ng Dugo",
    bisaya: "Kantidad sa Puti nga Selula sa Dugo",
    ilocano: "Bilang ti Nabilang nga Puti a Selula",
    description: "Number of white blood cells that fight infection",
  },
  {
    code: "PLT",
    english: "Platelet Count",
    filipino: "Bilang ng Platelet",
    bisaya: "Kantidad sa Platelet",
    ilocano: "Bilang ti Platelet",
    description: "Blood cells that help clotting",
  },
  {
    code: "GLU",
    english: "Fasting Blood Sugar",
    filipino: "Asukal sa Dugo (Gabiing Gutom)",
    bisaya: "Asukal sa Dugo (Gabii nga Gutom)",
    ilocano: "Asukal iti Dugo (Tabukaw)",
    description: "Blood sugar level after fasting",
  },
  {
    code: "BUN",
    english: "Blood Urea Nitrogen",
    filipino: "Urea Nitrogen sa Dugo",
    bisaya: "Urea Nitrogen sa Dugo",
    ilocano: "Urea Nitrogen iti Dugo",
    description: "Kidney function test",
  },
  {
    code: "CRE",
    english: "Creatinine",
    filipino: "Creatinine (Bato)",
    bisaya: "Creatinine (Bato)",
    ilocano: "Creatinine (Bato)",
    description: "Kidney function indicator",
  },
  {
    code: "CHOL",
    english: "Total Cholesterol",
    filipino: "Kolesterol",
    bisaya: "Kolesterol",
    ilocano: "Kolesterol",
    description: "Total fat in blood",
  },
  {
    code: "HDL",
    english: "HDL Cholesterol",
    filipino: "Mabuting Kolesterol",
    bisaya: "Maayong Kolesterol",
    ilocano: "Naimbag nga Kolesterol",
    description: "Good cholesterol",
  },
  {
    code: "LDL",
    english: "LDL Cholesterol",
    filipino: "Masamang Kolesterol",
    bisaya: "Dautan nga Kolesterol",
    ilocano: "Naiwaras nga Kolesterol",
    description: "Bad cholesterol",
  },
  {
    code: "TG",
    english: "Triglycerides",
    filipino: "Triglycerides",
    bisaya: "Triglycerides",
    ilocano: "Triglycerides",
    description: "Fat in blood",
  },
  {
    code: "ALT",
    english: "ALT (Liver Enzyme)",
    filipino: "ALT (Enzim ng Atay)",
    bisaya: "ALT (Enzim sa Atay)",
    ilocano: "ALT (Enzim ti Atay)",
    description: "Liver function test",
  },
  {
    code: "AST",
    english: "AST (Liver Enzyme)",
    filipino: "AST (Enzim ng Atay)",
    bisaya: "AST (Enzim sa Atay)",
    ilocano: "AST (Enzim ti Atay)",
    description: "Liver function test",
  },
  {
    code: "UA",
    english: "Uric Acid",
    filipino: "Uric Acid (Bato)",
    bisaya: "Uric Acid (Bato)",
    ilocano: "Uric Acid (Bato)",
    description: "Gout indicator",
  },
  {
    code: "TSH",
    english: "Thyroid Stimulating Hormone",
    filipino: "Hormon ng Teroyd",
    bisaya: "Hormon sa Teroyd",
    ilocano: "Hormon ti Teroyd",
    description: "Thyroid function test",
  },
  {
    code: "NA",
    english: "Sodium",
    filipino: "Sodium (Asin)",
    bisaya: "Sodium (Asin)",
    ilocano: "Sodium (Asin)",
    description: "Electrolyte balance",
  },
  {
    code: "K",
    english: "Potassium",
    filipino: "Potassium (Saging)",
    bisaya: "Potassium (Saging)",
    ilocano: "Potassium (Saging)",
    description: "Electrolyte balance",
  },
  {
    code: "CL",
    english: "Chloride",
    filipino: "Chloride",
    bisaya: "Chloride",
    ilocano: "Chloride",
    description: "Electrolyte balance",
  },
  {
    code: "CA",
    english: "Calcium",
    filipino: "Calcium (Buto)",
    bisaya: "Calcium (Bone)",
    ilocano: "Calcium (Tangob)",
    description: "Bone and muscle health",
  },
  {
    code: "MG",
    english: "Magnesium",
    filipino: "Magnesium",
    bisaya: "Magnesium",
    ilocano: "Magnesium",
    description: "Muscle and nerve function",
  },
];

export function getTerminology(
  code: string,
  _language = "en",
): TerminologyMapping | null {
  const term = TERMINOLOGY_DB.find(
    (t) => t.code.toUpperCase() === code.toUpperCase(),
  );
  if (!term) return null;

  return {
    ...term,
    code: term.code,
    english: term.english,
    filipino: term.filipino,
    bisaya: term.bisaya,
    ilocano: term.ilocano,
  };
}

export function convertToPlainLanguage(
  testCode: string,
  language = "en",
): string {
  const term = getTerminology(testCode, language);
  if (!term) return testCode;

  switch (language) {
    case "fil":
      return term.filipino;
    case "bisaya":
      return term.bisaya;
    case "ilocano":
      return term.ilocano;
    default:
      return term.english;
  }
}

export function getFilipinoTerm(code: string): string {
  return convertToPlainLanguage(code, "fil");
}

export function getBisayaTerm(code: string): string {
  return convertToPlainLanguage(code, "bisaya");
}

export function getIlocanoTerm(code: string): string {
  return convertToPlainLanguage(code, "ilocano");
}

export function batchConvert(
  codes: string[],
  language = "en",
): { code: string; original: string; converted: string }[] {
  return codes.map((code) => ({
    code,
    original: convertToPlainLanguage(code, "en"),
    converted: convertToPlainLanguage(code, language),
  }));
}

export function searchTerminology(query: string): TerminologyMapping[] {
  const lowerQuery = query.toLowerCase();
  return TERMINOLOGY_DB.filter(
    (t) =>
      t.code.toLowerCase().includes(lowerQuery) ||
      t.english.toLowerCase().includes(lowerQuery) ||
      t.filipino.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery),
  );
}

export function getAllTerminology(): TerminologyMapping[] {
  return [...TERMINOLOGY_DB];
}

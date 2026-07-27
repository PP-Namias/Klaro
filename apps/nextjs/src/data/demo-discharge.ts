export interface DischargeMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface DischargeDemo {
  patientName: string;
  patientAge: number;
  patientSex: string;
  facilityName: string;
  admittingPhysician: string;
  department: string;
  dateAdmitted: string;
  dateDischarged: string;
  lengthOfStay: string;
  diagnosis: string;
  procedures: string[];
  summary: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  confidence: number;
  dischargeMedications: DischargeMedication[];
  followUpInstructions: string[];
  warnings: string[];
  recommendations: string[];
  tanongMoQuestions: string[];
}

export const dischargeDemo: DischargeDemo = {
  patientName: "Pedro Reyes",
  patientAge: 67,
  patientSex: "Male",
  facilityName: "St. Luke's Medical Center",
  admittingPhysician: "Dr. Carlo Mendoza",
  department: "Internal Medicine",
  dateAdmitted: "January 10, 2025",
  dateDischarged: "January 15, 2025",
  lengthOfStay: "5 araw",
  diagnosis:
    "Community-Acquired Pneumonia, Severity II — Confined due to high fever, difficulty breathing, and chest X-ray showing right lower lobe infiltration.",
  procedures: [
    "Chest X-ray (PA and Lateral)",
    "Complete Blood Count (CBC)",
    "Sputum Culture and Sensitivity",
    "IV Antibiotic Therapy (Ceftriaxone + Azithromycin)",
    "Oxygen Therapy (nasal cannula 2-4L/min)",
    "Pulse Oximetry Monitoring",
  ],
  summary:
    "Ito ang discharge summary ni Pedro Reyes, 67 taong gulang, na na-confine sa St. Luke's Medical Center dahil sa pneumonia. Siya ay na-confine ng 5 araw at gumamit ng IV antibiotics at oxygen therapy. Siya ay naka-discharge na may magandang improvement — normal na ang kanyang temperature, oxygen saturation ay 96%, at walang hirap sa paghinga. May mga gamot na ibinigay para sa bahay at follow-up schedule sa loob ng 2 linggo.",
  urgency: "MODERATE",
  confidence: 0.89,
  dischargeMedications: [
    {
      name: "Amoxicillin-Clavulanate",
      dosage: "625mg",
      frequency: "3x a day",
      duration: "7 araw (natitira)",
    },
    {
      name: "Ambroxol",
      dosage: "30mg",
      frequency: "3x a day",
      duration: "5 araw",
    },
    {
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "Kung kailangan",
      duration: "Hanggang gumaling",
    },
  ],
  followUpInstructions: [
    "Magpabalik sa Internal Medicine clinic sa loob ng 2 linggo (January 29, 2025).",
    "Magpa-Chest X-ray muli pagkatapos ng 1 buwan para makita kung gumaling na ang baga.",
    "Kumain ng masustansyang pagkain at uminom ng maraming tubig.",
    "Iwasan ang usok, alak, at malamig na hangin.",
    "Kung may lagnat muli o hirap sa paghinga, agad na pumunta sa ER.",
  ],
  warnings: [
    "Huwag i-stop ang antibiotics nang hindi tinatapos ang buong kurso.",
    "Kung may lagnat (above 38.5°C) o hirap sa paghinga, agad na magpunta sa ospital.",
    "Iwasan ang pagiging exposed sa mga taong may sakit sa paghinga.",
  ],
  recommendations: [
    "Tapusin ang buong kurso ng antibiotics ayon sa schedule.",
    "Magpahinga ng sapat at iwasan ang matinding pisikal na aktibidad sa loob ng 1 linggo.",
    "Regular na mag-monitor ng body temperature araw-araw.",
    "Mag-quit sa paninigarilyo kung naninigarilyo — nakakapagpahina ng baga.",
    "Magpabalik agad kung lumala ang sintomas.",
  ],
  tanongMoQuestions: [
    "Doc, kailan po ako totally gumaling sa pneumonia?",
    "Pwede na po ba akong magtrabaho pagka-discharge?",
    "Ano po ang mga dapat kong iwasan habang nagre-recover?",
    "Kailangan ko pa po bang magpa-check up kahit na gumaling na ako?",
  ],
};

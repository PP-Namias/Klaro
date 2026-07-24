import type { DischargeDemo } from "./demo-discharge";
import type { LabResultsDemo } from "./demo-lab-results";
import type { OtherDocDemo } from "./demo-other-docs";
import type { PrescriptionDemo } from "./demo-prescriptions";

export const labResultsEnglish: Partial<LabResultsDemo> = {
  summary:
    "This is the result of your Complete Blood Count (CBC) and Lipid Panel. Your Fasting Blood Sugar and Total Cholesterol are elevated. We recommend dietary changes and regular exercise. If there is no improvement within 3 months, medication may be needed.",
  tests: [
    {
      name: "Hemoglobin",
      value: "14.2",
      unit: "g/dL",
      referenceRange: "13.5 - 17.5",
      flagged: false,
      interpretation: "Normal — your hemoglobin level is within range.",
    },
    {
      name: "White Blood Cell Count",
      value: "9,800",
      unit: "/uL",
      referenceRange: "4,500 - 11,000",
      flagged: false,
      interpretation: "Normal — no signs of infection detected.",
    },
    {
      name: "Platelet Count",
      value: "245,000",
      unit: "/uL",
      referenceRange: "150,000 - 400,000",
      flagged: false,
      interpretation: "Normal — your platelet count is healthy.",
    },
    {
      name: "Fasting Blood Sugar",
      value: "142",
      unit: "mg/dL",
      referenceRange: "70 - 100",
      flagged: true,
      interpretation:
        "High — may indicate pre-diabetes or type 2 diabetes. A follow-up test is needed.",
    },
    {
      name: "Total Cholesterol",
      value: "245",
      unit: "mg/dL",
      referenceRange: "Below 200",
      flagged: true,
      interpretation:
        "High — poses risk for heart disease. Dietary changes are recommended.",
    },
    {
      name: "HDL Cholesterol",
      value: "38",
      unit: "mg/dL",
      referenceRange: "Above 40",
      flagged: true,
      interpretation:
        "Low — below protective cholesterol levels. Regular exercise is advised.",
    },
    {
      name: "LDL Cholesterol",
      value: "165",
      unit: "mg/dL",
      referenceRange: "Below 130",
      flagged: true,
      interpretation: "High — bad cholesterol is at a dangerous level.",
    },
    {
      name: "Triglycerides",
      value: "195",
      unit: "mg/dL",
      referenceRange: "Below 150",
      flagged: true,
      interpretation: "High — reduce intake of fatty and sugary foods.",
    },
  ],
  warnings: [
    "Your Fasting Blood Sugar (142 mg/dL) is in the pre-diabetic range. An HbA1c test is recommended.",
    "Your Total Cholesterol (245 mg/dL) is high. Risk for cardiovascular disease.",
    "Your HDL (38 mg/dL) is low. Regular exercise is needed.",
  ],
  recommendations: [
    "Consult your doctor for an HbA1c test and cholesterol management plan.",
    "Reduce intake of fatty, sugary, and salty foods. Eat more vegetables and fish.",
    "Exercise for 30 minutes daily — such as walking or swimming.",
  ],
  tanongMoQuestions: [
    "Doctor, what should I do to lower my cholesterol?",
    "Do I need to take medication for my blood sugar now?",
    "What foods should I avoid?",
    "How often should I have a check-up?",
  ],
};

export const prescriptionEnglish: Partial<PrescriptionDemo> = {
  summary:
    "This is the prescription for your flu medication. Two medicines were given — an antibiotic for the infection and a medicine for fever and body aches. Follow the correct dosage and complete the full course of antibiotics even if you feel better.",
  medicines: [
    {
      name: "Amoxicillin",
      genericName: "Amoxicillin Trihydrate",
      dosage: "500mg",
      frequency: "3x a day (morning, noon, evening)",
      duration: "7 days",
      instructions:
        "Take after food. Do not skip doses. Complete the full 7 days even if you feel better.",
      warnings: [
        "Do not take if allergic to penicillin",
        "May cause diarrhea — take probiotics",
      ],
    },
    {
      name: "Paracetamol",
      genericName: "Acetaminophen",
      dosage: "500mg",
      frequency: "As needed (PRN) — up to 3x a day",
      duration: "5 days or until better",
      instructions:
        "Take when you have fever (above 38°C) or body pain. Do not exceed 3 doses per day.",
      warnings: [
        "Do not drink alcohol while taking this",
        "Consult your doctor if you have liver problems",
      ],
    },
  ],
  recommendations: [
    "Drink plenty of water and rest well.",
    "Avoid cold food and drinks.",
    "Eat soft food and avoid spicy dishes.",
    "If not better within 5 days, return to your doctor.",
    "Do not self-medicate with other drugs without consulting your doctor.",
  ],
  tanongMoQuestions: [
    "Doctor, how long before my flu gets better?",
    "Can I go to work while taking this medicine?",
    "What are the side effects of Amoxicillin?",
    "Do I need to come back for a follow-up?",
  ],
};

export const dischargeEnglish: Partial<DischargeDemo> = {
  summary:
    "This is the discharge summary of Pedro Reyes, 67 years old, who was confined at St. Luke's Medical Center due to pneumonia. He was confined for 5 days and used IV antibiotics and oxygen therapy. He has been discharged with significant improvement — normal temperature, oxygen saturation at 96%, and no difficulty breathing. Medications were given for home use with a follow-up schedule within 2 weeks.",
  followUpInstructions: [
    "Return to the Internal Medicine clinic within 2 weeks (January 29, 2025).",
    "Have another Chest X-ray after 1 month to check lung recovery.",
    "Eat nutritious food and drink plenty of water.",
    "Avoid smoke, alcohol, and cold wind.",
    "Go to the ER immediately if you have fever again or difficulty breathing.",
  ],
  warnings: [
    "Do not stop antibiotics without completing the full course.",
    "If you have a fever (above 38.5°C) or difficulty breathing, go to the hospital immediately.",
    "Avoid exposure to people with respiratory illnesses.",
  ],
  recommendations: [
    "Complete the full course of antibiotics as scheduled.",
    "Rest adequately and avoid strenuous physical activity for 1 week.",
    "Monitor body temperature daily.",
    "Quit smoking if you smoke — it weakens the lungs.",
    "Return immediately if symptoms worsen.",
  ],
  tanongMoQuestions: [
    "Doctor, when will I fully recover from pneumonia?",
    "Can I go back to work right after discharge?",
    "What should I avoid while recovering?",
    "Do I still need check-ups even if I feel better?",
  ],
};

export const otherDocEnglish: Partial<OtherDocDemo> = {
  summary:
    "This is the result of your Chest X-Ray. The result is normal — no abnormalities detected in your lungs, heart, or rib cage. Lung fields are clear and the heart is of normal size. No additional tests or medication needed.",
  recommendations: [
    "Your chest X-ray result is normal — nothing to worry about.",
    "Continue with a healthy lifestyle and regular exercise.",
    "If you experience chest pain or difficulty breathing, see your doctor.",
  ],
  tanongMoQuestions: [
    "Doctor, is my chest X-ray really normal?",
    "Do I need any other tests besides the chest X-ray?",
    "How often should I have an X-ray?",
  ],
};

export const ecgReportEnglish: Partial<OtherDocDemo> = {
  summary:
    "This is the result of your Electrocardiogram (ECG). A slight abnormality was detected — sinus rhythm with ST-segment changes that may indicate myocardial ischemia. Additional tests such as echocardiogram and stress test are needed to confirm.",
  warnings: [
    "ST-segment changes in lateral leads (V4-V6) — may indicate heart muscle ischemia.",
    "Echocardiogram and stress test are needed to confirm.",
  ],
  recommendations: [
    "Return to your cardiologist immediately for follow-up tests.",
    "Avoid strenuous physical activity until evaluation is complete.",
    "If you experience chest pain, difficulty breathing, or sweating — go to the ER immediately.",
    "Avoid alcohol, cigarettes, and fatty foods.",
  ],
  tanongMoQuestions: [
    "Doctor, is my ECG result dangerous?",
    "What are echocardiogram and stress test?",
    "Can I still exercise while waiting for follow-up?",
    "What symptoms should I watch out for?",
  ],
};

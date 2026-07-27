export interface OtherDocField {
  key: string;
  value: string;
}

export interface OtherDocDemo {
  documentType: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  facilityName: string;
  physician: string;
  dateIssued: string;
  summary: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  confidence: number;
  extractedFields: OtherDocField[];
  warnings: string[];
  recommendations: string[];
  tanongMoQuestions: string[];
}

export const xrayReportDemo: OtherDocDemo = {
  documentType: "Chest X-Ray Report",
  patientName: "Ana Villanueva",
  patientAge: 28,
  patientSex: "Female",
  facilityName: "Makati Medical Center",
  physician: "Dr. Romeo Garcia (Radiologist)",
  dateIssued: "January 18, 2025",
  summary:
    "Ito ang resulta ng inyong Chest X-Ray. Normal ang resulta — walang nakitang abnormal sa inyong baga, puso, o butong dibdib. Malinis ang lung fields at nasa tamang laki ang heart. Hindi kailangan ng karagdagang test o gamot.",
  urgency: "LOW",
  confidence: 0.94,
  extractedFields: [
    { key: "Examination", value: "Chest X-Ray (PA and Lateral)" },
    { key: "Clinical Indication", value: "Routine pre-employment checkup" },
    { key: "Lung Fields", value: "Clear bilaterally, no consolidation" },
    { key: "Heart Size", value: "Normal (CTR < 0.5)" },
    { key: "Mediastinum", value: "Normal, no widening" },
    { key: "Bony Thorax", value: "No fractures or lesions" },
    { key: "Diaphragm", value: "Normal contour, costophrenic angles sharp" },
    { key: "Impression", value: "Normal chest radiograph" },
  ],
  warnings: [],
  recommendations: [
    "Normal ang resulta ng inyong chest X-ray — walang kailangan ipag-alala.",
    "Ipagpatuloy ang healthy lifestyle at regular na exercise.",
    "Kung may nararamdamang sakit sa dibdib o hirap sa paghinga, magpabalik sa doktor.",
  ],
  tanongMoQuestions: [
    "Doc, normal po ba talaga ang chest X-ray ko?",
    "May iba pa po bang kailangan gawin bukod sa chest X-ray?",
    "Kailan po ulit ako dapat magpa-X-ray?",
  ],
};

export const ecgReportDemo: OtherDocDemo = {
  documentType: "ECG / Electrocardiogram Report",
  patientName: "Roberto Cruz",
  patientAge: 58,
  patientSex: "Male",
  facilityName: "Philippine General Hospital",
  physician: "Dr. Sofia Lim (Cardiologist)",
  dateIssued: "January 22, 2025",
  summary:
    "Ito ang resulta ng inyong Electrocardiogram (ECG). May nakitang bahagyang abnormality — sinus rhythm ngunit may ST-segment changes na maaaring senyales ng myocardial ischemia. Kailangan ng follow-up test tulad ng echocardiogram at stress test para masiguro.",
  urgency: "MODERATE",
  confidence: 0.87,
  extractedFields: [
    { key: "Heart Rate", value: "78 bpm (Normal)" },
    { key: "Rhythm", value: "Normal Sinus Rhythm" },
    { key: "PR Interval", value: "180 ms (Normal)" },
    { key: "QRS Duration", value: "100 ms (Normal)" },
    { key: "QT Interval", value: "420 ms (Normal)" },
    { key: "ST Segments", value: "Mild depression in leads V4-V6" },
    { key: "T Waves", value: "Flat in lateral leads" },
    { key: "Axis", value: "Normal" },
    {
      key: "Impression",
      value: "Sinus rhythm with ST changes — consider ischemia",
    },
  ],
  warnings: [
    "May ST-segment changes sa lateral leads (V4-V6) — maaaring senyales ng heart muscle ischemia.",
    "Kailangan ng echocardiogram at stress test para makumpirma.",
  ],
  recommendations: [
    "Agad na magpabalik sa cardiologist para sa follow-up tests.",
    "Iwasan ang matinding pisikal na aktibidad hanggang hindi natatapos ang evaluation.",
    "Kung may chest pain, hirap sa paghinga, o pawis — agad na pumunta sa ER.",
    "Iwasan ang alak, sigarilyo, at matatabang pagkain.",
  ],
  tanongMoQuestions: [
    "Doc, delikado po ba ang resulta ng ECG ko?",
    "Ano po ang echocardiogram at stress test?",
    "Pwede pa po ba akong mag-ehersisyo habang naghihintay ng follow-up?",
    "Ano po ang mga senyales na dapat kong bantayan?",
  ],
};

export interface PrescriptionMedicine {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  warnings: string[];
}

export interface PrescriptionDemo {
  patientName: string;
  patientAge: number;
  patientSex: string;
  physician: string;
  physicianSpecialty: string;
  facilityName: string;
  dateIssued: string;
  diagnosis: string;
  summary: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  confidence: number;
  medicines: PrescriptionMedicine[];
  recommendations: string[];
  tanongMoQuestions: string[];
}

export const prescriptionDemo: PrescriptionDemo = {
  patientName: "Maria Santos",
  patientAge: 34,
  patientSex: "Female",
  physician: "Dr. Anna Reyes",
  physicianSpecialty: "Family Medicine",
  facilityName: "Klaro Wellcare Clinic",
  dateIssued: "January 20, 2025",
  diagnosis: "Acute Upper Respiratory Tract Infection",
  summary:
    "Ito ang reseta para sa inyong sakit na trangkaso. May dalawang gamot na ibinigay — isang antibiotic para sa impeksyon at isang gamot para sa lagnat at sakit ng katawan. Sundin ang tamang dosage at tapusin ang buong kurso ng antibiotic kahit na gumaling na kayo.",
  urgency: "LOW",
  confidence: 0.95,
  medicines: [
    {
      name: "Amoxicillin",
      genericName: "Amoxicillin Trihydrate",
      dosage: "500mg",
      frequency: "3x a day (umaga, tanghali, gabi)",
      duration: "7 araw",
      instructions:
        "Inumin pagkatapos ng pagkain. Huwag skip doses. Tapusin ang buong 7 araw kahit na gumaling na.",
      warnings: [
        "Huwag inumin kung allergic sa penicillin",
        "Maaaring maging sanhi ng pagtatae — uminom ng probiotics",
      ],
    },
    {
      name: "Paracetamol",
      genericName: "Acetaminophen",
      dosage: "500mg",
      frequency: "Kung kailangan (PRN) — hanggang 3x a day",
      duration: "5 araw o hanggang gumaling",
      instructions:
        "Inumin kapag may lagnat (above 38°C) o sakit ng katawan. Huwag uminom ng higit sa 3 doses sa isang araw.",
      warnings: [
        "Huwag uminom ng may alcohol",
        "Kung may problema sa atay, kumonsulta muna sa doktor",
      ],
    },
  ],
  recommendations: [
    "Uminom ng maraming tubig at pahinga ng maayos.",
    "Iwasan ang malamig na pagkain at inumin.",
    "Kumain ng malambot na pagkain at hindi maanghang.",
    "Kung hindi gumaling sa loob ng 5 araw, magpabalik sa doktor.",
    "Wag self-medicate ng ibang gamot nang hindi nagtatanong sa doktor.",
  ],
  tanongMoQuestions: [
    "Doc, gaano katagal bago gumaling ang trangkaso ko?",
    "Pwede po bang pumasok sa trabaho habang umiinom ng gamot?",
    "Ano po ang mga side effects ng Amoxicillin?",
    "Kailangan ko pa po bang magpabalik para sa follow-up?",
  ],
};

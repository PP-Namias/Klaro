import { labResultsDemo, type LabResultsDemo } from "./demo-lab-results";
import {
  prescriptionDemo,
  type PrescriptionDemo,
} from "./demo-prescriptions";
import { dischargeDemo, type DischargeDemo } from "./demo-discharge";
import {
  xrayReportDemo,
  ecgReportDemo,
  type OtherDocDemo,
} from "./demo-other-docs";

export type DemoType = "lab" | "prescription" | "discharge" | "other";

export interface DemoDataMap {
  lab: LabResultsDemo;
  prescription: PrescriptionDemo;
  discharge: DischargeDemo;
  other: OtherDocDemo;
}

export const demoData: DemoDataMap = {
  lab: labResultsDemo,
  prescription: prescriptionDemo,
  discharge: dischargeDemo,
  other: xrayReportDemo,
};

export const demoSecondaryData: Record<string, OtherDocDemo> = {
  xray: xrayReportDemo,
  ecg: ecgReportDemo,
};

export function getDemoData(type: DemoType): DemoDataMap[DemoType] {
  return demoData[type];
}

export function getDemoTitle(type: DemoType): string {
  const titles: Record<DemoType, string> = {
    lab: "Lab Results — Sample Demo",
    prescription: "Prescription — Sample Demo",
    discharge: "Discharge Summary — Sample Demo",
    other: "Medical Document — Sample Demo",
  };
  return titles[type];
}

export function getDemoDescription(type: DemoType): string {
  const descriptions: Record<DemoType, string> = {
    lab: "Ito ay isang halimbawa ng lab results na na-scan at na-analyze ni Clara. Makikita mo kung paano namin nililinaw ang mga resulta at ibinibigay ang mga rekomendasyon.",
    prescription: "Ito ay isang halimbawa ng reseta na na-scan at na-interpret ni Clara. Makikita mo kung paano namin inilalarawan ang mga gamot at instruksyon.",
    discharge: "Ito ay isang halimbawa ng discharge summary na na-scan at na-summarize ni Clara. Makikita mo kung paano namin binibreak down ang mga hospital notes.",
    other: "Ito ay isang halimbawa ng medical document (X-Ray, ECG, atbp.) na na-scan at na-extract ni Clara. Makikita mo kung paano namin binabasa ang mga resulta.",
  };
  return descriptions[type];
}

export type {
  LabResultsDemo,
  PrescriptionDemo,
  DischargeDemo,
  OtherDocDemo,
};

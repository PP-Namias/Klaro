import { z } from "zod/v4";

export { signInInputSchema, sessionSchema, logoutResponseSchema } from "./auth";
export * from "./extraction";
export * from "./llm";
export * from "./documents";
export * from "./facilities";
export type { SignInInput, Session, LogoutResponse } from "./auth";

export {
  uploadDocumentInputSchema,
  uploadDocumentSchema,
  documentStatusEnum,
  documentSchema,
  uploadResponseSchema,
  uploadDocumentResponseSchema,
} from "./documents";
export type {
  UploadDocumentInput,
  UploadDocumentRequest,
  Document,
  UploadResponse,
  UploadDocumentResponse,
} from "./documents";

export {
  facilityTypeEnum,
  facilityTypeOrder,
  facilityTypeRank,
  searchNearbySchema,
  medicalContextSchema,
  recommendByTestResultsSchema,
  facilityResponseSchema,
} from "./facilities";
export type {
  FacilityType,
  SearchNearbyInput,
  MedicalContextInput,
  RecommendByTestResultsInput,
  FacilityResponse,
} from "./facilities";

export {
  aiScanAnalysisSchema,
  analyzeScanInputSchema,
  scanUrgencySchema,
  scanLanguageSchema,
  scanStatusSchema,
  scanGuestInputSchema,
  scanGuestAnalysisSchema,
  scanGuestResponseSchema,
} from "./scan-analysis";
export type {
  AIScanAnalysis,
  AnalyzeScanInput,
  ScanGuestInput,
  ScanGuestResponse,
} from "./scan-analysis";

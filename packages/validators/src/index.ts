import { z } from "zod/v4";

export const unused = z.string().describe(
  `This lib is currently not used as we use drizzle-zod for simple schemas
   But as your application grows and you need other validators to share
   with back and frontend, you can put them in here
  `,
);

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
} from "./scan-analysis";
export type { AIScanAnalysis, AnalyzeScanInput } from "./scan-analysis";

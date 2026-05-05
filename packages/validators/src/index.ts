import { z } from "zod/v4";

export const unused = z.string().describe(
  `This lib is currently not used as we use drizzle-zod for simple schemas
   But as your application grows and you need other validators to share
   with back and frontend, you can put them in here
  `,
);

export { signInInputSchema, sessionSchema, logoutResponseSchema } from "./auth";
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
  facilityResponseSchema,
} from "./facilities";
export type {
  FacilityType,
  SearchNearbyInput,
  FacilityResponse,
} from "./facilities";

import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { consentRecord } from "../schema";

/**
 * The consent record proves a user accepted the Terms of Service, Terms &
 * Conditions and medical disclaimer before any document was read (RA 10173).
 * It must never become a place where medical content accumulates.
 */
describe("consent_record table", () => {
  const columns = Object.keys(getTableColumns(consentRecord));

  it("exposes only non-medical consent metadata", () => {
    expect(columns.sort()).toEqual(
      [
        "acceptedAt",
        "createdAt",
        "id",
        "ipAddress",
        "sessionId",
        "termsVersion",
        "userAgent",
        "userId",
      ].sort(),
    );
  });

  it("contains no PHI or medical columns", () => {
    const forbidden = [
      "ocrText",
      "extractedFields",
      "flaggedValues",
      "plainLanguageSummary",
      "tanqmoCard",
      "storageUrl",
      "fileName",
      "content",
      "patientName",
    ];

    for (const name of forbidden) {
      expect(columns).not.toContain(name);
    }
  });

  it("allows guest consent by leaving userId nullable", () => {
    expect(consentRecord.userId.notNull).toBe(false);
    expect(consentRecord.termsVersion.notNull).toBe(true);
  });
});

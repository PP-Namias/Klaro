import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { db } from "@klaro/db/client";
import { facility } from "@klaro/db/schema";

import {
  enrichFacilityWithGeocode,
  parseDohFacilitiesCsv,
} from "../services/facilityImport";

const fileOrUrlPattern = /^https?:\/\//i;

const loadCsvSource = async (source: string) => {
  if (fileOrUrlPattern.test(source)) {
    const response = await fetch(source, {
      headers: {
        accept: "text/csv, text/plain;q=0.9, */*;q=0.8",
        "user-agent": "KlaroFacilityImport/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load DOH CSV: ${response.status}`);
    }

    return response.text();
  }

  return readFile(resolve(source), "utf8");
};

const delay = async (milliseconds: number) =>
  new Promise<void>((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });

export const ingestDohFacilities = async (source: string) => {
  const csvText = await loadCsvSource(source);
  const parsedFacilities = parseDohFacilitiesCsv(csvText);
  const rowsToInsert: Array<{
    name: string;
    facilityType: string;
    ownership: "public" | "private";
    address: string;
    latitude?: string;
    longitude?: string;
    phoneNumber?: string;
    isPhilHealthAccredited: boolean;
    acceptedSpecialties?: string[];
    openingHours?: Record<string, string>;
  }> = [];

  for (const [index, facilityRow] of parsedFacilities.entries()) {
    const enrichedFacility = await enrichFacilityWithGeocode(facilityRow, {
      fetchImpl: fetch,
      userAgent: "KlaroFacilityImport/1.0",
    });

    rowsToInsert.push({
      name: enrichedFacility.name,
      facilityType: enrichedFacility.facilityType,
      ownership: enrichedFacility.ownership,
      address: enrichedFacility.address,
      latitude: enrichedFacility.latitude,
      longitude: enrichedFacility.longitude,
      phoneNumber: enrichedFacility.phoneNumber,
      isPhilHealthAccredited: enrichedFacility.isPhilHealthAccredited,
      acceptedSpecialties: enrichedFacility.acceptedSpecialties,
      openingHours: enrichedFacility.openingHours,
    });

    if (index > 0 && index % 50 === 0) {
      await delay(1000);
    }
  }

  if (rowsToInsert.length === 0) {
    return { inserted: 0, source };
  }

  await db.insert(facility).values(rowsToInsert);

  return {
    inserted: rowsToInsert.length,
    source,
  };
};

const run = async () => {
  const source = process.argv[2];

  if (!source) {
    throw new Error(
      "Missing DOH facilities source. Pass a file path or URL to ingest-doh-facilities.ts.",
    );
  }

  const result = await ingestDohFacilities(source);
  console.log(`Imported ${result.inserted} facilities from ${result.source}`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
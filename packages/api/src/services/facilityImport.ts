import { geocodeFacilityAddress } from "./facilityGeocoding";

type FacilityCsvRecord = Record<string, string>;

export type FacilityImportRow = {
  name: string;
  facilityType: string;
  ownership: "public" | "private";
  address: string;
  latitude?: string;
  longitude?: string;
  phoneNumber?: string;
  isPhilHealthAccredited: boolean;
  acceptedSpecialties: string[];
  openingHours?: Record<string, string>;
};

const headerAliases: Record<string, string> = {
  address: "address",
  facility_name: "name",
  facility_type: "facilityType",
  has_philhealth: "isPhilHealthAccredited",
  lat: "latitude",
  latitude: "latitude",
  lng: "longitude",
  lon: "longitude",
  longitude: "longitude",
  name: "name",
  opening_hours: "openingHours",
  ownership: "ownership",
  phone: "phoneNumber",
  phone_number: "phoneNumber",
  philhealth: "isPhilHealthAccredited",
  specialties: "acceptedSpecialties",
  specialty: "acceptedSpecialties",
  type: "facilityType",
  accredited: "isPhilHealthAccredited",
};

const normalizeKey = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];

      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
};

const normalizeOwnership = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "public" || normalizedValue === "government") {
    return "public";
  }

  return "private";
};

const normalizeFacilityType = (value: string, name: string) => {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue) {
    return normalizedValue.replace(/\s+/g, "_");
  }

  const normalizedName = name.trim().toLowerCase();

  if (normalizedName.includes("clinic")) return "clinic";
  if (normalizedName.includes("diagnostic")) return "diagnostic_center";
  if (normalizedName.includes("health unit")) return "health_unit";
  if (normalizedName.includes("rural health")) return "rural_health_unit";

  return "hospital";
};

const parseBooleanFlag = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  return ["true", "1", "yes", "y", "accredited", "verified"].includes(
    normalizedValue,
  );
};

const parseDelimitedList = (value: string) =>
  value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const parseOpeningHours = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.startsWith("{")) {
    try {
      return JSON.parse(trimmedValue) as Record<string, string>;
    } catch {
      return { raw: trimmedValue };
    }
  }

  const hours: Record<string, string> = {};
  const segments = trimmedValue.split(/[;\n]/);

  for (const segment of segments) {
    const normalizedSegment = segment.trim();
    if (!normalizedSegment) continue;

    const [dayPart, timePart] = normalizedSegment.split(/[:=]/, 2);

    if (dayPart && timePart) {
      hours[dayPart.trim()] = timePart.trim();
    } else if (dayPart) {
      hours.raw = normalizedSegment;
    }
  }

  return Object.keys(hours).length > 0 ? hours : undefined;
};

const normalizeRow = (row: FacilityCsvRecord): FacilityImportRow | null => {
  const name = (row.name ?? "").trim();
  const address = (row.address ?? name).trim();

  if (!name || !address) {
    return null;
  }

  const specialties = parseDelimitedList(row.acceptedSpecialties ?? "");
  const facilityType = normalizeFacilityType(row.facilityType ?? "", name);
  const ownership = normalizeOwnership(row.ownership ?? "private");

  return {
    name,
    facilityType,
    ownership,
    address,
    latitude: row.latitude?.trim() || undefined,
    longitude: row.longitude?.trim() || undefined,
    phoneNumber: row.phoneNumber?.trim() || undefined,
    isPhilHealthAccredited: parseBooleanFlag(
      row.isPhilHealthAccredited ?? row.philhealth ?? row.accredited ?? "",
    ),
    acceptedSpecialties: specialties,
    openingHours: row.openingHours ? parseOpeningHours(row.openingHours) : undefined,
  };
};

export const parseDohFacilitiesCsv = (csvText: string) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [] as FacilityImportRow[];
  }

  const headers = parseCsvLine(lines[0] ?? "").map((header) => {
    const normalizedHeader = normalizeKey(header);
    return headerAliases[normalizedHeader] ?? normalizedHeader;
  });

  const facilities: FacilityImportRow[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: FacilityCsvRecord = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    const normalized = normalizeRow(row);

    if (normalized) {
      facilities.push(normalized);
    }
  }

  return facilities;
};

export const enrichFacilityWithGeocode = async (
  facilityRow: FacilityImportRow,
  options?: {
    fetchImpl?: typeof fetch;
    userAgent?: string;
  },
) => {
  if (facilityRow.latitude && facilityRow.longitude) {
    return facilityRow;
  }

  const geocode = await geocodeFacilityAddress(facilityRow.address, {
    fetchImpl: options?.fetchImpl,
    userAgent: options?.userAgent,
    countryCode: "ph",
    limit: 1,
  });

  if (!geocode) {
    return facilityRow;
  }

  return {
    ...facilityRow,
    latitude: geocode.latitude.toFixed(8),
    longitude: geocode.longitude.toFixed(8),
  };
};
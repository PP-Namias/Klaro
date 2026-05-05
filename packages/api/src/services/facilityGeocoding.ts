type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
};

export type FacilityGeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  importance: number;
};

export type GeocodeFacilityAddressOptions = {
  fetchImpl?: typeof fetch;
  userAgent?: string;
  countryCode?: string;
  limit?: number;
};

export const buildNominatimSearchUrl = (
  query: string,
  options?: Pick<GeocodeFacilityAddressOptions, "countryCode" | "limit">,
) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(options?.limit ?? 1));

  if (options?.countryCode) {
    url.searchParams.set("countrycodes", options.countryCode);
  }

  return url;
};

export const geocodeFacilityAddress = async (
  address: string,
  options?: GeocodeFacilityAddressOptions,
): Promise<FacilityGeocodeResult | null> => {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    return null;
  }

  const response = await (options?.fetchImpl ?? fetch)(
    buildNominatimSearchUrl(trimmedAddress, {
      countryCode: options?.countryCode ?? "ph",
      limit: options?.limit ?? 1,
    }),
    {
      headers: {
        accept: "application/json",
        "user-agent": options?.userAgent ?? "KlaroFacilityImport/1.0",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  const results = (await response.json()) as NominatimSearchResult[];
  const bestMatch = results[0];

  if (!bestMatch) {
    return null;
  }

  return {
    latitude: Number(bestMatch.lat),
    longitude: Number(bestMatch.lon),
    displayName: bestMatch.display_name,
    importance: bestMatch.importance ?? 0,
  };
};
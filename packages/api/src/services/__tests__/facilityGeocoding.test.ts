import { describe, it, expect, vi } from "vitest";
import { buildNominatimSearchUrl, geocodeFacilityAddress } from "../facilityGeocoding";

describe("buildNominatimSearchUrl", () => {
  it("creates correct URL with query", () => {
    const url = buildNominatimSearchUrl("Manila Hospital");
    expect(url.toString()).toContain("format=jsonv2");
    expect(url.toString()).toContain("q=Manila+Hospital");
  });

  it("sets format to jsonv2", () => {
    const url = buildNominatimSearchUrl("test");
    expect(url.searchParams.get("format")).toBe("jsonv2");
  });

  it("sets limit parameter", () => {
    const url = buildNominatimSearchUrl("test", { limit: 5 });
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("defaults limit to 1", () => {
    const url = buildNominatimSearchUrl("test");
    expect(url.searchParams.get("limit")).toBe("1");
  });

  it("sets country code", () => {
    const url = buildNominatimSearchUrl("test", { countryCode: "ph" });
    expect(url.searchParams.get("countrycodes")).toBe("ph");
  });

  it("handles special characters in query", () => {
    const url = buildNominatimSearchUrl("St. Luke's Medical Center");
    expect(url.searchParams.get("q")).toBe("St. Luke's Medical Center");
  });
});

describe("geocodeFacilityAddress", () => {
  it("returns coordinates for valid address", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            lat: "14.5995",
            lon: "120.9842",
            display_name: "Manila, Philippines",
            importance: 0.8,
          },
        ]),
    });

    const result = await geocodeFacilityAddress("Manila Hospital", {
      fetchImpl: mockFetch,
    });

    expect(result).toEqual({
      latitude: 14.5995,
      longitude: 120.9842,
      displayName: "Manila, Philippines",
      importance: 0.8,
    });
  });

  it("returns null for no results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await geocodeFacilityAddress("Nonexistent Place", {
      fetchImpl: mockFetch,
    });

    expect(result).toBeNull();
  });

  it("returns null for empty address", async () => {
    const result = await geocodeFacilityAddress("   ");
    expect(result).toBeNull();
  });

  it("handles fetch errors gracefully", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      geocodeFacilityAddress("Manila Hospital", { fetchImpl: mockFetch }),
    ).rejects.toThrow("Nominatim request failed with status 500");
  });

  it("sets user-agent header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await geocodeFacilityAddress("Manila Hospital", {
      fetchImpl: mockFetch,
      userAgent: "TestAgent/1.0",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          "user-agent": "TestAgent/1.0",
        }),
      }),
    );
  });

  it("limits results by limit parameter", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            lat: "14.5995",
            lon: "120.9842",
            display_name: "Result 1",
            importance: 0.8,
          },
        ]),
    });

    await geocodeFacilityAddress("Manila", {
      fetchImpl: mockFetch,
      limit: 3,
    });

    const url = mockFetch.mock.calls[0][0] as URL;
    expect(url.searchParams.get("limit")).toBe("3");
  });

  it("uses default importance when not provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            lat: "14.5995",
            lon: "120.9842",
            display_name: "Manila, Philippines",
          },
        ]),
    });

    const result = await geocodeFacilityAddress("Manila Hospital", {
      fetchImpl: mockFetch,
    });

    expect(result?.importance).toBe(0);
  });
});

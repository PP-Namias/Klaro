import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const seedPath = resolve(import.meta.dirname, "../seed.ts");
const seedContent = readFileSync(seedPath, "utf-8");

describe("seed function", () => {
  it("seed.ts is readable", () => {
    expect(seedContent).toBeDefined();
  });

  it("seed data includes users", () => {
    expect(seedContent).toContain("mia.santos@klaro.dev");
    expect(seedContent).toContain("luis.navarro@klaro.dev");
  });

  it("seed data includes doctor", () => {
    expect(seedContent).toContain("Dr. Luis Navarro");
    expect(seedContent).toContain("Internal Medicine");
    expect(seedContent).toContain("PRC-IM-2024-0917");
  });

  it("seed data includes facilities", () => {
    expect(seedContent).toContain("Klaro Wellcare Clinic");
    expect(seedContent).toContain("St. Luke");
    expect(seedContent).toContain("Philippine General Hospital");
    expect(seedContent).toContain("Makati Medical Center");
  });

  it("seed data includes document", () => {
    expect(seedContent).toContain("lab-results-jan.pdf");
    expect(seedContent).toContain("analyzed");
  });

  it("seed data includes analysis", () => {
    expect(seedContent).toContain("extractedFields");
    expect(seedContent).toContain("flaggedValues");
    expect(seedContent).toContain("plainLanguageSummary");
  });

  it("seed data includes booking", () => {
    expect(seedContent).toContain("chat_consult");
    expect(seedContent).toContain("confirmed");
  });

  it("seed data includes payment", () => {
    expect(seedContent).toContain("1500.00");
    expect(seedContent).toContain("PHP");
    expect(seedContent).toContain("completed");
  });
});

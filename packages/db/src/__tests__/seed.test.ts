import { describe, it, expect } from "vitest";

describe("seed function", () => {
  it("seed.ts exports seed function", async () => {
    const seedModule = await import("../seed");
    expect(seedModule).toBeDefined();
  });

  it("seed data includes users", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("mia.santos@klaro.dev");
    expect(seedContent).toContain("luis.navarro@klaro.dev");
  });

  it("seed data includes doctor", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("Dr. Luis Navarro");
    expect(seedContent).toContain("Internal Medicine");
    expect(seedContent).toContain("PRC-IM-2024-0917");
  });

  it("seed data includes facilities", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("Klaro Wellcare Clinic");
    expect(seedContent).toContain("St. Luke's Medical Center");
    expect(seedContent).toContain("Philippine General Hospital");
    expect(seedContent).toContain("Makati Medical Center");
  });

  it("seed data includes document", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("lab-results-jan.pdf");
    expect(seedContent).toContain("analyzed");
  });

  it("seed data includes analysis", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("extractedFields");
    expect(seedContent).toContain("flaggedValues");
    expect(seedContent).toContain("plainLanguageSummary");
  });

  it("seed data includes booking", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("chat_consult");
    expect(seedContent).toContain("confirmed");
  });

  it("seed data includes payment", async () => {
    const seedContent = await import("node:fs").then((fs) =>
      fs.default.readFileSync(
        new URL("../seed.ts", import.meta.url).pathname,
        "utf-8",
      ),
    );
    expect(seedContent).toContain("1500.00");
    expect(seedContent).toContain("PHP");
    expect(seedContent).toContain("completed");
  });
});

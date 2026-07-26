import { beforeEach, describe, expect, it, vi } from "vitest";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

vi.mock("@klaro/db/client", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config) => ({
    config,
    handler: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
  })),
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn((db, options) => ({
    adapter: "drizzle",
    provider: options.provider,
  })),
}));

vi.mock("better-auth/plugins", () => ({
  oAuthProxy: vi.fn((options) => ({
    plugin: "oAuthProxy",
    productionURL: options.productionURL,
  })),
}));

vi.mock("@better-auth/expo", () => ({
  expo: vi.fn(() => ({
    plugin: "expo",
  })),
}));

describe("initAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initAuth is exported as function", async () => {
    const { initAuth } = await import("../index");
    expect(typeof initAuth).toBe("function");
  });

  it("initAuth returns auth instance", async () => {
    const { initAuth } = await import("../index");
    const auth = initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-client-id",
      discordClientSecret: "discord-client-secret",
    });
    expect(auth).toBeDefined();
  });

  it("initAuth configures discord social provider", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: expect.objectContaining({
          discord: expect.objectContaining({
            clientId: "discord-id",
            clientSecret: "discord-secret",
          }),
        }),
      }),
    );
  });

  it("initAuth configures google when credentials provided", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
      googleClientId: "google-id",
      googleClientSecret: "google-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: expect.objectContaining({
          google: expect.objectContaining({
            clientId: "google-id",
            clientSecret: "google-secret",
          }),
        }),
      }),
    );
  });

  it("initAuth skips google when credentials missing", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: expect.not.objectContaining({
          google: expect.anything(),
        }),
      }),
    );
  });

  it("initAuth sets baseURL from options", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "http://localhost:3000",
      }),
    );
  });

  it("initAuth sets secret from options", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "my-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: "my-secret",
      }),
    );
  });

  it("initAuth configures expo plugin", async () => {
    const { initAuth } = await import("../index");
    const { expo } = await import("@better-auth/expo");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(expo).toHaveBeenCalled();
  });

  it("initAuth configures oAuthProxy plugin", async () => {
    const { initAuth } = await import("../index");
    const { oAuthProxy } = await import("better-auth/plugins");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(oAuthProxy).toHaveBeenCalledWith({
      productionURL: "https://klaro-scans.tech",
    });
  });

  it("initAuth configures trusted origins", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedOrigins: ["expo://"],
      }),
    );
  });

  it("initAuth accepts extra plugins", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    const extraPlugin = { name: "extra-plugin" };

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
      extraPlugins: [extraPlugin as any],
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        plugins: expect.arrayContaining([
          expect.objectContaining({ plugin: "oAuthProxy" }),
          expect.objectContaining({ plugin: "expo" }),
          extraPlugin,
        ]),
      }),
    );
  });

  it("Auth type is inferred from initAuth", async () => {
    const { initAuth } = await import("../index");
    const auth = initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });
    expect(auth).toBeDefined();
  });

  it("Session type is inferred from Auth", async () => {
    const { initAuth } = await import("../index");
    const auth = initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });
    expect(auth).toBeDefined();
  });

  it("initAuth sets discord redirectURI", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: expect.objectContaining({
          discord: expect.objectContaining({
            redirectURI: "https://klaro-scans.tech/api/auth/callback/discord",
          }),
        }),
      }),
    );
  });

  it("initAuth sets google redirectURI", async () => {
    const { betterAuth } = await import("better-auth");
    const { initAuth } = await import("../index");

    initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "https://klaro-scans.tech",
      secret: "test-secret",
      discordClientId: "discord-id",
      discordClientSecret: "discord-secret",
      googleClientId: "google-id",
      googleClientSecret: "google-secret",
    });

    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        socialProviders: expect.objectContaining({
          google: expect.objectContaining({
            redirectURI: "https://klaro-scans.tech/api/auth/callback/google",
          }),
        }),
      }),
    );
  });
});

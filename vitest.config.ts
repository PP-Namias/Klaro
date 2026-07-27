import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./apps/nextjs/src/", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    globals: true,
    setupFiles: [resolve(dirname, "vitest.setup.ts")],
    exclude: [
      "**/e2e/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/__tests__/api-utilities.test.ts",
      "**/__tests__/extraction.test.ts",
      "**/__tests__/llm.test.ts",
      "**/__tests__/ocr.test.ts",
      "**/__tests__/openapi.test.ts",
      "**/router/__tests__/auth.test.ts",
      "**/router/__tests__/chat.test.ts",
      "**/router/__tests__/doctor.test.ts",
      "**/router/__tests__/doctorAvailability.test.ts",
      "**/router/__tests__/documents.test.ts",
      "**/router/__tests__/facilities.test.ts",
      "**/router/__tests__/scan-guest-contract.test.ts",
      "**/services/__tests__/facilityImport.test.ts",
      "**/maps/nearby/__tests__/route.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      exclude: [
        "**/packages/ui/**",
        "**/packages/ai-sidecar/**",
        "**/packages/gemini-scan-backend/**",
        "**/packages/db/**",
        "**/packages/auth/**",
        "**/packages/validators/src/documents.ts",
        "**/apps/nextjs/src/components/upload-form.tsx",
        "**/apps/nextjs/src/components/useFocusTrap.ts",
        "**/apps/nextjs/src/lib/session-timeout.ts",
        "**/apps/nextjs/src/lib/rate-limit.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});

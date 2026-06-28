import { expect } from "vitest";
import type { ZodSchema } from "zod/v4";

export const expectValidSchema = (schema: ZodSchema, data: unknown) => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result.data;
};

export const expectInvalidSchema = (schema: ZodSchema, data: unknown) => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  return result.error;
};

export const expectSchemaError = (
  schema: ZodSchema,
  data: unknown,
  expectedPath?: string,
) => {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (expectedPath && !result.success) {
    const issues = result.error.issues;
    const hasPath = issues.some((issue) =>
      issue.path.includes(expectedPath),
    );
    expect(hasPath).toBe(true);
  }
};

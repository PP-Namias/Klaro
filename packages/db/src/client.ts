import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL");
}

const client = neon(connectionString);

export const db = drizzle({
  client,
  schema,
  casing: "snake_case",
});

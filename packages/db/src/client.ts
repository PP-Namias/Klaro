import { neon } from "@neondatabase/serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL");
}

/**
 * Neon's HTTP driver only talks to Neon's cloud endpoint, so a plain Postgres
 * server (Docker Compose, CI, a local install) needs node-postgres instead.
 * Picked from the connection string; override with DB_DRIVER=neon|pg.
 */
function resolveDriver(url: string): "neon" | "pg" {
  const override = process.env.DB_DRIVER?.toLowerCase();
  if (override === "neon" || override === "pg") return override;
  return url.includes("neon.tech") ? "neon" : "pg";
}

export const db: NeonHttpDatabase<typeof schema> =
  resolveDriver(connectionString) === "neon"
    ? drizzleNeon({
        client: neon(connectionString),
        schema,
        casing: "snake_case",
      })
    : (drizzleNodePostgres({
        connection: connectionString,
        schema,
        casing: "snake_case",
        // node-postgres exposes transactions that neon-http does not, so the
        // shared type stays the narrower neon-http surface.
      }) as unknown as NeonHttpDatabase<typeof schema>);

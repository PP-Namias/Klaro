#!/bin/sh
# Applies the Drizzle schema to POSTGRES_URL and seeds demo rows.
# Compose gates this on the postgres healthcheck, so the server is already up.
set -eu

cd /app/packages/db

echo "[migrate] pushing schema"
pnpm exec drizzle-kit push --force

if [ "${SEED_DATABASE:-true}" = "true" ]; then
  echo "[migrate] seeding"
  # seed.ts is a no-op when users already exist, so reruns are safe.
  pnpm exec tsx src/seed.ts
else
  echo "[migrate] seeding disabled (SEED_DATABASE=${SEED_DATABASE:-})"
fi

echo "[migrate] done"

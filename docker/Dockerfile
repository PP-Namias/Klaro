# syntax=docker/dockerfile:1

###############################################################################
# base — Node 22 (matches .nvmrc) with pnpm from corepack
###############################################################################
FROM node:22.21.0-alpine AS base
# libc6-compat covers dependencies that ship glibc-linked prebuilt binaries
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

###############################################################################
# manifests — every workspace manifest and the lockfile, and nothing else, so
# that editing source code does not invalidate the dependency layers
###############################################################################
FROM base AS manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/expo/package.json                    apps/expo/
COPY apps/nextjs/package.json                  apps/nextjs/
COPY apps/tanstack-start/package.json          apps/tanstack-start/
COPY packages/ai-sidecar/package.json          packages/ai-sidecar/
COPY packages/api/package.json                 packages/api/
COPY packages/auth/package.json                packages/auth/
COPY packages/db/package.json                  packages/db/
COPY packages/gemini-scan-backend/package.json packages/gemini-scan-backend/
COPY packages/ui/package.json                  packages/ui/
COPY packages/validators/package.json          packages/validators/
COPY tooling/eslint/package.json               tooling/eslint/
COPY tooling/github/package.json               tooling/github/
COPY tooling/prettier/package.json             tooling/prettier/
COPY tooling/tailwind/package.json             tooling/tailwind/
COPY tooling/typescript/package.json           tooling/typescript/
# The root postinstall only runs a workspace linter that fetches from the
# network on every install — it has no place in an image build.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.scripts.postinstall;fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

###############################################################################
# web — Next.js, built as a standalone server bundle
###############################################################################
FROM manifests AS deps-web
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @klaro/nextjs...

FROM deps-web AS build-web
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# have to be supplied here rather than at runtime.
ARG NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy-key
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional, and deliberately never promoted to ENV: t3-env reads an empty
# string as a value rather than as unset, and the optional z.url() field then
# rejects it at boot. An ARG is still visible to the build RUN below.
ARG NEXT_PUBLIC_NEON_AUTH_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_OUTPUT_STANDALONE=1 \
    NODE_ENV=production
# Secrets are never baked into an image; the build only needs these to satisfy
# module-level checks, and the real values arrive as runtime env vars.
ENV SKIP_ENV_VALIDATION=true \
    POSTGRES_URL=postgres://build:build@127.0.0.1:5432/build
COPY . .
RUN [ -n "${NEXT_PUBLIC_NEON_AUTH_URL:-}" ] || unset NEXT_PUBLIC_NEON_AUTH_URL; \
    pnpm --filter @klaro/nextjs exec next build

FROM base AS web
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
# `output: standalone` emits the server plus only the files it actually traced;
# static assets and public/ are not part of that trace.
COPY --from=build-web --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=build-web --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static
COPY --from=build-web --chown=nextjs:nodejs /app/apps/nextjs/public ./apps/nextjs/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/nextjs/server.js"]

###############################################################################
# scan-api — the Express gemini-scan-backend service
###############################################################################
FROM manifests AS deps-scan
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter gemini-scan-backend

FROM base AS scan-api
ENV NODE_ENV=production \
    PORT=3001 \
    STORAGE_BASE_PATH=/data/uploads \
    RESULTS_PATH=/data/results
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs scan
COPY --from=deps-scan --chown=scan:nodejs /app/node_modules ./node_modules
COPY --from=deps-scan --chown=scan:nodejs /app/packages/gemini-scan-backend/node_modules ./packages/gemini-scan-backend/node_modules
COPY --chown=scan:nodejs packages/gemini-scan-backend ./packages/gemini-scan-backend
RUN mkdir -p /data/uploads /data/results && chown -R scan:nodejs /data
WORKDIR /app/packages/gemini-scan-backend
USER scan
EXPOSE 3001
CMD ["node", "src/index.js"]

###############################################################################
# migrate — one-shot job that pushes the Drizzle schema and seeds
###############################################################################
FROM manifests AS deps-db
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @klaro/db...

FROM deps-db AS migrate
ENV NODE_ENV=production
COPY packages/db ./packages/db
COPY docker/migrate.sh /usr/local/bin/migrate.sh
RUN chmod +x /usr/local/bin/migrate.sh
WORKDIR /app/packages/db
CMD ["/usr/local/bin/migrate.sh"]

###############################################################################
# ai-sidecar — optional LangChain/LangGraph RAG service
###############################################################################
FROM manifests AS deps-sidecar
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @klaro/ai-sidecar...

FROM deps-sidecar AS build-sidecar
COPY packages/ai-sidecar ./packages/ai-sidecar
COPY tooling ./tooling
RUN pnpm --filter @klaro/ai-sidecar exec tsc

FROM base AS ai-sidecar
ENV NODE_ENV=production \
    PORT=3002
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs sidecar
COPY --from=build-sidecar --chown=sidecar:nodejs /app/node_modules ./node_modules
COPY --from=build-sidecar --chown=sidecar:nodejs /app/packages/ai-sidecar/node_modules ./packages/ai-sidecar/node_modules
COPY --from=build-sidecar --chown=sidecar:nodejs /app/packages/ai-sidecar/dist ./packages/ai-sidecar/dist
COPY --from=build-sidecar --chown=sidecar:nodejs /app/packages/ai-sidecar/package.json ./packages/ai-sidecar/
WORKDIR /app/packages/ai-sidecar
USER sidecar
EXPOSE 3002
CMD ["node", "dist/server.js"]

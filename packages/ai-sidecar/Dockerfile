FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tooling/ ./tooling/
COPY packages/ai-sidecar/package.json ./packages/ai-sidecar/
RUN pnpm install --no-frozen-lockfile --filter @klaro/ai-sidecar
COPY packages/ai-sidecar/ ./packages/ai-sidecar/
RUN pnpm --filter @klaro/ai-sidecar run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 sidecar && adduser --system --uid 1001 sidecar
COPY --from=builder /app/packages/ai-sidecar/dist ./dist
COPY --from=builder /app/packages/ai-sidecar/package.json ./
COPY --from=builder /app/node_modules ./node_modules
USER sidecar
ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "dist/server.js"]

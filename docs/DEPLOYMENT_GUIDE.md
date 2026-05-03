# Deployment & Infrastructure Guide

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Expo App   │         │  Next.js Web │         │   Browser   │
│  (Mobile)   │         │   (Vercel)   │         │             │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │ (HTTPS)
                     ┌─────────▼──────────┐
                     │   API Gateway      │
                     │  (Rate Limiting)   │
                     └─────────┬──────────┘
                               │
                     ┌─────────▼──────────┐
                     │  Backend (Node.js) │
                     │   (Docker/Railway) │
                     │  - tRPC routers    │
                     │  - Auth services   │
                     │  - LLM/OCR calls   │
                     └─────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼─────┐     ┌────────▼────────┐   ┌───────▼────┐
    │PostgreSQL│     │    Redis Cache   │   │  Stripe    │
    │ (Neon)   │     │  (Upstash)       │   │  (Webhook) │
    └──────────┘     └──────────────────┘   └────────────┘
         │
    ┌────▼─────┐
    │   S3      │
    │ Backups   │
    │ & Files   │
    └──────────┘
```

## Deployment Targets

### Frontend (Web) - Vercel

```bash
# 1. Connect GitHub repository
# Go to vercel.com -> Import Project -> Select apps/nextjs

# 2. Set environment variables in Vercel Dashboard
NEXT_PUBLIC_API_URL=https://api.klaro.ph
NEXTAUTH_SECRET=<generate-secret>
NEXTAUTH_URL=https://klaro.ph
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
GOOGLE_CLIENT_ID=...

# 3. Deploy
git push origin main
# Automatic deployment triggered

# 4. Verify
https://klaro.ph
```

### Backend - Railway or Heroku

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and create project
railway login
railway init

# 3. Add PostgreSQL addon
railway add

# 4. Configure environment
railway variables
# Add all backend secrets

# 5. Link GitHub
railway link github
# Select repo and branch

# 6. Deploy
git push origin main
# Automatic deployment triggered

# Verify API
curl https://api-klaro.railway.app/api/trpc/health
```

### Mobile - Expo

```bash
# 1. Build for iOS (requires Mac)
npm run expo:build:ios
# Upload to TestFlight

# 2. Build for Android
npm run expo:build:android
# Upload to Google Play

# 3. Publish updates (over-the-air)
npm run expo:publish
# App fetches updates automatically
```

## Database Setup

### Neon (Serverless PostgreSQL)

```bash
# 1. Create account at neon.tech
# 2. Create new project
# 3. Copy connection string
postgresql://username:password@host:5432/dbname

# 4. Add to .env
DATABASE_URL="postgresql://..."

# 5. Run migrations
npm run prisma:migrate:deploy

# 6. Seed data (optional)
npm run db:seed
```

### Backup Strategy

```bash
# Daily backups (automated by Neon)
# Retention: 30 days

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240115.sql
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Web)
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/nextjs
      
      - name: Deploy to Railway (Backend)
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Docker Deployment

### Build Image

```dockerfile
# Dockerfile (backend)
FROM node:18-alpine

WORKDIR /app

# Copy monorepo files
COPY package.json pnpm-lock.yaml ./
COPY packages packages/
COPY apps/expo/package.json apps/api/package.json ./apps/

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build
RUN pnpm run build

# Migrate database
RUN pnpm exec prisma migrate deploy

# Start server
EXPOSE 3001
CMD ["pnpm", "start"]
```

### Deploy with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: klaro
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/klaro
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/nextjs/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/klaro
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

```bash
# Deploy
docker-compose up -d
```

## Monitoring & Logging

### Cloud Monitoring (Datadog)

```typescript
// middleware/monitoring.ts
import * as dd from '@datadog/browser-rum';

dd.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'klaro-web',
  env: process.env.NODE_ENV,
  sessionSampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input'
});

dd.startSessionReplayRecording();
```

### Error Tracking (Sentry)

```typescript
// pages/_app.tsx
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Don't send auth errors
    if (event.exception?.values?.[0].value?.includes('Unauthorized')) {
      return null;
    }
    return event;
  }
});
```

### Logs (Axiom or LogRocket)

```bash
# View logs in production
axiom dataset query klaro-backend
```

## Scaling Strategy

### Phase 1: MVP (Current)
- Single backend instance
- Shared database
- Basic caching

### Phase 2: Growth (Months 2-3)
- Load balancer + 2-3 backend instances
- Database read replicas
- Redis cluster for session management

### Phase 3: Scale (Months 4+)
- Kubernetes orchestration
- Auto-scaling based on CPU/memory
- Database sharding by user region
- CDN for static assets

## Disaster Recovery

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes

### Backup Strategy
```bash
# Daily automated backups via Neon
# Weekly manual backups to S3
aws s3 cp backup-20240115.sql s3://klaro-backups/

# Monthly full disaster recovery test
```

### Failover Checklist
- [ ] Restore database from backup
- [ ] Verify all migrations applied
- [ ] Run smoke tests against restored data
- [ ] Update DNS to new backend instance
- [ ] Notify users via status page

## Cost Optimization

| Component | Cost | Notes |
|-----------|------|-------|
| Vercel (Web) | $0-20/mo | Free tier included |
| Railway (Backend) | $5-50/mo | Pay-as-you-go |
| Neon (Database) | $0-100/mo | Serverless pricing |
| Upstash (Redis) | $0-30/mo | Free tier 10GB |
| Stripe | 2.9% + $0.30 | Transaction fees |
| Storage (S3) | $0.03/GB/mo | Backups |
| Monitoring (Datadog) | $15-30/mo | Custom metrics |
| **Total** | **$50-250/mo** | Scales with usage |

### Budget Controls
- Set spending alerts in each platform
- Use serverless (no idle costs)
- Archive old backups after 30 days
- Monitor for unused resources

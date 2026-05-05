# Deployment & Infrastructure Guide

## What gets deployed

Klaro uses **one Vercel project** for the web app and backend API.

- **Project root:** `apps/nextjs`
- **Frontend:** Next.js pages and app router UI
- **Backend:** Route Handlers in `apps/nextjs/src/app/api/*`
- **tRPC:** `apps/nextjs/src/app/api/trpc/*`

## One-time Vercel setup

1. Import the GitHub repository into Vercel.
2. Set the **Root Directory** to `apps/nextjs`.
3. Add the production environment variables:

```bash
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...
POSTGRES_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_PRESET=...
```

## Automated deployment

This repo includes `.github/workflows/vercel-deploy.yml`.

It deploys `apps/nextjs` to Vercel on every push to `main`.

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## After deploying

Check these URLs on the production domain:

- `/`
- `/api/docs`
- `/api/auth/session`
- `/api/documents/scan`
- `/api/trpc/facilities.searchNearby`

## OAuth redirect URLs

Update your OAuth providers to match the Vercel domain:

- `https://YOUR_DOMAIN.vercel.app/api/auth/callback/discord`
- `https://YOUR_DOMAIN.vercel.app/api/auth/callback/google`

## Notes

- Use either the GitHub Actions workflow or Vercel’s built-in GitHub integration for production deploys.
- Do not deploy a separate backend service for the web app path; the backend API is part of the Next.js deployment.

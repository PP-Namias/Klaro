# Deployment Checklist - Klaro to Vercel

## Before you deploy

- [ ] TypeScript passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] Tests pass: `pnpm exec tsx --test`
- [ ] Git working tree is clean: `git status --short`
- [ ] `.env.local` has all required variables

Required variables:

```bash
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=
POSTGRES_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=
```

## Vercel setup

- [ ] Create one Vercel project for the repository
- [ ] Set the Root Directory to `apps/nextjs`
- [ ] Add the environment variables in Vercel
- [ ] Add GitHub secrets if using the workflow

GitHub secrets for `.github/workflows/vercel-deploy.yml`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## OAuth redirect URLs

- [ ] Discord: `https://YOUR_DOMAIN.vercel.app/api/auth/callback/discord`
- [ ] Google: `https://YOUR_DOMAIN.vercel.app/api/auth/callback/google`

## After deployment

- [ ] Production site loads successfully
- [ ] `/api/docs` loads Swagger UI
- [ ] `/api/auth/session` returns the current user when authenticated
- [ ] `/api/documents/scan` accepts authenticated uploads
- [ ] `/api/trpc/facilities.searchNearby` returns facility results

## Rollback

- [ ] Revert the commit and push to `main`
- [ ] Or restore the previous deployment from the Vercel dashboard

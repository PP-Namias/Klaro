# Environment Configuration

This repo uses a root `.env` file for local development and Vercel environment
variables for production. The current codebase reads a smaller set of variables
than the older template suggested, so this document reflects the actual setup.

## Core variables

These are the important ones for the main web app:

```env
POSTGRES_URL=...
AUTH_SECRET=...
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_PRESET=klaro_uploads
CAL_COM_API_KEY=...
CAL_COM_BASE_URL=https://api.cal.com
LLM_PROVIDER=gemini
LLM_API_KEY=...
LLM_MODEL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Optional variables

```env
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
CAL_COM_WEBHOOK_SECRET=...
GOOGLE_VISION_API_KEY=...
OCR_CONFIDENCE_THRESHOLD=0.7
```

## What each variable is for

### Database

- `POSTGRES_URL` is required by Drizzle and Next.js server routes.

### Authentication

- `AUTH_SECRET` is required for production deploys.
- `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET` are required for Discord sign-in.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are optional.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` power the client-side Supabase integration.
- `SUPABASE_SERVICE_ROLE_KEY` is optional and only needed for privileged server actions.

### Cloudinary

- Used by upload and scan routes.

### Cal.com

- `CAL_COM_API_KEY` is required for scheduling link generation.
- `CAL_COM_WEBHOOK_SECRET` is optional but recommended if you validate incoming webhooks.

### AI / OCR

- `LLM_PROVIDER` and `LLM_API_KEY` are used by the medical explanation service.
- `LLM_MODEL` is optional.
- `GOOGLE_VISION_API_KEY` and `OCR_CONFIDENCE_THRESHOLD` are optional OCR helpers.

## Local vs production

- For local dev, the app can boot with `.env` and the defaults in the code.
- For Vercel, make sure the same variables are added in the project settings.
- Do not rely on `SKIP_ENV_VALIDATION` for production.

## Current status

The repo previously had an outdated environment guide that referenced variables
like Prisma, Stripe, and `NEXTAUTH_*`. Those are not the current focus of the
Next.js app in this workspace, so the guide has been aligned to the current code.

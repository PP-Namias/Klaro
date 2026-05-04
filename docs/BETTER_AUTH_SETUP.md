# Klaro Backend - Better Auth OAuth Setup Guide

## Overview

Klaro uses **better-auth** (not Supabase Auth) for handling OAuth authentication. This guide covers:
- Local development setup with Discord and Google OAuth
- Production deployment to Vercel
- Testing the complete OAuth flow
- Troubleshooting common issues

## Architecture

```
User Browser
    ↓ (click "Sign in with Discord/Google")
GET /api/auth/signin?provider=discord
    ↓ (redirects to OAuth provider)
Discord.com / Google.com
    ↓ (user authorizes app)
GET /api/auth/callback/discord (handled by better-auth)
    ↓ (better-auth creates session)
httpOnly session cookie set
    ↓
User authenticated ✅
```

### Key Components

- **better-auth**: OAuth provider integration + session management
- **Session Storage**: httpOnly cookies (set by `nextCookies()` plugin)
- **Database**: Drizzle ORM + PostgreSQL (via Supabase)
- **Endpoints**:
  - `GET /api/auth/signin?provider=discord|google` — Initiate OAuth
  - `POST /api/auth/logout` — Clear session
  - `GET /api/auth/callback/{provider}` — OAuth callback (auto-handled)

---

## Discord OAuth Setup

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it (e.g., "Klaro Dev" for local testing)
4. Go to **OAuth2** section
5. Copy **Client ID** → `AUTH_DISCORD_ID`
6. Click **"Reset Secret"** to generate new secret
7. Copy **Client Secret** → `AUTH_DISCORD_SECRET`

### Step 2: Set OAuth2 Redirect URL

1. Still in **OAuth2** section
2. Find **Redirects** subsection
3. Add redirect URL:
   - **Local**: `http://localhost:3000/api/auth/callback/discord`
   - **Production**: `https://yourdomain.vercel.app/api/auth/callback/discord`
4. Save changes

### Step 3: Update Environment

Update `.env.local`:

```bash
AUTH_DISCORD_ID=<your-client-id>
AUTH_DISCORD_SECRET=<your-client-secret>
```

### Step 4: Verify Discord Auth Works

1. Start dev server: `cd apps/nextjs && pnpm dev`
2. Open Swagger UI: `http://localhost:3000/api/docs`
3. Scroll to `GET /api/auth/signin`
4. Click "Try it out" → enter parameter: `discord`
5. Execute → should redirect to Discord login
6. Complete Discord OAuth flow
7. Should redirect back to `http://localhost:3000` with session set

---

## Google OAuth Setup

### Step 1: Create Google Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (name it "Klaro Dev")
3. Wait for project to initialize

### Step 2: Enable OAuth API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google+ API"** (or **"Identity"**)
3. Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Name it (e.g., "Klaro Dev Web App")
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.vercel.app/api/auth/callback/google` (for production)
6. Click **"Create"**
7. Copy **Client ID** → `AUTH_GOOGLE_ID`
8. Copy **Client Secret** → `AUTH_GOOGLE_SECRET`

### Step 4: Update Environment

Update `.env.local`:

```bash
AUTH_GOOGLE_ID=<your-client-id>
AUTH_GOOGLE_SECRET=<your-client-secret>
```

### Step 5: Verify Google Auth Works

1. Start dev server: `cd apps/nextjs && pnpm dev`
2. Open Swagger UI: `http://localhost:3000/api/docs`
3. Scroll to `GET /api/auth/signin`
4. Click "Try it out" → enter parameter: `google`
5. Execute → should redirect to Google login
6. Complete Google OAuth flow
7. Should redirect back to `http://localhost:3000` with session set

---

## Local Testing Walkthrough

### Complete OAuth Flow Test

```bash
# 1. Start development server
cd apps/nextjs
pnpm dev

# 2. Open Swagger UI in browser
# http://localhost:3000/api/docs

# 3. Test Discord sign-in
# GET /api/auth/signin?provider=discord
# Expected: 302 redirect to discord.com

# 4. Complete Discord auth in browser
# Authorize "Klaro Dev" app when prompted

# 5. Back to app, verify session is set
# Check browser DevTools → Application → Cookies
# Should see "auth_token" (httpOnly cookie)

# 6. Test file upload as authenticated user
# POST /api/uploads/server
# Upload a test image
# Should return 201 with document ID and Cloudinary URL

# 7. Retrieve uploaded file
# GET /api/uploads/{document-id}
# Should return file metadata with ownership verified

# 8. Test logout
# POST /api/auth/logout
# Should return 200 with success message
```

### Testing Ownership Validation

```bash
# After uploading as user A:

# 1. Create another test account (user B)
# Login as user B via Discord/Google

# 2. Try to access user A's document
# GET /api/uploads/{user-a-document-id}
# Expected: 403 Forbidden

# 3. Verify user B can access their own docs
# POST /api/uploads/server (upload as user B)
# GET /api/uploads/{user-b-document-id}
# Expected: 200 (success)
```

---

## Environment Variables Reference

```bash
# OAuth Providers
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_client_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Session Security
AUTH_SECRET=<generate-with: openssl rand -base64 32>

# Cloudinary Image Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset

# Database
POSTGRES_URL=postgresql://user:password@host/database

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000 (or production URL)
```

---

## Troubleshooting

### "Invalid OAuth provider" Error

**Cause**: Parameter mismatch or typo in provider name

**Fix**: Verify query parameter is exactly `discord` or `google`

```bash
# Correct
GET /api/auth/signin?provider=discord

# Incorrect (will fail)
GET /api/auth/signin?provider=Discord
GET /api/auth/signin?provider=disc
```

### "Redirect URL mismatch" Error

**Cause**: OAuth provider redirect URL doesn't match environment

**Fix**: Update OAuth provider settings:

1. **Discord**: Go to Developer Portal → OAuth2 → Redirects
2. **Google**: Go to Cloud Console → Credentials → Edit OAuth client

Add the correct redirect URL:
- Local: `http://localhost:3000/api/auth/callback/{provider}`
- Production: `https://yourdomain.vercel.app/api/auth/callback/{provider}`

### Session Not Persisting

**Cause**: httpOnly cookie not being sent/received

**Fix**: 
1. Verify cookies are enabled in browser
2. Ensure `credentials: "include"` in fetch requests
3. Check CORS headers in response (Klaro has `Access-Control-Allow-Credentials: true`)

### "401 Unauthorized" on Upload

**Cause**: Session not being validated

**Fix**:
1. Verify you've logged in first (check DevTools → Cookies for `auth_token`)
2. If logging in doesn't work, check OAuth redirect URLs match provider settings
3. Check database connection is working (`pnpm db:push`)

### File Upload Fails with 415 Error

**Cause**: Unsupported file type

**Supported types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

**Fix**: Only upload these file types

---

## Session Structure

After successful OAuth, the session object looks like:

```typescript
{
  user: {
    id: "user_abc123",
    email: "user@example.com",
    name: "User Name",
    emailVerified: true,
    createdAt: "2026-05-05T10:30:00Z",
  },
  session: {
    id: "session_xyz789",
    expiresAt: "2026-05-12T10:30:00Z",
    token: "eyJ..." // Session token
  }
}
```

Use `getSession()` in server components to access current user:

```typescript
import { getSession } from "~/auth/server";

export default async function Page() {
  const session = await getSession();
  
  if (!session?.user) {
    return <p>Please login first</p>;
  }
  
  return <p>Welcome {session.user.name}!</p>;
}
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/signin?provider=discord\|google` | ❌ | Initiate OAuth |
| POST | `/api/auth/logout` | ✅ | Clear session |
| POST | `/api/uploads/server` | ✅ | Upload file |
| GET | `/api/uploads/{id}` | ✅ | Get document (ownership validated) |
| GET | `/api/uploads/sign` | ✅ | Get Cloudinary signatures |

---

## Additional Resources

- [better-auth Documentation](https://www.better-auth.com/)
- [Discord OAuth Docs](https://discord.com/developers/docs/topics/oauth2)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Deployment Guide](./DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: May 5, 2026  
**Framework**: Next.js 16 + better-auth v1.4.0  
**Database**: PostgreSQL via Supabase  

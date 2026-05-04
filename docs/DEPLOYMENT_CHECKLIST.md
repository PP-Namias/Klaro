# Deployment Checklist - Klaro to Vercel

**Objective**: Verify all components are production-ready before deploying to Vercel.

---

## Pre-Deployment (Local Validation)

### Code Quality

- [ ] **TypeScript**: `pnpm -w run typecheck` → zero errors
- [ ] **Linting**: `pnpm -w run lint` → zero errors
- [ ] **Formatting**: `pnpm -w run format:fix` → all files formatted
- [ ] **Tests**: `pnpm -w run test` → all tests passing (when Vitest is installed)

### Git Status

- [ ] Commit message is semantic: `feat(auth): ...` or `docs(auth): ...`
- [ ] Commit follows one-line format (max 120 characters)
- [ ] No uncommitted changes: `git status --short` → clean
- [ ] Latest commits visible: `git log --oneline -10` → shows your work

### Environment Variables

- [ ] `.env.local` has all required variables:
  ```bash
  AUTH_DISCORD_ID=<value>
  AUTH_DISCORD_SECRET=<value>
  AUTH_GOOGLE_ID=<value>
  AUTH_GOOGLE_SECRET=<value>
  AUTH_SECRET=<value>
  POSTGRES_URL=<value>
  CLOUDINARY_CLOUD_NAME=<value>
  CLOUDINARY_API_KEY=<value>
  CLOUDINARY_API_SECRET=<value>
  CLOUDINARY_UPLOAD_PRESET=<value>
  ```
- [ ] No secrets committed to git (check `.env.example` only)

### Local Testing

- [ ] Start server: `cd apps/nextjs && pnpm dev` → listens on port 3000
- [ ] Swagger UI loads: `http://localhost:3000/api/docs` → no errors
- [ ] Discord sign-in works: `GET /api/auth/signin?provider=discord` → redirects to discord.com
- [ ] Google sign-in works: `GET /api/auth/signin?provider=google` → redirects to accounts.google.com
- [ ] File upload works: `POST /api/uploads/server` (authenticated) → returns 201
- [ ] Document retrieval works: `GET /api/uploads/{id}` → returns metadata
- [ ] Ownership validation works: User B cannot access User A's documents (403)
- [ ] Logout works: `POST /api/auth/logout` (authenticated) → returns 200

---

## Vercel Deployment Setup

### 1. Create Vercel Project

```bash
# Link to Vercel (if not already done)
vercel link

# Or create new project on https://vercel.com/new
```

### 2. Set Environment Variables in Vercel

For each variable in the list below, run:

```bash
vercel env add VARIABLE_NAME
# When prompted, enter the value (copy from .env.local)
```

**Variables to add** (in order):

1. `AUTH_DISCORD_ID` → Discord Client ID
2. `AUTH_DISCORD_SECRET` → Discord Client Secret
3. `AUTH_GOOGLE_ID` → Google OAuth Client ID
4. `AUTH_GOOGLE_SECRET` → Google OAuth Client Secret
5. `AUTH_SECRET` → Generate new: `openssl rand -base64 32`
6. `POSTGRES_URL` → Supabase connection string
7. `CLOUDINARY_CLOUD_NAME` → Your Cloudinary name
8. `CLOUDINARY_API_KEY` → Cloudinary API key
9. `CLOUDINARY_API_SECRET` → Cloudinary API secret
10. `CLOUDINARY_UPLOAD_PRESET` → Cloudinary upload preset

```bash
# Verify all variables are set
vercel env ls
```

### 3. Update OAuth Provider Redirect URLs

#### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your Klaro application
3. Go to **OAuth2** → **Redirects**
4. Add new redirect URL:
   ```
   https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback/discord
   ```
5. Save changes

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select Klaro project
3. Go to **APIs & Services** → **Credentials**
4. Click OAuth client ID for "Klaro Web App"
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_VERCEL_DOMAIN.vercel.app/api/auth/callback/google
   ```
6. Save changes

### 4. Update `.env.example`

Ensure `.env.example` documents all required variables (no actual secrets):

```bash
# .env.example template (for developers cloning repo)
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

### 5. Deploy

```bash
# Option 1: Direct deploy from CLI
vercel deploy --prod

# Option 2: Push to GitHub and let Vercel auto-deploy
git push origin main
```

---

## Post-Deployment Validation

### 1. Verify Deployment Successful

- [ ] Vercel deployment shows **"Ready"** status
- [ ] No failed build logs in Vercel dashboard
- [ ] Open production URL: `https://YOUR_VERCEL_DOMAIN.vercel.app`

### 2. Test All Auth Endpoints

Open Swagger UI at production URL:
```
https://YOUR_VERCEL_DOMAIN.vercel.app/api/docs
```

- [ ] `GET /api/auth/signin?provider=discord` → 302 redirect
- [ ] `GET /api/auth/signin?provider=google` → 302 redirect
- [ ] `POST /api/auth/logout` (requires auth) → 200
- [ ] `POST /api/uploads/server` (requires auth) → 201
- [ ] `GET /api/uploads/{id}` (requires auth) → 200

### 3. Complete OAuth Flow (End-to-End)

1. Open production URL in browser
2. Navigate to `GET /api/auth/signin?provider=discord`
3. Complete Discord OAuth flow
4. Verify redirected back to app with session set
5. Test file upload
6. Test logout

### 4. Test Google OAuth

1. Repeat OAuth flow with `provider=google`
2. Complete Google OAuth
3. Verify session is set
4. Test file operations

### 5. Database Connectivity

- [ ] File uploads successfully save to Cloudinary and database
- [ ] Document metadata is stored (fileName, mimeType, size, etc.)
- [ ] Query `/api/uploads/{id}` returns stored metadata

### 6. Cross-User Access Validation

1. Create Account A (via Discord/Google)
2. Upload document as Account A
3. Logout
4. Create Account B (via Discord/Google)
5. Try to access Account A's document
   - URL: `/api/uploads/{account-a-document-id}`
   - Expected: 403 Forbidden

---

## Rollback Plan

If deployment fails or has issues:

```bash
# Option 1: Revert to previous Vercel deployment
# Go to Vercel dashboard → Deployments → Click previous deployment

# Option 2: Revert code changes locally
git revert <commit-hash>
git push origin main
# Vercel will auto-deploy the reverted code

# Option 3: Roll back to stable branch
git checkout stable
git push origin main
```

---

## Common Deployment Issues

### "Invalid OAuth redirect URL"

**Cause**: OAuth provider redirect URL doesn't match Vercel domain

**Fix**: 
1. Get your Vercel deployment URL from dashboard
2. Update Discord/Google OAuth settings with correct URL
3. Redeploy

### "Database connection timeout"

**Cause**: Vercel can't reach Supabase database

**Fix**:
1. Verify `POSTGRES_URL` is set in Vercel env
2. Check Supabase allows Vercel IP range
3. Test connection: `pnpm db:push` (should migrate schema)

### "Cloudinary upload fails"

**Cause**: Cloudinary credentials not set or incorrect

**Fix**:
1. Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, etc. are set
2. Check credentials in Cloudinary dashboard
3. Regenerate if needed

### "Session not persisting across page navigation"

**Cause**: httpOnly cookie not being sent to Vercel domain

**Fix**:
1. Verify `AUTH_SECRET` is set and unique per environment
2. Check browser cookies: DevTools → Application → Cookies
3. Ensure CORS headers include `Access-Control-Allow-Credentials: true`

---

## Monitoring Post-Deployment

### Setup Error Logging (Optional but Recommended)

Consider setting up Sentry for error tracking:

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Configure in apps/nextjs/instrumentation.ts
# Add environment variable: SENTRY_DSN
```

### Monitor Logs

```bash
# View Vercel logs
vercel logs --follow
```

---

## Performance Checklist

- [ ] Swagger UI loads in < 2 seconds
- [ ] OAuth redirect happens within 1 second
- [ ] File upload (10MB) completes in < 5 seconds
- [ ] Database queries (get document) respond in < 500ms

---

## Security Checklist

- [ ] `AUTH_SECRET` is cryptographically random
- [ ] Secrets are never committed to git
- [ ] OAuth provider secrets are stored in Vercel (not in code)
- [ ] Database URL contains strong password
- [ ] Cloudinary API secret is restricted to upload only (not full admin)
- [ ] CORS headers are restrictive (not `*` wildcard)

---

## Success Criteria

✅ All checklists above pass  
✅ End-to-end OAuth flow works  
✅ File uploads work  
✅ Ownership validation enforced  
✅ No errors in Vercel logs  
✅ Performance acceptable (< 2s load times)  

---

## Support & Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Cloudinary Dashboard**: https://cloudinary.com/console
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Google Cloud Console**: https://console.cloud.google.com/

---

**Last Updated**: May 5, 2026  
**Framework**: Next.js 16  
**Deployment Target**: Vercel (serverless)  
**Database**: PostgreSQL via Supabase  

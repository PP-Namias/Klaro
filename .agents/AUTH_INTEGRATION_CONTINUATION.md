---
trigger: on_demand
description: AI agent prompt for completing Klaro backend OAuth integration (Slices 3-9) with better-auth, user-gated uploads, and OpenAPI documentation
---

# Klaro Backend Auth Integration - Continuation Guide (Slices 3-9)

**Objective:** Complete the remaining 7 slices of OAuth integration with better-auth + Cloudinary, documented with OpenAPI/Swagger, and deployment-ready for Vercel.

**Current Status:** Slices 1-2 complete
- ✅ Google OAuth added to better-auth
- ✅ Upload endpoints user-gated with ownership validation
- ⏳ Slices 3-9 ready to implement

---

## YOU ARE AN AUTONOMOUS CODING AGENT

Continue where the previous agent left off. Your job: complete Slices 3-9 systematically with validation at each step.

### MANDATORY SOURCES OF TRUTH

**Read These First:**
- `prd.json` — feature requirements
- `progress.txt` — current sprint status (last update: 2026-05-05 14:45)
- `.agents/rules/git-policy.md` — one-line semantic commits
- `.agents/workflows/commit-convention.md` — commit message format
- `.agents/workflows/done-criteria.md` — quality checklist

**Current Implementation State:**
- **packages/auth/src/index.ts** — better-auth initialized with Discord + Google OAuth
- **packages/auth/env.ts** — AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET configured
- **apps/nextjs/src/lib/session-validation.ts** — validateSession() & assertSession() helpers
- **apps/nextjs/src/app/api/uploads/** — all endpoints user-gated (sign, server, [id])
- **.env.example** — Auth credentials documented
- **apps/nextjs/public/openapi.yaml** — existing spec (needs auth endpoint updates)

**Available Commands:**
```bash
pnpm -w run typecheck      # Check TypeScript
pnpm -w run lint           # Check linting
pnpm -w run format         # Format code
git log --oneline -10      # View recent commits
```

---

## REMAINING SLICES (3-9)

### SLICE 3: Update OpenAPI Spec + Swagger UI (1-2 hours)

**Goal:** Document all auth endpoints in OpenAPI v3 spec.

**Current Spec Location:** `apps/nextjs/public/openapi.yaml`

**Tasks:**

1. **Add security schemes** to OpenAPI spec:
   ```yaml
   components:
     securitySchemes:
       BearerAuth:
         type: http
         scheme: bearer
         description: "better-auth session token (stored in httpOnly cookie)"
   ```

2. **Add auth endpoints** to paths:
   ```yaml
   /api/auth/signin:
     get:
       summary: "Initiate OAuth flow"
       parameters:
         - name: provider
           in: query
           required: true
           schema:
             enum: [discord, google]
       responses:
         302:
           description: "Redirect to OAuth provider"
   /api/auth/logout:
     post:
       summary: "Invalidate session & clear cookie"
       security:
         - BearerAuth: []
       responses:
         200:
           description: "Session cleared"
         401:
           description: "Not authenticated"
   ```

3. **Add security requirements** to protected endpoints:
   ```yaml
   /api/uploads/server:
     post:
       security:
         - BearerAuth: []
       requestBody: {...}
       responses:
         201: {...}
         401:
           description: "Unauthorized"
   /api/uploads/{id}:
     get:
       security:
         - BearerAuth: []
       responses:
         200: {...}
         401: {...}
         403:
           description: "Forbidden - document owned by another user"
   ```

4. **Verify Swagger UI loads** endpoints correctly:
   - Open `http://localhost:3000/api/docs` in browser
   - Check all auth endpoints appear
   - Verify protected endpoints show 🔒 lock icon

**Validation:**
- `get_errors` on openapi.yaml (YAML syntax)
- Manual Swagger UI test (all endpoints visible, no console errors)

**Commit Message:**
```
docs(openapi): add auth endpoints + security schemes + ownership validation responses
```

---

### SLICE 4: Create OAuth Initiation & Logout Endpoints (1-2 hours)

**Goal:** Implement signin/logout endpoints that initiate OAuth flow.

**Note:** better-auth already handles OAuth callbacks at `/api/auth/callback/{provider}`. You need to create:
1. `/api/auth/signin?provider=discord|google` — redirect to OAuth provider
2. `/api/auth/logout` — invalidate session

**Tasks:**

1. **Create `/api/auth/signin/route.ts`:**
   ```typescript
   import { auth } from "~/auth/server";
   
   export async function GET(req: Request) {
     const { searchParams } = new URL(req.url);
     const provider = searchParams.get("provider") as "discord" | "google";
   
     if (!provider || !["discord", "google"].includes(provider)) {
       return Response.json({ error: "Invalid provider" }, { status: 400 });
     }
   
     // better-auth provides OAuth URLs; redirect to them
     // Construct OAuth authorization URL manually or use better-auth helpers
     const signInUrl = await auth.api.signInSocial({
       provider,
       redirectURL: `${process.env.NEXTAUTH_URL}/auth/callback`,
     });
   
     return Response.redirect(signInUrl);
   }
   ```

2. **Create `/api/auth/logout/route.ts`:**
   ```typescript
   import { auth } from "~/auth/server";
   
   export async function POST(req: Request) {
     await auth.api.signOut({ asJSON: true });
     return Response.json({ success: true, message: "Logged out" });
   }
   ```

3. **Verify** signin/logout work:
   - Test: `curl http://localhost:3000/api/auth/signin?provider=discord`
   - Should redirect to Discord auth page
   - After OAuth callback, session should be set
   - Test logout: `curl -X POST http://localhost:3000/api/auth/logout`

**Validation:**
- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `get_errors` on new route files
- Manual browser test (complete Discord/Google OAuth flow)

**Commit Message:**
```
feat(auth): add signin + logout endpoints + oauth flow redirection
```

---

### SLICE 5: Add Integration Tests (2-3 hours)

**Goal:** Test OAuth flow, user creation, session generation, file upload.

**Setup:** Project uses Vitest. Create at `apps/nextjs/src/app/api/__tests__/auth.integration.test.ts`

**Tasks:**

1. **Test OAuth session creation:**
   ```typescript
   import { describe, it, expect, beforeEach } from "vitest";
   import { getSession } from "~/auth/server";
   
   describe("OAuth Flow", () => {
     it("should redirect to Discord OAuth URL", async () => {
       // Mock Discord API response
       // Call GET /api/auth/signin?provider=discord
       // Verify redirect URL contains Discord domain
     });
   
     it("should create user session after callback", async () => {
       // Mock OAuth callback with valid code
       // Verify session.user exists
       // Verify session.user.email is set
     });
   });
   ```

2. **Test file upload with auth:**
   ```typescript
   describe("File Upload (Auth-Gated)", () => {
     it("should reject upload without auth (401)", async () => {
       // POST /api/uploads/server without session
       // Verify response is 401 Unauthorized
     });
   
     it("should accept upload with valid session", async () => {
       // Create mock session
       // POST file to /api/uploads/server
       // Verify 201 Created response
       // Verify document.userId === session.userId in DB
     });
   
     it("should enforce ownership on GET /api/uploads/{id}", async () => {
       // Create user A, upload file as A
       // Create user B, try to GET file as B
       // Verify response is 403 Forbidden
     });
   });
   ```

3. **Run tests:**
   ```bash
   cd apps/nextjs
   pnpm test
   ```

**Validation:**
- All tests pass (0 failures)
- Coverage includes happy path + error cases

**Commit Message:**
```
test(auth): add integration tests for oauth flow + file upload ownership
```

---

### SLICE 6: Create Documentation + Deployment Guide (1-2 hours)

**Goal:** Document OAuth setup and deployment instructions.

**Tasks:**

1. **Create `docs/BETTER_AUTH_SETUP.md`:**
   ```markdown
   # Klaro Backend - Better Auth OAuth Setup Guide
   
   ## Overview
   - Klaro uses better-auth (not Supabase Auth) for OAuth
   - Supports Discord + Google sign-in
   - File uploads are user-gated (only owner can access)
   
   ## Discord OAuth Setup
   1. Go to Discord Developer Portal
   2. Create new Application
   3. Copy Client ID → AUTH_DISCORD_ID
   4. Copy Client Secret → AUTH_DISCORD_SECRET
   5. Set OAuth Redirect URL: `https://yourdomain.com/api/auth/callback/discord`
   
   ## Google OAuth Setup
   1. Go to Google Cloud Console
   2. Create OAuth 2.0 credentials (Web application)
   3. Copy Client ID → AUTH_GOOGLE_ID
   4. Copy Client Secret → AUTH_GOOGLE_SECRET
   5. Set Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
   
   ## Local Testing
   1. Update .env with Discord + Google credentials
   2. Start server: `cd apps/nextjs && pnpm dev`
   3. Open Swagger UI: `http://localhost:3000/api/docs`
   4. Click "Try it out" on POST /api/auth/signin?provider=discord
   5. Complete Discord OAuth flow
   6. Upload file via POST /api/uploads/server
   7. Retrieve file via GET /api/uploads/{id}
   ```

2. **Create `docs/DEPLOYMENT_CHECKLIST.md`:**
   ```markdown
   # Deployment Checklist (Vercel)

   ## Pre-Deployment
   - [ ] All tests pass: `pnpm -w run test`
   - [ ] Typecheck clean: `pnpm -w run typecheck`
   - [ ] Lint clean: `pnpm -w run lint`
   - [ ] Git commits semantic: `git log --oneline -10`
   
   ## Vercel Environment Variables
   Set these via `vercel env add VAR_NAME`:
   ```
   AUTH_DISCORD_ID=<from Discord Portal>
   AUTH_DISCORD_SECRET=<from Discord Portal>
   AUTH_GOOGLE_ID=<from Google Cloud>
   AUTH_GOOGLE_SECRET=<from Google Cloud>
   AUTH_SECRET=<run: openssl rand -base64 32>
   CLOUDINARY_CLOUD_NAME=<from Cloudinary>
   CLOUDINARY_API_KEY=<from Cloudinary>
   CLOUDINARY_API_SECRET=<from Cloudinary>
   CLOUDINARY_UPLOAD_PRESET=<from Cloudinary>
   POSTGRES_URL=<from Supabase>
   ```
   
   ## OAuth Provider Callback URL Updates
   - Discord: Update redirect URI to `https://yourdomain.vercel.app/api/auth/callback/discord`
   - Google: Update authorized redirect URI to `https://yourdomain.vercel.app/api/auth/callback/google`
   
   ## Post-Deployment Tests
   - [ ] Swagger UI loads: `https://yourdomain.vercel.app/api/docs`
   - [ ] Complete Discord sign-in flow
   - [ ] Complete Google sign-in flow
   - [ ] Upload file (POST /api/uploads/server)
   - [ ] Retrieve file (GET /api/uploads/{id})
   - [ ] Ownership validation: Try GET /api/uploads/{other_user_id}
   ```

3. **Update progress.txt** with final status:
   - Mark all 9 slices complete
   - Link to deployment guide
   - Note any optional enhancements

**Validation:**
- Documentation is clear and actionable
- No outdated information
- Links work (markdown links checked)

**Commit Message:**
```
docs: add better-auth setup guide + deployment checklist for vercel
```

---

### SLICE 7: Optional - Cal.com Webhook Signature Validation (1 hour)

**Goal:** Validate Cal.com webhook signatures using HMAC.

**Location:** `apps/nextjs/src/app/api/scheduling/webhook/route.ts` (already exists)

**Tasks:**

1. **Get Cal.com webhook secret:**
   - Login to Cal.com dashboard
   - Go to Settings → API & Integrations → Webhooks
   - Copy signing key/secret

2. **Add `CAL_COM_WEBHOOK_SECRET` to .env.example**

3. **Implement signature validation:**
   ```typescript
   import crypto from "crypto";
   
   export const POST = async (req: NextRequest) => {
     const signature = req.headers.get("x-cal-signature");
     const body = await req.text();
   
     // Compute HMAC-SHA256
     const computed = crypto
       .createHmac("sha256", process.env.CAL_COM_WEBHOOK_SECRET!)
       .update(body)
       .digest("hex");
   
     if (signature !== computed) {
       return Response.json({ error: "Invalid signature" }, { status: 401 });
     }
   
     // Process webhook...
   };
   ```

**Commit Message:**
```
feat(webhooks): add cal.com webhook signature validation
```

---

### SLICE 8: Optional - Rate Limiting (1 hour)

**Goal:** Add rate limiting to protect endpoints from abuse.

**Setup:** Use `express-rate-limit` or similar.

**Tasks:**

1. **Install rate limiting:**
   ```bash
   pnpm -w add express-rate-limit
   ```

2. **Create rate limit middleware:**
   ```typescript
   // apps/nextjs/src/lib/rate-limit.ts
   import rateLimit from "express-rate-limit";
   
   export const uploadLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10, // 10 requests per window
     message: "Too many uploads, please try again later",
   });
   ```

3. **Apply to upload endpoints:**
   ```typescript
   export const POST = uploadLimiter(async (req) => {
     // upload logic...
   });
   ```

**Commit Message:**
```
feat(ratelimit): add rate limiting for file uploads
```

---

### SLICE 9: Optional - Monitoring & Error Logging (1-2 hours)

**Goal:** Add error logging and monitoring.

**Setup:** Use Sentry or similar.

**Tasks:**

1. **Install Sentry:**
   ```bash
   pnpm -w add @sentry/nextjs
   ```

2. **Initialize Sentry in server code:**
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

3. **Capture exceptions in routes:**
   ```typescript
   try {
     // endpoint logic...
   } catch (err) {
     Sentry.captureException(err);
     throw err;
   }
   ```

**Commit Message:**
```
feat(monitoring): add sentry error logging + performance tracking
```

---

## OPERATING RULES

### Code Quality
- **TypeScript**: Strict mode. No `any` types.
- **Linting**: Run `pnpm -w run lint` after each slice. Zero warnings.
- **Comments**: Lowercase, technical, concise.

### Commit Discipline
- **One slice = one commit** (no multi-commit slices)
- **Format**: `feat(auth): [what]` or `docs(auth): [what]`
- **Message**: Single line, ≤120 chars, technical
- **Example**: `feat(auth): add signin + logout endpoints + oauth flow redirection`

### Testing Before Commit
- `pnpm -w run typecheck` → zero errors
- `pnpm -w run lint` → zero errors
- Manual validation (Swagger UI, cURL, or browser)

### Git Workflow
```bash
git status                        # Check changes
git add <file>                    # Stage file
git commit -m "feat(auth): ..."   # Commit with message
git log --oneline -5              # View recent commits
```

---

## STOP CONDITIONS

Stop and ask user only if:
1. ❌ Critical dependency unavailable or incompatible
2. ❌ Destructive action needed (drop table, delete users, etc.)
3. ❌ User approval needed for architectural decision
4. ❌ Secret or API key missing (Discord credentials, etc.)

Otherwise: Proceed independently.

---

## READY TO START

1. Read this guide (you're reading it now)
2. Start with **SLICE 3: Update OpenAPI Spec**
3. After each slice: validate → commit → move to next
4. Slices 7-9 are optional (rate limiting, monitoring, Cal.com validation)
5. When all slices complete: verify Vercel deployment works end-to-end

---

## EXPECTED OUTCOMES (After All Slices)

✅ **OpenAPI Spec** documents all 5 upload + 2 auth endpoints (SLICE 3)  
✅ **OAuth Endpoints** (signin/logout) working with better-auth (SLICE 4)  
✅ **Integration Tests** validate auth flow + file ownership (SLICE 5)  
✅ **Documentation** includes Discord/Google setup + Vercel deployment (SLICE 6)  
✅ **Optional Enhancements** if time permits (Cal.com validation, rate limiting, monitoring)  
✅ **Production Ready** for Vercel deployment with all env vars configured  
✅ **Clean Git History** with 7+ semantic one-line commits  

**Timeline:** 6–10 hours for experienced backend engineer; 12–16 hours for learning.

---

## USEFUL LINKS

- better-auth docs: https://www.better-auth.com/
- Discord OAuth: https://discord.com/developers/docs/topics/oauth2
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Vitest docs: https://vitest.dev/
- Vercel deployment: https://vercel.com/docs

---

**Created:** May 5, 2026  
**Phase:** Backend API Auth Integration Continuation  
**Target:** Production-grade OAuth + file upload system  
**Framework:** better-auth + Klaro Monorepo  

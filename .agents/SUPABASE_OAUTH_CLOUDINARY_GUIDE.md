---
trigger: on_demand
description: AI agent prompt for implementing Supabase OAuth (Discord + Google) + Cloudinary image uploads in the Klaro backend API
---

# Klaro Backend API - Supabase OAuth + Cloudinary Image Upload Guide

**Objective:** Implement production-ready Supabase authentication (Discord + Google OAuth) integrated with the existing Cloudinary image upload backend, deployable to Vercel with full OpenAPI/Swagger documentation.

**Status:** Backend API foundation exists (endpoints created). This prompt extends it with auth layer and validates complete flow.

---

## YOU ARE AN AUTONOMOUS CODING AGENT

You run in the Klaro monorepo (Turborepo + pnpm). Your job: complete Supabase OAuth + Cloudinary integration in small, verified, commit-ready slices with **zero guesswork** and **100% test coverage at each step**.

### MANDATORY SOURCES OF TRUTH

**Repository Rules** (Read and obey):
- `.agents/rules/architecture.md` — monorepo structure (apps/*, packages/*)
- `.agents/rules/development-standards.md` — BEM CSS, TypeScript strictness, no explicit any
- `.agents/rules/git-policy.md` — one-line semantic commits, no multi-line messages
- `.agents/rules/project-context.md` — premium, high-fidelity design
- `.agents/rules/ui-system.md` — Tailwind + CSS variables, GSAP animations

**Repository Workflows** (Follow these exactly):
- `.agents/workflows/done-criteria.md` — quality checklist before marking task complete
- `.agents/workflows/format-and-lint-workflow.md` — typecheck + lint validation
- `.agents/workflows/commit-convention.md` — technical one-line commit format
- `.agents/workflows/autocommit.md` — when to use auto_commit.ps1
- `.agents/workflows/pr-workflow.md` — full PR lifecycle if needed

**Repository Skills** (Use when relevant):
- `.agents/skills/git/SKILL.md` — commit messaging and PR structure
- `.agents/skills/orchestrator/SKILL.md` — automate preflight checks

**Core Config Files** (Read first):
- `prd.json` — feature requirements
- `progress.txt` — current sprint status
- `pnpm-workspace.yaml` — shared dependency catalog
- `.env.example` — environment variables (secrets not in repo)
- `package.json` — root scripts and workspaces
- `turbo.json` — build pipeline and caching

**Current Codebase** (Already exists):
- `apps/nextjs/src/app/api/uploads/sign/route.ts` — Cloudinary signing endpoint
- `apps/nextjs/src/app/api/uploads/server/route.ts` — Server-side upload + DB persist
- `apps/nextjs/src/app/api/uploads/[id]/route.ts` — Metadata retrieval
- `apps/nextjs/src/app/api/docs/route.ts` — Swagger UI
- `apps/nextjs/public/openapi.yaml` — API documentation
- `packages/db/src/schema.ts` — Drizzle ORM schema (has `document` table with `userId` FK)
- `packages/auth/src/` — Authentication package (foundation exists)

---

## PRIMARY GOAL

Implement a **complete Supabase OAuth backend** that:

1. ✅ Supports Discord OAuth login/signup
2. ✅ Supports Google OAuth login/signup
3. ✅ Persists user sessions in Supabase Auth
4. ✅ Links Supabase users to local `users` table (if needed) or uses Supabase user ID directly
5. ✅ Integrates with existing Cloudinary upload endpoints (user-gated)
6. ✅ Exposes OAuth callback routes for Discord/Google
7. ✅ Returns JWT/session tokens for frontend consumption
8. ✅ Validates file ownership (user can only see/download their own uploads)
9. ✅ Full OpenAPI documentation (update existing spec)
10. ✅ Deployable to Vercel with zero config changes
11. ✅ Tested via Swagger UI and cURL

---

## TECH STACK

| Layer | Tool | Purpose |
|-------|------|---------|
| **Auth** | Supabase | OAuth provider, session management, JWT tokens |
| **OAuth Providers** | Discord, Google | User identity |
| **File Storage** | Cloudinary | Image hosting, free tier |
| **Database** | PostgreSQL (Supabase) | User profiles, upload metadata |
| **Backend** | Next.js 16 API Routes | Serverless endpoints, Vercel-compatible |
| **ORM** | Drizzle | Type-safe DB queries |
| **API Docs** | OpenAPI v3 + Swagger UI | Interactive testing |
| **Deployment** | Vercel | Free tier, serverless |

---

## TASK EXECUTION LOOP

**For each task slice:**

1. **Read the PRD ticket** for this slice in prd.json
2. **Inspect existing code** (files listed above) to understand the current state
3. **Implement the smallest complete feature** (one endpoint, one provider, etc.)
4. **Validate immediately**:
   - `get_errors` for touched files
   - `pnpm -w run lint` for workspace
   - `pnpm -w run typecheck` for workspace
   - Manual Swagger UI test via browser
5. **Fix only failures from this slice**
6. **Update progress.txt** with status
7. **Commit** using git-policy format (one-line, semantic)
8. **Move to next slice**

**Do not skip validation.** Do not move forward with failing tests or lint errors.

---

## SLICES (IN PRIORITY ORDER)

### SLICE 1: Supabase Project Setup + OAuth Configuration

**Goal:** Configure Supabase and OAuth providers; create environment variables.

**Tasks:**
1. Create Supabase project (free tier)
2. Configure Discord OAuth app in Discord Developer Portal
   - Set callback URL: `https://yourdomain.com/auth/callback/discord` (Vercel staging URL during testing)
3. Configure Google OAuth app in Google Cloud Console
   - Set callback URL: `https://yourdomain.com/auth/callback/google`
4. Create `.env.local` with:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   DISCORD_CLIENT_ID=<from Discord portal>
   DISCORD_CLIENT_SECRET=<from Discord portal>
   GOOGLE_CLIENT_ID=<from Google Cloud Console>
   GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
   NEXTAUTH_SECRET=<random long string>
   NEXTAUTH_URL=http://localhost:3000 (local) / https://yourdomain.com (prod)
   ```
5. Update `.env.example` with placeholders (no secrets)
6. Install `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs` in `apps/nextjs`

**Validation:**
- `get_errors` on package.json
- Verify env vars load without errors
- Confirm Supabase connection works (test query)

**Commit Message:**
```
feat(auth): configure supabase project + discord & google oauth apps & environment variables
```

---

### SLICE 2: Supabase Client Setup + User Model Extension

**Goal:** Create Supabase client, extend user model with profile data.

**Tasks:**
1. Create `apps/nextjs/src/lib/supabase.ts`:
   - Initialize Supabase client with URL + anon key
   - Export singleton client for server-side use
2. Create `packages/db/src/schema.ts` extension (or new file `packages/db/src/auth.ts`):
   - Extend existing schema with `users` table if not present:
     ```sql
     users {
       id: UUID PK (matches Supabase auth.users.id)
       email: TEXT UNIQUE
       displayName: TEXT
       avatar: TEXT (URL to profile picture)
       provider: VARCHAR (discord | google)
       createdAt: TIMESTAMP
       updatedAt: TIMESTAMP
     }
     ```
   - Add migration (Drizzle) to create table
3. Create `packages/auth/src/supabase-client.ts`:
   - Singleton Supabase client for backend use
   - Typed auth helper methods (sign-in, sign-up, get-session)

**Validation:**
- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `get_errors` on schema changes
- Test local Supabase connection

**Commit Message:**
```
feat(auth): add supabase client + extend users table & typed auth helpers
```

---

### SLICE 3: OAuth Callback Routes (Discord + Google)

**Goal:** Implement OAuth callback handlers that exchange auth codes for sessions.

**Tasks:**
1. Create `apps/nextjs/src/app/api/auth/callback/discord/route.ts`:
   - Accept `code` and `state` query parameters
   - Exchange code for access token using Discord API
   - Get user profile from Discord
   - Create/update user in `users` table
   - Generate Supabase session token
   - Redirect to dashboard with session cookie

2. Create `apps/nextjs/src/app/api/auth/callback/google/route.ts`:
   - Accept `code` query parameter
   - Exchange code for access token using Google API
   - Get user profile from Google
   - Create/update user in `users` table
   - Generate Supabase session token
   - Redirect to dashboard with session cookie

3. Create `apps/nextjs/src/lib/auth-callbacks.ts`:
   - Shared logic for both callbacks
   - User profile extraction
   - Database upsert (create if not exists, update if exists)
   - Session creation and cookie setting

**Validation:**
- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `get_errors` on new route files
- Manual test: Start local dev server, click "Sign in with Discord" in Swagger UI (if UI added)

**Commit Message:**
```
feat(auth): add discord & google oauth callback routes + user profile sync
```

---

### SLICE 4: Auth Middleware + Session Validation

**Goal:** Create middleware to protect endpoints and validate user sessions.

**Tasks:**
1. Create `apps/nextjs/src/middleware.ts` (or extend existing):
   - Check for session token in cookies or Authorization header
   - Validate token with Supabase
   - Attach user ID to request context
   - Allow public routes (/, /auth/*, /api/docs)
   - Protect private routes (/api/uploads/server, etc.)

2. Create `packages/auth/src/session-validation.ts`:
   - Type-safe session extraction helper
   - Return `{ userId, email, provider }` or null
   - Reusable across routes

3. Update all protected API routes:
   - `apps/nextjs/src/app/api/uploads/server/route.ts` — validate user session, use userId from token
   - `apps/nextjs/src/app/api/uploads/[id]/route.ts` — validate ownership (query by userId + docId)
   - Any future protected endpoints

**Validation:**
- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `get_errors` on middleware changes
- Test protected endpoint without token (should fail 401)
- Test protected endpoint with valid token (should succeed)

**Commit Message:**
```
feat(auth): add middleware + session validation + user-gated upload routes
```

---

### SLICE 5: Sign-In/Sign-Up Endpoints (OAuth Initiation)

**Goal:** Create endpoints that initiate OAuth flow.

**Tasks:**
1. Create `apps/nextjs/src/app/api/auth/signin/route.ts`:
   - Accept `provider` (discord | google) as query param
   - Generate OAuth authorization URL with state
   - Store state in short-lived session storage or JWT
   - Redirect to Discord/Google auth URL

2. Create `apps/nextjs/src/app/api/auth/signup/route.ts`:
   - Same as sign-in (OAuth providers don't distinguish between sign-in and sign-up)
   - On callback: if user exists, return existing session; if not, create new user

3. Create `apps/nextjs/src/app/api/auth/logout/route.ts`:
   - Accept POST with current session token
   - Invalidate session in Supabase
   - Clear session cookie
   - Redirect to login page

4. Create `packages/auth/src/oauth-urls.ts`:
   - Helper functions to construct OAuth URLs for Discord and Google
   - Handle state generation and validation

**Validation:**
- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `get_errors` on new routes
- Test: Start local dev server, visit `/api/auth/signin?provider=discord`, confirm redirect to Discord auth page

**Commit Message:**
```
feat(auth): add oauth initiation endpoints (signin, signup, logout)
```

---

### SLICE 6: Update OpenAPI Spec + Swagger UI

**Goal:** Document all new auth endpoints in OpenAPI spec.

**Tasks:**
1. Update `apps/nextjs/public/openapi.yaml`:
   - Add `/api/auth/signin` (GET) — initiate Discord/Google OAuth
   - Add `/api/auth/callback/discord` (GET) — Discord OAuth callback
   - Add `/api/auth/callback/google` (GET) — Google OAuth callback
   - Add `/api/auth/logout` (POST) — invalidate session
   - Add `Authorization` header to protected endpoints (uploads/server, uploads/:id)
   - Add security schemes: `bearerAuth` (JWT token)
   - Document request/response schemas for auth endpoints

2. Ensure Swagger UI correctly shows:
   - Login flow diagram (initiate OAuth → callback → token)
   - Protected endpoints marked with 🔒 (require Authorization header)
   - Error responses (401 Unauthorized, 403 Forbidden, 400 Bad Request)

**Validation:**
- `get_errors` on YAML syntax
- Open `/api/docs` in browser, verify all endpoints render correctly
- Verify protected endpoints show "Authorize" button in Swagger UI

**Commit Message:**
```
docs(openapi): add auth endpoints & security schemes to swagger spec
```

---

### SLICE 7: Environment Variables + Deployment Config

**Goal:** Prepare for Vercel deployment.

**Tasks:**
1. Update `.env.example`:
   ```
   # Supabase
   SUPABASE_URL=https://[project].supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # OAuth Providers
   DISCORD_CLIENT_ID=123456789
   DISCORD_CLIENT_SECRET=secret
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=secret
   
   # Next.js Auth
   NEXTAUTH_SECRET=random-string-32-chars-min
   NEXTAUTH_URL=https://yourdomain.com (or http://localhost:3000 locally)

   # Cloudinary (existing)
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   CLOUDINARY_UPLOAD_PRESET=xxx

   # Cal.com (existing)
   CAL_COM_API_KEY=xxx
   CAL_COM_BASE_URL=https://cal.com
   ```

2. Update Vercel deployment guide in docs:
   - Instructions for setting env vars via `vercel env add`
   - Test Swagger UI after deployment: `https://yourdomain.vercel.app/api/docs`
   - Test sign-in flow end-to-end

3. Update `progress.txt` with completion status

**Validation:**
- Verify all env vars are documented
- No secrets committed to repo
- `.env.example` matches all required vars

**Commit Message:**
```
docs(env): add complete environment variable setup for vercel deployment
```

---

### SLICE 8: Integration Test + Validation

**Goal:** End-to-end validation of entire auth flow.

**Tasks:**
1. Create `apps/nextjs/src/app/api/__tests__/auth.integration.test.ts` (if using Vitest):
   - Test OAuth callback (mock Discord/Google API)
   - Test user creation in DB
   - Test session token generation
   - Test protected endpoint with/without token
   - Test file upload with user context

2. Manual testing via Swagger UI:
   - Click "Sign in with Discord" → complete Discord auth → should redirect to dashboard
   - Verify session cookie is set
   - Upload file via `/api/uploads/server` → verify user ID is linked
   - Retrieve file via `/api/uploads/{id}` → verify owner validation
   - Sign out → session cleared
   - Try to access protected endpoint → 401 Unauthorized

3. Test Vercel deployment:
   - Deploy to Vercel preview branch
   - Verify Swagger UI loads: `https://preview-[hash].vercel.app/api/docs`
   - Complete OAuth flow on preview (Discord/Google callback URL must be updated temporarily)
   - Test file upload

**Validation:**
- All integration tests pass
- Manual Swagger UI flow succeeds
- Vercel deployment verified

**Commit Message:**
```
test(auth): add integration tests + verify end-to-end oauth + file upload flow
```

---

### SLICE 9: Documentation + Deployment Checklist

**Goal:** Complete documentation for handoff to frontend/deployment team.

**Tasks:**
1. Create/update `docs/SUPABASE_OAUTH_GUIDE.md`:
   - Overview of auth architecture
   - Supabase project setup (step-by-step)
   - Discord OAuth app creation
   - Google OAuth app creation
   - Environment variable configuration
   - Testing the auth flow (Swagger UI walkthrough)
   - Troubleshooting common errors
   - Security best practices
   - CORS configuration notes

2. Create `docs/DEPLOYMENT_CHECKLIST.md`:
   - Pre-deployment validation
   - Vercel environment variable setup
   - OAuth provider callback URL updates
   - Database migration checklist
   - Post-deployment verification

3. Update `progress.txt` with final status

**Validation:**
- Documentation is clear and actionable
- No outdated information
- Links to actual files are correct

**Commit Message:**
```
docs: add supabase oauth setup guide + deployment checklist
```

---

## OPERATING RULES

### Code Quality
- **TypeScript**: Strict mode always. No `any` types. Full type inference.
- **Linting**: Run `pnpm -w run lint` after each slice. Zero warnings.
- **Formatting**: Run `pnpm -w run format` for code style consistency.
- **Comments**: Lowercase, technical, concise. No fluff.
- **Imports**: Use path aliases from `tsconfig.json` (e.g., `@/lib/...`).

### Commit Discipline
- **One slice = one commit** (no multi-commit slices, no squashing after the fact)
- **Commit format**: `feat(auth): [what]` or `fix(auth): [what]` or `docs(auth): [what]`
- **Message**: Single line, ≤120 chars, lowercase, technical
- **Example**: `feat(auth): add discord oauth callback + user profile sync`
- **Use `+` for distinct features, `&` for correlated details**
  - ✅ `feat(auth): add discord oauth + google oauth & state validation`
  - ❌ `feat(auth): add discord and google oauth and state validation and user sync`

### Testing Before Commit
- Run `pnpm -w run typecheck` → zero errors
- Run `pnpm -w run lint` → zero errors
- Run `get_errors` on touched files → no errors
- Manual validation (Swagger UI, cURL, or browser)
- **Only then commit.**

### Database & Migrations
- Use Drizzle ORM for all schema changes
- Create migrations in `packages/db/migrations/` (if using Drizzle migrations)
- Or update `packages/db/src/schema.ts` directly (Drizzle zero-config)
- Test migrations locally before committing
- Never break existing tables or columns

### Environment & Secrets
- **Never commit secrets** (API keys, client secrets, JWT keys)
- Store placeholders in `.env.example` only
- Use `.gitignore` to exclude `.env.local`, `.env`
- On Vercel, use `vercel env add VAR_NAME` CLI to set secrets
- Document required env vars in `.env.example`

### API Design
- All endpoints return JSON
- Error responses: `{ error: "string", code: "string", details: {...} }`
- Success responses: `{ data: {...}, status: 200 }` or just `{ ...data }`
- Use HTTP status codes correctly (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error)
- Validate request payloads with Zod (or similar) in `packages/validators`

### Documentation
- Keep docs in `docs/` folder at repo root
- Update `README.md` if adding major features
- Link to actual files using markdown links: `[file.ts](path/to/file.ts)`
- Use code blocks for examples, cURL commands, JSON payloads

---

## STOP CONDITIONS

**Stop and ask the user only if:**

1. ❌ A secret or API key is missing (Discord credentials, Google credentials, Supabase keys)
2. ❌ The PRD changes scope mid-task (new requirements emerge)
3. ❌ A critical dependency is unavailable or incompatible
4. ❌ Destructive action needed (drop production table, delete all users, etc.)
5. ❌ User approval needed for architectural decision (e.g., use NextAuth.js vs. custom JWT)

**Otherwise:** Proceed with implementing, validating, and committing each slice independently.

---

## READY TO START

1. Read `prd.json` for any auth-related tickets
2. Read `progress.txt` for current status
3. Verify local environment is set up (Node.js, pnpm, Supabase CLI optional)
4. Start with **SLICE 1: Supabase Project Setup**
5. After each slice: validate → commit → update progress.txt → move to next slice
6. When all slices complete: verify Vercel deployment works end-to-end
7. Hand off to frontend team with deployment guide

---

## USEFUL COMMANDS

```bash
# Workspace validation
pnpm -w run typecheck      # TypeScript check
pnpm -w run lint           # ESLint check
pnpm -w run format         # Prettier format

# Local development
cd apps/nextjs
pnpm dev                   # Start Next.js dev server (http://localhost:3000)
# Visit http://localhost:3000/api/docs for Swagger UI

# Git workflow
git status                 # Check changes
git add <file>            # Stage file
git commit -m "feat(auth): <message>"  # Commit
git log --oneline -10     # View recent commits

# Vercel deployment
vercel deploy             # Deploy preview
vercel deploy --prod      # Deploy to production
vercel env add VAR_NAME   # Set environment variable
```

---

## EXPECTED OUTCOME

After completing all 9 slices, you will have:

✅ **Supabase OAuth backend** supporting Discord + Google authentication  
✅ **User session management** with JWT tokens and middleware protection  
✅ **User-gated file uploads** via Cloudinary (only owner can view/download)  
✅ **Full OpenAPI/Swagger documentation** for all auth endpoints  
✅ **Deployable to Vercel** (zero config, environment variables only)  
✅ **Production-ready testing** via Swagger UI and cURL  
✅ **Complete documentation** for setup, deployment, troubleshooting  
✅ **Clean git history** with 9 semantic, one-line commits  

**Timeline:** 3–6 hours for experienced backend engineer; 8–12 hours for learning new tools (Supabase, OAuth flows).

---

## NEXT STEPS AFTER COMPLETION (Optional Enhancements)

1. **Frontend Integration**: Wire React/Svelte frontend components to new auth endpoints
2. **Rate Limiting**: Add express-rate-limit to prevent brute-force attacks
3. **Webhook Validation**: Validate Cal.com webhook signatures (HMAC-SHA256)
4. **Monitoring**: Add error logging (Sentry, LogRocket, Datadog)
5. **Database Events**: Persist Cal.com booking events to local DB
6. **Tests**: Add full test suite (Vitest + Supertest)
7. **Email Verification**: Add email confirmation flow for new signups
8. **Two-Factor Auth (2FA)**: Optional TOTP support via Supabase

---

**Created:** May 5, 2026  
**Framework:** Claude Opus + Klaro Monorepo  
**Target:** Production-grade backend API with OAuth + file uploads

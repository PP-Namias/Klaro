# Klaro

Klaro is an AI-assisted Filipino health companion that helps users understand medical documents, ask follow-up questions in local dialects, find nearby care, and book consultations.

## Locked Core Features

### 1. Document Scan and Analysis

- Upload via photo, scan, or PDF
- Supports lab results (demo), prescriptions and discharge summaries (full scale)
- Plain language explanation of results
- Severity indicator per flagged value
- "Tanong Mo Sa Doktor" card generated from actual result

### 2. AI Chatbot

- Talks about the scanned document in context
- Asks follow-up questions to extend the conversation naturally
- Can answer general health questions beyond the document
- Supports Filipino dialects: Filipino, Bisaya, Ilocano (minimum)
- User can ask it to simplify the explanation at any point
- Responds in whichever dialect the user writes in

### 3. Nearest Clinics and Hospitals Map

- Shows nearby clinics and hospitals relevant to the result
- Filters: PhilHealth-accredited, open now, specialty type
- Data sources: DOH public facility database plus Google Maps API

### 4. Doctor Appointment and Consultation

- Browse and book licensed Filipino doctors inside the app
- Doctor-set pricing per session
- Session types: chat consult, video consult, async record review
- Doctor receives scanned document automatically before session
- Doctor can issue digital prescription or referral post-consult
- PRC license verification on doctor onboarding

### 5. In-App Payment

- GCash, Maya, card
- Payment required to confirm consultation booking
- Platform takes a percentage cut per completed session

### 6. User Accounts

| Mode | What You Get |
| --- | --- |
| Guest | Scan and analyze, shareable private link (30-day expiry), no history |
| Registered | Everything in guest plus document history, saved analyses, personalized AI context |

## Under Consideration

- Trend tracking across multiple results
- Family or caregiver mode with sub-profiles
- Lolo and Lola simplified output mode
- Technical versus plain output mode toggle
- Medication tracker and reminders
- PhilHealth coverage checker
- Notification system
- Second opinion mode
- Doctor ratings and reviews

## Product Scope

This is a buildable, demonstrable 5-day product scope. Every feature above has a clear demo moment and avoids speculative work.

## Monorepo Structure

Klaro is implemented as a pnpm and Turborepo monorepo:

- apps/expo: mobile app
- apps/nextjs: web app and API surface
- apps/tanstack-start: alternative web app surface
- packages/api: tRPC routers
- packages/auth: Better Auth configuration
- packages/db: Drizzle ORM schema and client
- packages/ui: shared UI primitives
- packages/validators: shared validation schemas

## Local Setup

1. Install dependencies:

```bash
pnpm -w install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Generate auth schema:

```bash
pnpm auth:generate
```

4. Push database schema:

```bash
pnpm db:push
```

5. Run apps:

```bash
pnpm dev
```

## What Next

Choose one:

1. Pitch structure
2. 5-day sprint execution plan
3. Apply the same product-definition pass to Checkmate and Lokal

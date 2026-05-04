# Klaro Backend API Implementation Guide

## Summary

This document provides the complete centralized backend API implementation for Klaro using tRPC, Prisma/Drizzle ORM, and a PostgreSQL database.

## Architecture Overview

**Single Source of Truth**: All business logic, validation, and data access is centralized in `packages/api`. Both web (Next.js) and mobile (Expo) clients import the same typed `AppRouter` and make requests through tRPC.

**Key Principles**:
- No direct database access from client apps
- All mutations/reads via typed procedures
- Shared Zod schemas for validation
- Structured error responses (code, message, details)
- Auth guards on protected endpoints
- Logging and tracing middleware

## Database Schema (packages/db/src/schema.ts)

Comprehensive Drizzle ORM schema with the following core tables:

- **user** - Auth users (better-auth managed)
- **document** - Uploaded medical documents  
- **analysis** - OCR results & processed data
- **chatMessage** - LLM chat history (per analysis)
- **doctor** - Doctor profiles with PRC status
- **facility** - Clinics, hospitals, diagnostic centers
- **booking** - Appointment reservations
- **payment** - Stripe payment tracking

All tables include proper relationships, indexes, and timestamps.

## API Routers

### 1. Auth Router (`router/auth.ts`)
```typescript
- getSession: Get current user session
- getSecretMessage: Protected example endpoint
```

### 2. Documents Router (`router/documents.ts`)
```typescript
- upload: Upload PDF/image document
- list: Get user's documents with pagination
- byId: Fetch document + associated analysis
- getAnalysis: Retrieve analysis results
- delete: Remove document
```

### 3. Chat Router (`router/chat.ts`)
```typescript
- sendMessage: Send user message, get LLM response
- getHistory: Retrieve conversation history
- clearHistory: Delete all messages for analysis
```

### 4. Doctor Router (`router/doctor.ts`)
```typescript
- list: Browse active doctors (public)
- byId: Get doctor profile
- register: Doctor registration (admin verification)
- update: Doctor profile updates
- search: Search by specialization/type
```

### 5. Booking Router (`router/booking.ts`)
```typescript
- create: Create appointment booking
- list: Get user's bookings
- byId: Fetch booking details
- cancel: Cancel scheduled booking
- reschedule: Change appointment time
```

### 6. Facilities Router (`router/facilities.ts`)
```typescript
- list: Browse clinics/hospitals with filters
- byId: Get facility details
- searchNearby: Geolocation-based search (Haversine)
- searchBySpecialty: Find facilities by medical specialty
- getTypes: List facility type filters
- getOperatingHours: Get facility hours
```

### 7. Payments Router (`router/payments.ts`)
```typescript
- createIntent: Initialize Stripe payment intent
- byId: Get payment details
- list: Get payment history
- handleWebhook: Stripe webhook handler
- refund: Process refund for completed payment
```

### 8. Admin Router (`router/admin.ts`)
```typescript
- verifyDoctor: Approve/reject doctor verification
- getPendingDoctors: List doctors awaiting review
- getAnalytics: System statistics  
- getSystemHealth: Service status
- toggleUserStatus: Suspend/activate users
- getDisputes: Get dispute reports
```

### Utility Endpoints (root.ts)
```typescript
- health: GET /api/health - System status
- me: GET /api/me - Current user info
```

## Authentication & Middleware

**Auth Flow**:
1. User authenticates via better-auth (Discord/Google OAuth)
2. Session stored in Supabase PostgreSQL
3. tRPC context extracts session from headers
4. `protectedProcedure` middleware validates session.user exists

**Middleware Stack**:
- Timing middleware: Logs procedure execution time
- Auth middleware: Checks `ctx.session?.user` for protected routes
- Validation: Zod schemas on input/output
- Error handling: Structured TRPCError responses

## Type Safety

Client apps import and use the API like this:

```typescript
// apps/nextjs or apps/expo
import { trpc } from "@klaro/api";

// Type-safe query
const { data: session } = await trpc.auth.getSession.useQuery();

// Type-safe mutation
const uploadMutation = trpc.documents.upload.useMutation();
await uploadMutation.mutateAsync({
  fileName: "lab_results.pdf",
  mimeType: "application/pdf",
});
```

All inputs and outputs are fully typed by the backend schema.

## Implementation Status

### ✅ Complete
- Database schema with all core models
- tRPC context setup with auth
- Root router with all domain sub-routers
- Utility health/me endpoints
- Auth guards on protected endpoints
- Structured error handling

### ⏳ Ready for Implementation
- **OCR Service**: Tesseract + Google Vision for document text extraction
- **LLM Service**: Prompt templates for plain-language explanations
- **Webhook Handler**: Stripe payment notifications
- **Admin Dashboard**: Verification workflow UI
- **Email Service**: Booking confirmations, password resets
- **Geospatial Queries**: PostGIS integration for facility search

### 📝 Notes
1. All routers use Drizzle ORM syntax: `eq()`, `insert()`, `delete()`, etc.
2. Database access through `ctx.db` (Drizzle client)
3. Session info available in `ctx.session` (better-auth)
4. Dates handled as ISO strings; returned as timestamps
5. JSONB columns (availableSessionTypes, openingHours) stored as JSON arrays

## Next Steps

1. **Run migrations**: `pnpm db:push` to create schema in database
2. **Generate Prisma Client**: `pnpm db:generate`
3. **Test API routes**: Use Postman/VS Code REST Client
4. **Wire frontend**: Import AppRouter in apps/nextjs and apps/expo
5. **Implement services**: OCR, LLM, Stripe, email handlers

## Environment Variables

```bash
POSTGRES_URL=postgresql://user:password@host:5432/klaro
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_secret
AUTH_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_...
```

---

**Last Updated**: May 4, 2026  
**Klaro API Version**: 1.0.0-mvp

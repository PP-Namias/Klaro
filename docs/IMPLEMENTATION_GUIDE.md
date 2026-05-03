# Klaro Implementation Guide

## Project Overview
Klaro is a Philippine-focused health tech platform that enables users to scan medical documents, get instant plain-language explanations, chat with an AI assistant, and book consultations with Filipino doctors.

## Architecture Overview

### Mobile (Expo - React Native)
- **Location:** `apps/expo/`
- **Key Features:**
  - Camera capture with edge detection (KL-DS-001)
  - OCR integration (Tesseract.js) (KL-OCR-001)
  - Chat UI with dialect support (KL-CHAT-001)
  - Maps integration for clinics (KL-MAP-002)
  - Doctor booking flow (KL-BK-001)
  - Payment UI (KL-PAY-001)

### Web (Next.js)
- **Location:** `apps/nextjs/`
- **Key Features:**
  - File upload and PDF preview (KL-DS-002)
  - Responsive chat interface (KL-CHAT-001)
  - Facilities map (KL-MAP-002)
  - Doctor profiles and booking (KL-DR-001)
  - User dashboard

### Backend (Node.js + tRPC)
- **Location:** `packages/api/`
- **Core Endpoints:**
  - `/api/documents/scan` - OCR and extraction (KL-OCR-001, KL-EX-001)
  - `/api/chat` - LLM context and responses (KL-CHAT-001)
  - `/api/facilities/nearby` - Clinic search (KL-MAP-001)
  - `/api/doctors/*` - Doctor management (KL-DR-001)
  - `/api/bookings/*` - Booking lifecycle (KL-BK-001)
  - `/api/payments/*` - Payment processing (KL-PAY-001)

### Database (Prisma + PostgreSQL/Neon)
- **Location:** `packages/db/`
- **Schemas:**
  - Documents (encrypted storage)
  - Analyses (extraction results)
  - Users (guest + registered)
  - Doctors (profiles, pricing, PRC)
  - Bookings (appointments, status)
  - Facilities (clinics, hospitals)

## Development Phases

### Phase 1: Core MVP (Days 1-3)
1. Backend scaffold and database setup (KL-*-001)
2. Document scanning pipeline (KL-DS-001, KL-OCR-001, KL-EX-001)
3. Mobile upload and web upload UX
4. LLM integration and plain-language generation (KL-LLM-001)
5. Chat API (KL-CHAT-001)

### Phase 2: Integration (Days 4-5)
1. Facilities data ingest (KL-MAP-001)
2. Doctor profiles and booking (KL-DR-001, KL-BK-001)
3. Payment processing (KL-PAY-001)
4. Auth and user accounts (KL-AUTH-001, KL-AUTH-002)
5. Share link and guest flows (KL-AUTH-001)

### Phase 3: Polish & Testing (Day 6+)
1. Security hardening (KL-SEC-001)
2. Observability setup (KL-OBS-001)
3. CI/CD pipeline (KL-CI-001)
4. Developer documentation (KL-DEV-001)
5. Linguistic QA for dialects

## Key Technologies

| Layer | Technology | Package |
|-------|-----------|---------|
| Mobile | Expo, React Native | apps/expo |
| Web | Next.js, React | apps/nextjs |
| Backend | Node.js, tRPC | packages/api |
| Database | Prisma, PostgreSQL | packages/db |
| Auth | NextAuth.js or Clerk | packages/auth |
| UI | Shadcn/ui, Tailwind | packages/ui |
| OCR | Tesseract.js (local) + Google Vision (fallback) | - |
| LLM | OpenAI/Claude API | - |
| Maps | Google Maps API | - |
| Payments | Stripe, GCash API (future), Maya API (future) | - |

## Ticket ID Reference

### Mobile Tickets (KL-DS-*)
- **KL-DS-001:** Mobile camera capture with preprocessing
- **KL-DS-002:** Web file and PDF upload

### ML/NLP Tickets (KL-OCR-*, KL-EX-*, KL-LLM-*)
- **KL-OCR-001:** OCR engine with local + cloud fallback
- **KL-EX-001:** Structured extraction and normalization
- **KL-LLM-001:** LLM plain-language templates

### Chat & Localization (KL-CHAT-*, KL-LOC-*)
- **KL-CHAT-001:** Chat API with context layer
- **KL-LOC-001:** Dialect detection and simplify action

### Facilities & Maps (KL-MAP-*)
- **KL-MAP-001:** DOH data ingest and geocoding
- **KL-MAP-002:** Map UI for mobile and web

### Doctor & Booking (KL-DR-*, KL-BK-*)
- **KL-DR-001:** Doctor profiles and CRUD
- **KL-BK-001:** Booking flow and status management

### Payments (KL-PAY-*)
- **KL-PAY-001:** Stripe integration
- **KL-PAY-002:** GCash/Maya placeholders

### Auth & User (KL-AUTH-*)
- **KL-AUTH-001:** Guest uploads and share links
- **KL-AUTH-002:** Registered users and history

### Platform (KL-SEC-*, KL-OBS-*, KL-CI-*, KL-DEV-*)
- **KL-SEC-001:** Encryption and secrets management
- **KL-OBS-001:** Telemetry and monitoring
- **KL-CI-001:** CI/CD and test automation
- **KL-DEV-001:** Developer experience and onboarding

## Getting Started

See README.md for setup instructions and demo data collection guidelines.

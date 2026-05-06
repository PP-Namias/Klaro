# Klaro — Final Eraser AI Prompt & Tasks

Purpose: single-file prompt + checklist for pasting into Eraser.io Architecture Diagram Generator. Produce a landscape (left→right) high-resolution SVG/PNG suitable for the Gamma Technical Credibility slide. No payment systems or payment providers anywhere in the diagram.

---

## Short prompt (1-line)

"Landscape architecture diagram for Klaro: Expo (offline-first with local on-device LLM) and Next.js web → tRPC gateway → Document Intelligence (OCR → Extraction → LLM Interpretation) → Chat, Facility Discovery (maps) → Booking (NO PAYMENTS, Cal.com scheduling) → Supabase (Postgres) + Cloudinary storage; show worker queue, observability, Cal.com, Vercel deployments, and numbered flows. Export SVG/PNG in landscape."

---

## Detailed prompt (paste this into Eraser)

Create a clear, minimal, presentation-ready system architecture diagram for Klaro. Canvas MUST be landscape with a smooth left→right flow and grouped zones. Export high-resolution SVG and PNG.

Visual style: modern, minimal, 2–3 accent colors, readable typography, labeled boxes, clean arrows. No emojis.

Key requirements and labels:
- Clients (left): `Expo / React Native` (offline-first; local on-device LLM for low-latency inference and background sync) and `Next.js + React` web.
- API & Gateway (center): `tRPC Gateway` (validation, rate limiting) + `Auth` (OAuth/session/JWT).
- Services (service plane): `Documents Service (Cloudinary → Supabase)`, `OCR Pipeline (on-device/server; Google Vision fallback dashed)`, `Extraction Service (rules + LLM assist)`, `LLM Interpretation (central cloud LLM + mobile-local LLM)`, `Chat Service`, `Facility Discovery (maps/geocoding)`, `Booking Service (NO PAYMENTS; Cal.com scheduling integration)`.
- Async/Workers: `Worker Queue (Redis)` for OCR jobs, background extraction, notifications, webhook processing, and prompt/audit retention jobs. Show mobile background sync arrows.
- Data & Storage (right): `Supabase (Postgres)` for metadata, structured results, prompts/audit; `Cloudinary` for files and derived assets; append-only encrypted audit log for raw OCR & prompt versions.
- Observability & Ops: `OpenTelemetry`, `Prometheus + Grafana`, `Sentry`. Deployment labels: `Vercel` for Next.js/serverless hosting; worker hosts or serverless for background jobs.
- External integrations: `Google Vision` (optional OCR fallback), `Google Maps or OpenStreetMap` (maps/geocoding), `Cal.com` (scheduling). Mark external services outside main infra.

Flows to number and show with arrows (label sync vs async):
- Flow A — Document upload & analysis (AI-enabled): client uploads → Documents Service → Cloudinary + Supabase metadata → enqueue OCR/extract job → Worker pulls → OCR (on-device/server) → if low confidence → Google Vision fallback (dashed) → Extraction (rules then LLM assist; record prompt version/confidence) → store results in Supabase → notify client (ws/push) and cache on mobile.
- Flow B — Interpretation & Chat (LLM flow): client requests chat → Chat Service assembles context (extraction, raw OCR snippet, profile, messages) → choose mobile-local LLM for low-latency/offline or central cloud LLM for deep reasoning → LLM returns plain-language + structured follow-ups, severity tags; store prompt/version and confidence → return to client and enqueue follow-ups.
- Flow C — Facility discovery & booking (NO PAYMENTS): user requests nearby facilities → Facility Discovery queries Supabase + maps → user selects clinic/doctor → Booking Service creates booking in Supabase, attaches documentId, triggers notifications → Cal.com used for scheduling integration; update PENDING→CONFIRMED. No payment boxes anywhere.

Security & compliance callouts to annotate:
- Encrypt sensitive fields at rest; Cloudinary assets private by default; use signed short-lived URLs.
- Store raw OCR, extraction outputs, prompt versions, and model response hashes in audit log for reproducibility and compliance.
- Rate limiting and abuse protection at gateway; auth middleware for protected APIs.

Export instructions:
1. Generate diagram in Eraser with this prompt.
2. Use "Save and Edit Diagram" to refine layout into landscape if needed.
3. Ensure arrows numbered and legend present: solid=sync, dashed=async/background, dotted=optional/fallback.
4. Export high-res SVG and PNG; upload here for review.

---

## Tasks & Review Checklist (for validating the exported diagram)

1) Clients
- Label `Expo / React Native` (offline-first + local LLM) and `Next.js + React` on left.

2) API & Auth
- `tRPC Gateway` central; `Auth` middleware shown.

3) Documents & Storage
- Cloudinary for files; Supabase for metadata. Signed URL pattern shown.

4) OCR & Extraction
- Show on-device/server Tesseract path and dashed Google Vision fallback.
- Extraction = rules → LLM assist; record prompt version + confidence.

5) LLMs
- Show mobile-local LLM vs central cloud LLM; annotate typical uses (offline/low-latency vs deep reasoning).

6) Chat & Flows
- Chat Service assembles context; LLM returns explanation + structured follow-ups stored in Supabase.

7) Facility Discovery & Maps
- Show maps/geocoding and a map-enabled UI returning nearest clinics/hospitals.

8) Booking (NO PAYMENTS)
- Booking Service stores bookings in Supabase and integrates Cal.com for scheduling. No payment provider boxes.

9) Worker Queue
- Redis queue; dashed async arrows for background jobs and mobile background sync.

10) Observability & Ops
- OpenTelemetry, Prometheus+Grafana, Sentry; Vercel labeled for deployment.

11) Export checks
- Is the diagram landscape? (Yes/No)
- Are payment providers absent? (Yes/No)
- Is Cloudinary and Supabase labeled? (Yes/No)
- Is mobile offline/local LLM annotated? (Yes/No)
- Are flows numbered and legend present? (Yes/No)
- Is exported file high-res SVG/PNG? (Yes/No)

---

Paste this detailed prompt into Eraser. When you have the exported SVG/PNG, upload here and I'll review labels, contrast, legend, cropping, and slide placement for Gamma.

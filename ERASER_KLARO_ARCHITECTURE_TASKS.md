# Klaro — Architecture Tasks Checklist (for Eraser diagram)

Purpose: This file lists concrete implementation and review tasks that correspond to components in the system architecture diagram. Use this as a checklist while generating the diagram in Eraser and when validating the exported image for inclusion in the Gamma presentation.

Instructions:
- Paste the detailed architecture prompt into Eraser and generate the diagram.
- While the diagram is open, use this checklist to verify each component and annotate missing labels or flows.
- After export, attach the SVG/PNG here for a review pass.

---

1) Client / Edge
- Task: Label client boxes for `Expo (React Native)` and `Next.js (React)` and show TLS + optional CDN.
- Acceptance: Both clients appear on the left; arrows show requests to the tRPC gateway.

2) API & Gateway
- Task: Add a box for `tRPC Gateway` (validation, rate limiting) and a separate `Auth` box for session/JWT handling.
- Acceptance: Gateway is central, Auth is shown as middleware or a connected service.

3) Documents Service
- Task: Show upload flow to Object Storage (Cloudinary) and metadata writes to Supabase DB; include signed URL pattern and transient delivery tokens.
- Acceptance: Diagram labels storage (Cloudinary), Supabase metadata arrow, and an enqueue to the Worker Queue.

4) OCR Pipeline
- Task: Show local Tesseract path and an optional Google Vision fallback; mark confidence threshold fallback arrow as dashed.
- Acceptance: OCR box shows local/cloud options and a labeled fallback arrow.

5) Extraction Service
- Task: Label rules-based extraction + LLM-assisted disambiguation; show output as structured JSON stored in DB.
- Acceptance: Extraction service points to DB with a structured JSON label (tests array).

6) LLM Interpretation Service
- Task: Label prompt-based LLM with rule-based verification, severity scoring, and stored prompt versioning.
- Acceptance: LLM box annotated with "safety guards" and an arrow to store prompt version in DB/audit.

7) Chat Service
- Task: Show context assembler step, accepts documentId + message, calls LLM Interpretation, and persists messages.
- Acceptance: Chat service connected to LLM and DB; return arrow to client.

8) Facility Discovery
- Task: Show facility DB queries, optional geocoding, and PhilHealth / filter annotations.
- Acceptance: Facility service queries DB and external geocoding; results return to client.

9) Booking Service (no payments)
- Task: Show booking creation flow (attach documentId), possible PENDING→CONFIRMED states, and notification via Worker Queue. Integrate Cal.com for scheduling flows (embed or API) and show Vercel as a deployment target for frontend; explicitly REMOVE any payment flows or payment gateway boxes from diagram.
- Acceptance: Booking box points to Supabase and Worker Queue; Cal.com is shown as a scheduling integration; no payment adapter appears anywhere.

10) Worker Queue & Async flows
- Task: Show the Worker Queue (Redis or equivalent) used for OCR jobs, fallback orchestration, background extraction, notification, and webhook processing. Indicate which jobs may run on-device (mobile background sync) vs server-side.
- Acceptance: Async flows are dashed; queue is labeled and connected to workers & Services; mobile background sync arrows are shown.

11) Data & Storage
- Task: Label Supabase (managed Postgres), Cloudinary, and optional append-only encrypted audit log for storing raw OCR and prompt versions.
- Acceptance: Storage boxes are on the right and clearly labeled; Supabase arrows from services present.

12) Observability & Ops
- Task: Add OpenTelemetry/logging, Prometheus+Grafana, and Sentry as monitoring/ops boxes.
- Acceptance: Observability components are grouped and connected to services for telemetry collection.

13) External Integrations
- Task: Include Google Vision (OCR fallback), Maps/Geocoding (Google Maps or OpenStreetMap) for proximity search, Cal.com for scheduling, and Vercel for frontend/serverless deployment. Do NOT include any payment provider.
- Acceptance: External services are shown outside main infra with clearly labeled dashed arrows.

14) Security & Compliance Annotations
- Task: Add notes on encryption at rest, signed URLs, prompt/audit retention, and rate limiting.
- Acceptance: Diagram contains callouts or a small legend referencing these security controls.

15) Flow numbering and legend
- Task: Ensure numbered arrows for Flow A (upload->OCR->extraction), Flow B (chat->LLM->response), Flow C (discovery->booking) and add a legend: solid = sync, dashed = async, dotted = optional/fallback.
- Acceptance: Arrows are numbered and a legend box is present.

---

Review checklist after export
- Are all components labeled exactly as in the prompt? (Yes / No)
- Is the mobile app annotated as offline-first and mobile-local LLM present? (Yes / No)
- Are payment providers absent? (Yes / No)
- Are Cloudinary and Supabase labeled for storage and DB? (Yes / No)
- Is Cal.com shown for scheduling and Vercel for deployment? (Yes / No)
- Are async flows dashed and labeled? (Yes / No)
- Is there a legend explaining arrow styles? (Yes / No)
- Is the exported image SVG/PNG high resolution and landscape? (Yes / No)

If any answer is No, use Eraser's "Save and Edit Diagram" and apply the follow-up prompts from the main prompt until the diagram meets acceptance.

Once ready, upload the exported PNG/SVG here and I will review and suggest final presentation adjustments (labels, crop, contrast, and slide placement).

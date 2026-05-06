# Klaro — System Architecture Diagram Prompt for Eraser.ai

Purpose: Paste the detailed prompt below into Eraser's Architecture Diagram Generator (https://www.eraser.io/ai/architecture-diagram-generator) to generate a high-fidelity, presentation-ready system architecture diagram for Klaro. The diagram MUST be landscape orientation (wider than tall), show a smooth left-to-right flow, and export as an SVG/PNG suitable for embedding in the Gamma slide deck (Technical Credibility slide).

Notes before you paste
- Orientation: force landscape layout (wide canvas) so the flow reads left → right.
- Do not include a separate "System Architecture" slide in the Gamma deck; export the diagram as PNG/SVG and insert it into the Technical slide.
- Ask Eraser to export a high-resolution SVG and PNG.
- No emojis anywhere in prompts or diagram labels.

Short prompt (one-liner quick generate)
"Landscape system architecture for Klaro: Expo (offline-first with local on-device LLM) and Next.js web → tRPC gateway → document intelligence (OCR → extraction → LLM interpretation) → chat, facility discovery (maps), booking (no payments) → Supabase (Postgres) + Cloudinary storage; show worker queue, observability, Cal.com scheduling, and deployments (Vercel). Export SVG/PNG in landscape." 

Detailed prompt (paste this into Eraser for best results)
--------------------------------------------------------------------------------
Create a clear, minimal, presentation-ready system architecture diagram for Klaro. Use grouped zones, clear labels, and a left→right directional flow so events can be read sequentially. Canvas MUST be landscape orientation. Export as high-resolution SVG and PNG.

Requirements / visual style
- Style: modern, minimal, premium, with subtle futuristic gradient accents. Use readable typography and high contrast lines. Avoid decorative icons that distract; prefer labeled boxes and clean arrows.
- Color: use 2–3 accent colors (e.g., teal / violet gradients) and neutral greys for infrastructure boxes.
- Output: SVG and PNG, high resolution for slide embedding.
- No emojis.

Components and grouped zones (explicitly call these out)

1) Client / Edge (left side)
- Expo mobile app (label: Expo / React Native) — offline-first design: on-device local LLM for limited inference, local storage, background sync when online.
- Next.js web app (label: Next.js + React)
- Public CDN & TLS (optional edge caching)

2) API & Gateway (center)
- API Gateway / HTTP layer (label: tRPC gateway, validation, rate limiting)
- Auth service (OAuth + session/JWT management; mention social logins like Discord/Google optional)

3) Services / Business Logic (grouped service plane)
- Documents Service: handles uploads, storage pointers, and metadata (store files in Cloudinary; metadata in Supabase/Postgres).
- OCR Pipeline: Tesseract.js (on-device or server-side) with Cloud OCR fallback (Google Vision); show both local and cloud options and dashed fallback arrows.
- Extraction Service: deterministic rules + LLM-assisted extraction that normalizes test names, values, units, and flags.
- LLM Interpretation Service: prompt-based LLM orchestration with rule-based verification, safety guardrails, severity scoring, and prompt-version auditing. Show both central cloud LLM (for heavy tasks) and the mobile local LLM (for offline-capable, low-latency inference).
- Chat Service: context assembler + chat endpoint that accepts documentId + user message and calls LLM Interpretation Service.
- Facility Discovery Service: proximity search using geocoding/maps; supports filters and returns nearby clinics/hospitals for patients/caregivers.
- Booking Service (NO PAYMENTS): creates booking records, attaches documentId, supports PENDING→CONFIRMED states, doctor acceptance workflows, and triggers notifications. Explicitly DO NOT include any payment processing or payment gateway components.
- Scheduling integration: Cal.com used for booking and scheduling flows (embed or API integration). Deployment: Vercel for Next.js frontend and serverless API hosting.

4) Async & Workers
- Worker Queue (Redis or similar) for background tasks: OCR fallback, background extraction, notification delivery, webhook processing, and prompt/audit retention jobs.

5) Data & Storage (right side / bottom)
- Primary DB: Supabase (managed Postgres) — label as Supabase (free tier/back-end) and show it storing metadata, structured extraction results, booking records, prompts versions, and audit logs.
- Object Storage: Cloudinary for uploaded documents, thumbnails, and derived artifacts (no S3 in this deployment).
- Append-only encrypted audit log for storing raw OCR, prompt versions, and extraction history for reproducibility and compliance.

6) Observability & Ops
- Logging & tracing (e.g., OpenTelemetry) → central log store
- Monitoring: Prometheus + Grafana
- Error reporting: Sentry
- Deployment annotations: Vercel labeled for Next.js, worker hosts or serverless functions for background jobs; note Cal.com integration for scheduling.

7) External integrations
- Cloud OCR provider (Google Vision) as fallback
- Mapping / geocoding (Google Maps or OpenStreetMap) for facility discovery and proximity search
- Cal.com for scheduling / doctor availability integration
- Vercel as deployment target for Next.js frontend and serverless API

Main request/data flows to show (use numbered arrows)
Make the flows explicit and complete so the audience understands the role of each AI/LLM component and why it exists.

Flow A — Document upload & analysis (detailed AI-enabled flow):
1. Client uploads document (mobile or web). Mobile may first do local OCR/LLM inference while offline, then sync when online → API Gateway / Documents Service.
2. Documents Service stores the file in Cloudinary and writes metadata to Supabase (Postgres).
3. Documents Service enqueues OCR/extraction job → Worker Queue.
4. Worker pulls job → OCR Pipeline (prefer server-side Tesseract first or on-device Tesseract for mobile). If confidence below threshold, call Google Vision fallback (dashed optional arrow).
5. OCR output → Extraction Service: deterministic parsing rules run first, then LLM-assisted extraction refines ambiguous values and units. Record prompt used, prompt version, and confidence score.
6. Extraction produces structured JSON (tests array) stored in Supabase; LLM Interpretation Service may run enrichment tasks (interpretation, severity scoring, suggested follow-ups).
7. Notify client via websocket/Push/long-poll; mobile caches results locally for offline access.

Flow B — Interpretation & Chat (complete LLM flow):
1. Client requests explanation or initiates chat for documentId → Chat Service via tRPC Gateway.
2. Chat Service assembles context bundle: structured extraction, raw OCR excerpt, patient profile, recent messages, and relevant prompts or system policies.
3. Chat Service calls LLM Interpretation Service. For light/low-latency tasks, the mobile local LLM may answer directly when offline; for deeper reasoning, route to the central cloud LLM.
4. LLM Interpretation Service performs prompt-based reasoning, runs rule-based verification, tags severity, and returns both plain-language output and structured follow-ups (actions, recommended care sites).
5. Chat Service stores message + prompt version + LLM confidence in Supabase, returns response to client, and enqueues any follow-up jobs (e.g., facility suggestion, booking creation).

Flow C — Care discovery & booking (no payments):
1. From analysis/chat, user requests nearby facilities → Facility Discovery Service queries Supabase and calls Maps/Geocoding for proximity results.
2. User selects clinic/doctor (map-enabled UI shows nearest clinics/hospitals) → optionally open Cal.com scheduler or Booking Service to reserve a slot.
3. Booking Service creates booking record in Supabase, attaches documentId, updates status (PENDING → CONFIRMED), and triggers notifications via Worker Queue.
4. No payment collection or payment adapters are present anywhere in the diagram — explicitly omit payment providers.

Security & compliance callouts
- Auth: OAuth / social login + session tokens or JWT; protect APIs with middleware
- Data protection: encrypt sensitive fields at rest; Cloudinary assets private by default; use signed URLs for client access and short-lived tokens for downloads.
- Audit: store raw OCR, extraction output, LLM prompt version, and model response hashes in Supabase for reproducibility and audits.
- Rate limiting and abuse protection at API Gateway

Non-functional requirements (annotate in diagram)
- Scalability: stateless API + horizontal worker pool for OCR and LLM orchestration
- Availability: multi-AZ or region deployments for DB and object storage; backups for DB
- Latency targets: chat responses <5s (cached prompts), OCR batch tasks tolerated longer

Annotations to include on the diagram
- Label important flows with numbers matching the Flow sections
- Show which components are synchronous (API) vs asynchronous (workers/queues)
- Mark third-party services (Google Vision, Maps, Cal.com, Vercel) clearly as external
- Emphasize which LLMs are on-device (mobile local LLM) vs cloud-hosted (central LLM) and annotate typical usage (low-latency answers, offline mode vs heavy reasoning and fine-tuning in cloud).

Export and editing instructions
1. Generate diagram in Eraser using this prompt.
2. Click "Save and Edit Diagram" to refine layout manually if needed.
3. Export as SVG and PNG, high resolution.
4. Insert the exported image into the Gamma slide (Technical Credibility slide) — do not create an extra slide.

Follow-up edit prompts (examples you can paste into Eraser to refine)
- "Group the OCR pipeline and extraction service into a single 'Document Intelligence' box and highlight the LLM Interpretation Service with a purple accent. Keep the worker queue and async flows clearly dashed and greyed."
- "Add a small legend explaining: solid arrow = synchronous request, dashed arrow = async worker flow, dotted arrow = optional/fallback flow."
- "Show horizontal zones labeled: Client, API/Gateway, Services, Data & Storage, External Integrations, Observability."

Optional: Mermaid quick sketch (if you prefer an editable text-based diagram first)
```mermaid
flowchart LR
  subgraph CLIENT[Client / Edge]
    A[Expo Mobile]
    B[Next.js Web]
  end

  subgraph API[API / Gateway]
    G[tRPC Gateway]\n(Auth + validation)
  end

  subgraph SERVICES[Services]
    D[Documents Service (Cloudinary → Supabase)]
    O[OCR Pipeline (on-device / server + Google Vision fallback)]
    E[Extraction Service (rules + LLM assist)]
    L[LLM Interpretation (central and mobile-local LLM)]
    C[Chat Service]
    F[Facility Discovery]
    Bk[Booking Service]
  end

  subgraph DATA[Data & Storage]
    DB[(Postgres / Neon)]
    S3[(Object Storage)]
    Q[(Worker Queue)]
  end

  A --> G --> D --> S3
  D --> Q --> O --> E --> DB
  C --> L --> DB
  F --> DB
  Bk --> DB
```

This Mermaid is an editable sketch and helpful if you want a quick textual model for Eraser to refine.

--------------------------------------------------------------------------------
If you want, I can also:
- Produce a shorter 2–3 sentence prompt tuned for faster, simpler diagrams.
- Generate a labeled PNG export-ready checklist for what to verify in the Eraser output (labels present, flows numbered, async vs sync legend).

Paste the Detailed prompt into Eraser and generate the diagram. If you paste the generated diagram export here I can help review and suggest edits to make it presentation-ready.

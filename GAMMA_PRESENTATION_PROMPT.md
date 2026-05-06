# Klaro — Gamma.ai presentation prompt (Devkada Codekada hackathon)

Purpose: paste the content below into https://gamma.app/create/paste to auto-generate a 10-slide presentation for the Klaro project. No emojis. System architecture is handled separately (see the "Separate system architecture diagram" prompt lower in this file).

Notes before you paste:
- This file already enforces exactly 10 slides (use the card separator `---`).
- Do NOT include a dedicated "System Architecture" slide here — use the separate diagram prompt below and import its image into slide 7 (Technical stack) or UX slides as an image.
- Gamma: enable card-by-card control if you want to tweak each slide after generation.


---
Title: Klaro — Smart Consent & Privacy Assistant
Team: Klaro (Devkada Codekada Hackathon)
Subtitle: Simplifying user consent and privacy-ready workflows for web and mobile
One-line hook: Demonstration of Klaro in a 3-minute demo video; slides support the narrative.

---
Title: Problem
- Users and teams struggle to collect, manage, and audit user consent across apps.
- Complex flows lead to lost trust, legal risk, and missed conversion.
- Judges should quickly understand the pain and real-world impact.

---
Title: Solution
- Klaro: unified consent management that integrates with web and mobile apps.
- Automates consent capture, storage, and audit logs with developer-friendly SDKs.
- Reduces friction while maintaining compliance and clear UX.

---
Title: Demo snapshot (record these clips)
- Clip A (Sign-in & quick setup): show onboarding and enabling consent in 10–15s.
- Clip B (Live flow): capture a user granting/withdrawing consent and the immediate app behavior (30–45s).
- Clip C (Audit & admin): show admin view with searchable audit log and export (15–20s).

---
Title: Key features
- Instant SDK integration (web + mobile) — plug-and-play consent capture.
- Centralized audit logs and exports (CSV/JSON) for compliance evidence.
- Granular consent toggles and versioned policies.
- Real-time revoke + effect propagation to downstream services.

---
Title: UX & Screens to show
- Landing / install screen: short caption "How to add Klaro".
- In-app consent modal with clear choices and microcopy.
- Admin dashboard: filters, export, and policy versioning.
- Use zoomed callouts on the consent modal to emphasize clarity.

---
Title: Technical stack (high level)
- Frontend: Next.js (web), Expo (mobile) — screenshots included in demo.
- Backend: Node.js + TypeScript server (API gateway + microservices).
- Database: Postgres (Drizzle ORM), encrypted at rest.
- Storage & assets: Cloudinary or S3 for screenshots and logs.
- AI components: separate orchestration for policy summarization & consent recommendations (see separate architecture prompt).

---
Title: Data privacy & security
- All consent records hashed and stored with timestamps and policy versions.
- Data minimization: only required metadata stored; opt-out removes PII flows.
- Transport: TLS; at-rest encryption for sensitive logs; role-based access for admin.

---
Title: Impact & metrics
- Expected benefits: higher consent completion, fewer support requests, simpler audits.
- Example KPIs to show in slides/video: consent rate (+%), revoke rate, time-to-compliance.
- If possible, include short user quote or simulated metric to prove value.

---
Title: Call to action & next steps
- Try the demo (link to live demo or repo) and view README for quick install.
- Where to find the code: GitHub repo link and contact email.
- Roadmap: short bullets — broaden integrations, policy AI, enterprise features.



## Separate system architecture diagram (use a different AI/diagram tool)

Purpose: generate a clear, high-resolution architecture diagram image (SVG/PNG) that you will insert into the slide deck (recommended slide: "Technical stack" or an extra appendix image). Use the diagram tool's export and then add the image into Gamma.

Suggested prompt for a diagram generator (Mermaid/Diagrams.net/PlantUML or an AI diagram tool):

"Create a clean, labeled system architecture diagram for the Klaro project. Produce an exportable SVG or PNG. Components and relationships:
- Clients: Web (Next.js) and Mobile (Expo) on the left.
- Edge: CDN + TLS.
- API Gateway / Auth layer (JWT + OAuth) connecting clients to backend.
- Auth service: dedicated microservice for authentication and policy versioning (list: session tokens, refresh, policy IDs).
- Consent Service: core microservice that: captures consent events, versioned policies, returns consent state.
- Policy AI Service (separate AI component): performs policy summarization, suggestion, and risk scoring. Note: this is a separate AI orchestration that can call LLMs and run locally or via cloud functions.
- Worker queue (e.g., Redis/Sidekiq): for async propagation, revoke propagation to downstream services.
- Downstream services: Analytics, Email, Third-party Integrations (e.g., Cal.com, Cloudinary) with webhooks.
- Database: Postgres (consent records, audits) and optionally an append-only encrypted log store for compliance.
- Storage: Cloud Storage (S3/Cloudinary) for assets and exported audit files.
- Monitoring & Logging: Prometheus + Grafana; Sentry for errors.

Include arrows showing flows for: user consent -> API -> Consent Service -> DB; consent revoke -> worker queue -> downstream revoke actions. Visualize the Policy AI Service calling LLMs and returning policy summaries to the admin UI.

Label each component with the suggested tech stack (e.g., Next.js, Expo, Node.js/TS, Postgres, Redis, Cloud Functions/Serverless for AI, Drizzle ORM). Use clear boxes, grouped zones (Client, Edge, API, Services, Data Stores, Third-party). Export as high-resolution SVG/PNG suitable for embedding in presentation slides."

Notes on using the diagram in Gamma:
- Export PNG/SVG and upload it to Gamma; place it on the Technical stack slide or as an appendix image.
- Keep text on the slide short and let the diagram image be the focal point.


## Video & slide timing guidance (3-minute demo video)
- Total length allowed: 3:00 (180s). Aim for ~2:45 to allow buffer.
- Suggested pacing:
  - Title: 5–8s
  - Problem: 12–15s
  - Solution: 12–15s
  - Demo snapshot (main): 40–50s (split across clips A/B/C above)
  - Key features: 10–15s
  - UX & Screenshots: 15–20s
  - Technical stack (show diagram image briefly): 10–12s
  - Data & Privacy: 8–10s
  - Impact & metrics: 12–18s
  - Call to action and close: 6–10s

Recording tips:
- Use short, focused clips and quick transitions. Keep narration tight and practice once or twice.
- Use the slide captions to reinforce what the demo shows; record a quick voiceover that aligns with slide bullets.
- When showing the live app, highlight the single path you want judges to focus on (fewer navigation choices helps clarity).


## How to use
1. Copy the card content block (the 10 slides section only, i.e., from the first `---` through the last slide `---`) and paste into https://gamma.app/create/paste.
2. Ask Gamma to generate the presentation, then upload the exported System Architecture PNG/SVG into the Technical stack slide (or append as image).
3. Enable card-by-card control to tweak wording and images.


Good luck — paste the slides now into Gamma and iterate once you see the generated visuals.
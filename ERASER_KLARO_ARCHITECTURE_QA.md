# Klaro — Architecture diagram Q&A & guidance for Eraser

This file answers the follow-up questions you provided and clarifies what to emphasize in the Eraser architecture diagram. It also reconfirms that the project has NO payments integration — booking remains but without any payment provider.

---

## Quick answers (for the reviewer form)

- Which areas require the most detail or annotations?
  1. Authentication and authorization flows — show session/JWT lifecycle, social login entry points, and middleware at the API gateway.
  2. Document processing and LLM integration — annotate OCR confidence fallback, extraction rules vs LLM-assist, prompt versioning, and storage of raw OCR + structured output for audit.
  3. Worker queue and async/background processing — show which work is async (OCR jobs, fallback calls, notifications) and label the queue technology (Redis) and worker pools.
  4. Observability, monitoring, and error reporting — show traces, logs, metrics, and where Sentry/Prometheus/Grafana collect from.
  5. External integrations — Google Vision, Maps/Geocoding — label as external and dashed lines. (There is NO Stripe/GCash/Maya — payments removed.)

- Document analysis & chat: emphasize backend orchestration or UX?
  - Recommendation: emphasize backend orchestration while including a minimal UX lane.
    - Reason: Judges and technical reviewers want to see orchestration, reliability, and safety controls (LLM guardrails, auditability). Keep UX steps visible as a thin client/edge lane so the flow is clear for product reviewers.

- Specific pain points / reviewer concerns to highlight
  - OCR accuracy and fallback: show confidence threshold and cloud fallback path.
  - LLM hallucination & safety: display prompt/versioning, severity scoring, and auto-disclaimer gating for high-severity outputs.
  - Data privacy & audit: show encrypted storage, signed URLs for documents, retention of raw OCR and prompt versions for traceability.
  - Latency & scale: indicate which services are async (workers) vs sync, and note expected latency targets (chat <5s cached, OCR longer).
  - Worker reliability: show queue persistence and retry/backoff for background jobs.
  - External dependency risk: mark Google Vision / Maps as optional fallbacks and note a mock/local-mode for demo.

---

## How to reflect these items in the Eraser diagram

1. Add a small legend (required):
   - solid arrow = synchronous
   - dashed arrow = async/background
   - dotted arrow = optional / fallback

2. Annotate the Document Intelligence group:
   - OCR (Tesseract.js) — label local and cloud fallback (Google Vision)
   - Extraction: rules first, LLM-assist when ambiguous
   - LLM Interpretation: store prompt version and safety metadata

3. Show Auth as middleware at the gateway and a separate Auth service for token/session management.

4. Show the Worker Queue with arrows to OCR, fallback calls, notifications, and any long-running tasks.

5. Remove any payment provider boxes (Stripe, GCash, Maya). Instead:
   - Show Booking Service with DB writes and an optional doctor confirmation workflow via Worker Queue.

6. Add callouts for security and compliance (encrypt sensitive fields, signed URLs, prompt retention for audits).

---

## Suggested short prompt variant (2–3 sentences) for a quick Eraser run

"Create a presentation-ready system architecture diagram for Klaro (no payments). Show clients (Expo mobile, Next.js web) → centralized tRPC gateway with Auth → Document Intelligence (uploads → OCR with Google Vision fallback → extraction rules + LLM-assisted normalization) → Chat/LLM interpretation → Facility discovery and Booking (no payment adapter). Include Worker Queue for async jobs, Postgres + object storage, and observability (Prometheus/Grafana, Sentry). Export SVG/PNG."

---

## Risk mitigations to call out on diagram or speaker notes

- OCR fallback: include confidence threshold and cloud fallback to reduce false negatives.
- LLM safety: store prompt versions, severity scoring, and add auto-disclaimer + booking suggestion for high-severity outputs.
- Data retention: archive raw OCR + prompt inputs in an encrypted audit store for reproducibility.
- Demo mode: include a note that external services can be mocked for offline demo (maps/geocode, Google Vision).

---

If you want, I will now:

- Paste the short prompt into Eraser and iterate with you on adjustments (requires you to paste back the exported diagram), or
- Produce a finalized Eraser diagram-as-code snippet (if you have an Eraser account and want to paste diagram-as-code), or
- Update the `ERASER_KLARO_ARCHITECTURE_PROMPT.md` and `ERASER_KLARO_ARCHITECTURE_TASKS.md` with the short prompt and these Q&A answers embedded.

Which of the three options do you want me to do next?

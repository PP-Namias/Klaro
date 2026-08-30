# Claro Platform — Codebase Audit Report

**Lead:** Jhon Keneth Ryan B. Namias
**Method:** 7 parallel subsystem auditors + 7 adversarial verifiers reading the real code
(14 agents, 816 tool calls). Every finding below is grounded in `file:line` evidence.
**Outcome:** [`prd.json`](../prd.json) — 11 epics, 158 executable tasks, run with `/goal`.

---

## 1. The headline

**This is not an unfinished codebase. It is a nearly-complete codebase that is not plugged in.**

`packages/api` alone holds ~15,000 lines of pipeline services: OCR, image preprocessing, cloud
fallback, PHI scrubbing, hallucination detection, severity scoring, dialect handling, audit
logging, medical terminology. Most of it is well written. Most of it is **called by nothing**.

The user-visible symptom — "/scan just shows *Take a photo & Scan here* and nothing works" — is not
caused by missing features. It is caused by **three specific defects**, each a few lines long, that
break the chain at three different layers.

### Root cause 1 — every scan is rejected before it starts

`packages/api/src/services/ocr.ts` casts the tesseract.js result to a shape with a `data.lines`
field. That field does not exist in tesseract.js v7 (the real shape is
`data.confidence` / `data.blocks`, and `createWorker`'s default output block is `{ text: true }`,
so blocks are `null` unless explicitly requested). The cast silently yields `undefined`, confidence
computes to **0**, and `runOcrWithRetry` in `ocrPipeline.ts` rejects the document as unreadable.

> Every single upload fails this check. No document has ever passed it.

### Root cause 2 — every real image is rejected in transport

`packages/gemini-scan-backend/src/index.js:19` mounts `express.json()` with no `limit`, so
body-parser's **100 kB** default applies. The live caller
(`packages/api/src/router/documents.ts:750-767`) POSTs the entire medical image as base64 inside a
JSON body. Any real photo exceeds 100 kB and is rejected at the parser before the route runs.

### Root cause 3 — the UI can never display success

`apps/nextjs/src/hooks/use-file-upload.ts:169-172` computes `allComplete` / `anyError` from the
render-time `queue` closure plus a `newItems` array it never mutates. The condition is never true,
so `stage` never leaves `"uploading"`. `UploadComplete` and `UploadError` are gated on stages that
are unreachable, and the progress bar is frozen at the 10% set once at line 159.

Fix those three (`T-3.1`, `T-2.1`, `T-2.2`) and the pipeline has a spine. Everything else in the
PRD is built on top of that spine.

---

## 2. Compliance violations on the live path

These are blockers under the **Philippine Data Privacy Act (RA 10173)**.

| # | Violation | Evidence |
|---|-----------|----------|
| 1 | Every uploaded medical image is **written to disk** | `gemini-scan-backend/src/routes/scan.js:65,81` → `storage.js:36` `fs.writeFile` |
| 2 | Extracted PHI is **written to disk as JSON** | `routes/scan.js:99` → `db.js:saveResult` |
| 3 | That PHI is readable over an **unauthenticated GET** | `routes/scan.js:108-113` |
| 4 | All scans share the scanId `"unknown"`, so patients **overwrite each other** | `routes/scan.js:43` |
| 5 | Raw image bytes are `PUT` to a **client-supplied URL** (SSRF + exfiltration) | `routes/scan.js:67-74,83-90` |
| 6 | The Gemini system prompt **instructs the model to persist images** | `src/prompts.js:10` |
| 7 | **No PHI scrubbing** before the third-party call | `documents.ts:729-793` — `phiScrubber` is wired only into orphaned code |
| 8 | Authenticated path persists documents to **Cloudinary + Postgres** | `apps/nextjs/src/app/api/documents/scan/route.ts`, `documents.ts:178-230` |
| 9 | Raw chat messages persist to `chat_message.content` | `packages/api/src/router/chat.ts:152,182,212,338` |
| 10 | **No consent gate exists.** `MedicalDisclaimerOverlay` (342 LOC) and `useMedicalDisclaimer` are rendered by nothing, and cite **HIPAA**, not RA 10173 | zero importers |

`fileCleanup.ts` implements retention-window deletion — but **retention is not zero-storage**.
Never storing is.

---

## 3. Orphaned code: built, tested, never called

| Module | LOC | Callers |
|--------|-----|---------|
| `packages/ai-sidecar` (LangChain + LangGraph, the product-required service) | 1,661 | **none** |
| `packages/api/src/services/aiSidecarClient.ts` | 96 | **none** |
| `apps/nextjs/src/components/ai-workflow/**` (contains a fake `setTimeout(2000)` upload) | 1,014 | **none** |
| `upload-form.tsx` + `scan-results.tsx` + `scan-container.tsx` — a **working** camera→upload path | 1,170 | **none** |
| `MedicalDisclaimerOverlay` + `useMedicalDisclaimer` | 413 | **none** |
| `dialectDetection.ts` | 171 | **none** |
| `layouts/Scan/**` (`ScanPreview` renders fabricated lab values) | 229 | **none** |

The bitter irony: a **correct** camera-capture-to-upload implementation already exists in
`upload-form.tsx:297-347`. The broken one in `ScannerUI.tsx` is the one that ships.

Likewise, the rich results UI — `SeverityIndicator`, `ConfidenceScore`, `PlainLanguageSummary`,
`FlaggedValuesSection`, `TanongMoCard` — renders **only** on `/documents/[id]`, the authenticated,
DB-persisted (non-compliant) route. It never renders on `/scan`.

---

## 4. Claims vs. measured reality

| Claim | Reality | Where |
|-------|---------|-------|
| "200+ Philippine lab test variants" | **4** generic layout regexes + **70** alias entries | `extraction.ts:166-178`, `:13` |
| "Comprehensive medical reference ranges" | **21** analytes (severityScoring) + **~37** (hallucinationDetection) — two competing tables | `severityScoring.ts:19`, `hallucinationDetection.ts` |
| "Image pre-processing: deskew, denoise, binarize" | Algorithms are **real**, but they dynamically import `canvas`, which is **not a dependency** — so it logs `preprocessing disabled` and no-ops | `imagePreprocessor.ts:11-27` |
| "Google Cloud Vision fallback" | `cloudOcr.ts` is a **correct REST implementation** (no SDK needed) — but the low-confidence path never calls it | `cloudOcr.ts`, `ocrPipeline.ts` |
| "Dialect auto-detection by geography" | **Does not exist.** `detectDialect()` matches *text*, not location, and has no callers. `navigator.geolocation` is used only by the facilities map | `dialectDetection.ts:41` |
| "One standalone Express AI microservice" | **Two** services. The required one is orphaned; the live one is plain JS outside every quality gate, and its own `AGENT_PROMPT.md` describes an **invoice/receipt/passport** scanner | — |
| Commitlint enforcement (per `git-policy.md`) | **No commitlint config exists anywhere** | verified |
| Pre-commit hook (`.husky/pre-commit`) | **Cannot run for anyone** — `husky` and `lint-staged` are undeclared, no `prepare` script, no config | verified |
| Test coverage | `use-file-upload.test.ts` **never imports** `useFileUpload` — it asserts on local literals. Router and AI suites are **excluded from CI** | — |

---

## 5. Security findings

- `documents.scanGuestImage` is a `publicProcedure`: **no auth, no rate limit**, and
  `base64Image` has **no maximum size**. `scanProcedure` (which *has* both) is not used here.
- `root.ts` exposes `llmTest` — an unauthenticated, unthrottled LLM proxy.
- `analyzeScanWithAI` is a second public, unbounded, unscrubbed LLM path, and interpolates
  caller-controlled strings directly into the clinical system prompt (**prompt injection**).
- `documents.cleanupFiles` / `cleanupStats` are documented admin-only but are plain
  `protectedProcedure` — any signed-in user can run them.
- The audit router lets any authenticated user read **any** user's PHI audit log.
- `doctor.listDoctors` / `search` `SELECT *`, exposing **PRC licence numbers** and internal user IDs
  to anonymous callers.
- `payments.handleWebhook` accepts any non-empty string as a Stripe signature; `payments.refund`
  lets the payer refund themselves.
- Resource leaks: camera `MediaStream` (5 sites), Tesseract workers, `cloudOcr` abort timers.

---

## 6. What the PRD does about it

| Epic | Theme | Tasks |
|------|-------|-------|
| 1 | Zero-storage, consent & RA 10173 compliance | 16 |
| 2 | Make `/scan` work end to end | 20 |
| 3 | OCR: confidence, preprocessing, Vision fallback, PDF | 16 |
| 4 | Medical parsing engine | 6 |
| 5 | AI extraction, confidence & provider fallbacks | 13 |
| 6 | Validation, hallucination detection & severity | 9 |
| 7 | Dialect auto-detection & Clara | 19 |
| 8 | Consolidate to one Express AI microservice | 15 |
| 9 | Security, authorization & audit trail | 25 |
| 10 | Care routing: doctors, facilities, scheduling | 14 |
| 11 | Test, CI & release hardening | 5 |

**158 tasks** — 39 blocker, 64 high, 43 medium, 12 low. The dependency graph is acyclic and fully
schedulable; 56 tasks are eligible immediately.

Tasks **prefer wiring existing code over rewriting it** — `reuses_existing` names the orphaned
module to plug in. Roughly a third of the work is connection, not construction.

---

## 7. How to run it

```bash
/goal
```

Reads `prd.json`, executes each `passes: false` task in dependency order, runs
`pnpm typecheck && pnpm lint && pnpm test`, and commits each task separately.
Scope it with `/goal EPIC-1` or `/goal T-3.1`, or preview with `/goal --dry-run`.

The full agent contract is [`.agents/prompts/CLARO_PRD_AGENT_PROMPT.md`](../.agents/prompts/CLARO_PRD_AGENT_PROMPT.md).

**Suggested order:** `T-3.1` → `T-2.1` → `T-2.2` restores the pipeline spine. Then EPIC-1 in full,
because the storage violations are legally blocking and cannot ship.

---

## 8. Verification honesty

- 7 auditors produced 121 tasks; 7 adversarial verifiers re-checked every gap and added 71 further
  defects. **No gap was refuted**; 14 were marked *overstated* and were folded in at their
  corrected severity.
- Overlapping findings were de-duplicated by hand into 158 tasks (the camera-stream leak alone was
  reported independently by 7 agents).
- Tasks derived from verifier findings carry the verifier's own suggested fix as an acceptance
  criterion; these are less precisely phrased than the auditors' criteria, though their
  `file:line` evidence is equally specific.
- Nothing in this report or in `prd.json` was inferred from documentation. Every claim came from
  reading executable code.

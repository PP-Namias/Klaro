# AI Agent Prompt — `/scan` Page Tasks, Input→Process→Output Logic (Gemini-First)

## Goal

Create and complete the `/scan` page workflow end-to-end using **Google Gemini as the primary AI engine**, including upload, scan processing, result rendering, fallback behavior, and safe user messaging.

## Plan (Execute in Order)

1. Confirm `/scan` route contract and UI states.
2. Finalize input schema for uploaded files and metadata.
3. Implement process pipeline (upload → OCR/extraction → Gemini analysis → normalization).
4. Enforce output schema and frontend rendering contract.
5. Add error handling + fallback for API/model failures.
6. Add tests (unit + integration + UI smoke).
7. Auto-commit after each completed, validated milestone.

## Primary AI Model Policy

- **Primary model/provider:** Google Gemini
- **Primary model name:** `gemini-2.0-flash` (or project-configured equivalent)
- **Fallback policy:** if Gemini fails/timeouts/invalid JSON, use deterministic fallback analysis and return safe output.
- Keep responses deterministic for structured output: temperature near 0 for extraction/analysis steps.

## `/scan` Page Scope

The AI agent must complete logic for:

- Guest and authenticated scan entry paths
- Upload validation and scan request creation
- Processing state updates
- Result display (summary, urgency, recommendations, confidence)
- Error and retry handling
- Persisting/re-hydrating scan session state

## Input Contract

The `/scan` workflow accepts:

- `base64Image` (required for guest scan flow)
- `fileName` (optional)
- `language` (default `English`, allowed: `Filipino`, `English`)
- Optional context fields when available: `patientAge`, `patientSex`, `facilityName`

### Input Validation Rules

- Reject empty payloads and malformed base64.
- Validate file type and size before upload.
- Normalize language to allowed enum values.
- Reject requests missing required scan bytes.

## Process Logic (Agent Must Implement)

1. **Upload Intake**
   - Validate file and metadata.
   - Generate/track `requestId`.

2. **OCR / Extraction Layer**
   - Extract structured values from scan input.
   - Produce `extractedData` + confidence markers.

3. **Gemini Analysis Layer (Primary)**
   - Send normalized prompt with strict JSON response format.
   - Require fields: summary, urgency, recommendations.

4. **Normalization Layer**
   - Parse/repair JSON if minor formatting noise exists.
   - Validate schema and clamp values to allowed enums/ranges.

5. **Fallback Layer**
   - If Gemini fails or output invalid, generate safe fallback result.
   - Always return a valid response envelope to frontend.

6. **Frontend State Update**
   - Persist in scan session storage.
   - Render result card and urgency state.
   - Enable retry/re-scan path.

## Output Contract (Required)

Return a normalized object compatible with `/scan` UI:

- `requestId: string`
- `status: "completed" | "error"`
- `language: "Filipino" | "English"`
- `analysis?: { summary: string; urgency: "LOW" | "MODERATE" | "HIGH"; recommendations: string[] }`
- `plainLanguageSummary?: string`
- `urgency?: "LOW" | "MODERATE" | "HIGH"`
- `recommendations?: string[]`
- `confidence?: number`
- `extractedData?: object`
- `warnings?: string[]`
- `error?: string`
- `timestamp: ISO8601 string`

## UI State Machine for `/scan`

The agent must preserve this flow:

- `idle` → waiting for upload
- `uploading` → file being sent
- `processing` → OCR/Gemini/fallback in progress
- `completed` → result displayed
- `error` → user sees retry option

Non-blocking UX rules:

- Show loading text while processing.
- Keep user informed if scheduling/booking side-panel is still loading.
- Never leave user in silent state; always show current phase.

## Gemini Prompting Rules (For Agent)

- Return **JSON only** for machine-parseable steps.
- Use concise, patient-friendly language in final summary.
- No diagnosis claims beyond available evidence.
- Include urgency escalation guidance only when appropriate.
- Include safety disclaimer for high-risk patterns.

## Auto-Commit Guide (Mandatory During Task Execution)

The AI coding agent must auto-commit after each validated milestone.

### Commit Trigger Rules

Create a commit when all are true:

1. A logical unit of work is complete (feature/fix/refactor/docs/test).
2. Related tests/checks pass for changed scope.
3. No broken lint/type checks introduced in touched files.

### Commit Message Format

Use conventional commits:

- `feat(scan): add guest image scan pipeline with gemini primary flow`
- `fix(scan): handle invalid gemini json with safe fallback`
- `test(scan): add integration coverage for processing states`
- `docs(scan): update prompt contract for input-process-output`

### Commit Granularity Rules

- One intent per commit.
- Do not combine unrelated changes.
- Include tests in the same commit as behavior change when possible.

### Suggested Milestone Commits

1. `feat(scan): finalize input validation and request contract`
2. `feat(scan): implement processing pipeline with gemini-first logic`
3. `fix(scan): add fallback and robust error envelope handling`
4. `feat(scan): wire output contract to scan results UI`
5. `test(scan): add unit and integration tests for scan workflow`
6. `docs(scan): publish ai agent prompt and completion checklist`

## Definition of Done

Task is complete only when:

- `/scan` supports full input→process→output lifecycle.
- Gemini is primary provider in the analysis path.
- Fallback path works when Gemini is unavailable.
- Output schema is stable and validated.
- UI states are accurate and user-friendly.
- Tests pass for updated scan logic.
- Auto-commit milestones are created with clear messages.

## Ready-to-Use Agent Prompt

Use this as the implementation prompt for the coding agent:

You are the Scan Workflow Implementation Agent for Klaro. Your mission is to complete the `/scan` page end-to-end using Google Gemini as the primary AI provider. Implement and verify the full input→process→output pipeline with strict schema validation, safe fallback behavior, and user-friendly UI states.

Requirements:

- Treat Gemini as primary for scan analysis and structured summary generation.
- Enforce validated input schema and normalized output schema.
- Ensure robust handling for loading, partial, and error states.
- Maintain deterministic JSON parsing and safe fallback when model output is invalid.
- Keep frontend session state synchronized with backend response envelope.
- Add/adjust tests for processing logic and UI rendering states.
- Auto-commit after each validated milestone using conventional commit messages.

Output expectations:

- Working `/scan` flow with complete lifecycle handling.
- Clear urgency + recommendations rendering.
- Stable API/UI contract.
- Test coverage for critical paths.
- Clean commit history aligned to milestone completions.

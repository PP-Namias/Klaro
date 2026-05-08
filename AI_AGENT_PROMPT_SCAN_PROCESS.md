AI Agent Prompt - /scan Page Workflow Assistant

Purpose
-------
Use this prompt for the coding agent that completes the `/scan` workflow end to end. The agent must improve the full input -> process -> output pipeline for the Klaro scan page, with Google Gemini as the primary model, safe fallback behavior, and milestone-based auto-commits.

What the agent owns
-------------------
- Guest scan upload flow on `/scan`
- Input validation for file bytes, file type, file size, and metadata
- Processing state management during upload, OCR/extraction, Gemini analysis, and fallback
- Output normalization for the scan sidebar and results page
- Session persistence and rehydration
- Tests for scan logic and UI states
- Auto-commit after each validated milestone

Current UI contract
-------------------
The `/scan` experience already uses these pieces:
- `UploadForm` for file capture and guest image submission
- `ScanContainer` to switch between upload and results states
- `ScanResults` to render the finished result
- `ScanAgentSidebar` to show analysis output and rerun analysis
- `scan-session` helpers to persist a scan session in `sessionStorage`

The agent must preserve the current state machine:
- `idle` - waiting for upload
- `uploading` - file being sent
- `processing` - OCR/Gemini/fallback in progress
- `completed` - result displayed
- `error` - retry path visible

Primary model policy
--------------------
- Primary provider: Google Gemini
- Preferred model: `gemini-2.0-flash` or the project-configured Gemini model
- Keep structured extraction deterministic by using low temperature
- Return JSON only for machine-parsed steps
- If Gemini fails, times out, or emits invalid JSON, use a deterministic safe fallback

Input contract
--------------
The agent should support the `/scan` input payload used by the guest scan flow:
- `base64Image` - required scan bytes
- `fileName` - optional original file name
- `language` - default `English`, allowed values `English` and `Filipino`
- Optional context fields when available: `patientAge`, `patientSex`, `facilityName`

Validation rules
----------------
- Reject empty payloads
- Reject malformed base64
- Validate file type before upload
- Validate file size before upload
- Normalize `language` to the allowed enum
- Reject requests missing required scan bytes
- Generate or preserve a `requestId` for every scan

Processing logic
----------------
1. Upload intake
- Validate file and metadata
- Mark the request as pending or uploading
- Track a stable `requestId`

2. OCR/extraction layer
- Extract structured values from the scan input
- Return `extractedData` plus confidence markers when possible

3. Gemini analysis layer
- Send a normalized prompt to Gemini
- Require strict JSON output with summary, urgency, and recommendations
- Prefer concise, patient-friendly language
- Avoid diagnosis claims beyond the available evidence

4. Normalization layer
- Parse JSON safely
- Repair minor formatting noise if needed
- Clamp values to the allowed enums and ranges
- Ensure the result always conforms to the UI contract

5. Fallback layer
- If Gemini fails, return a deterministic safe result
- Preserve a valid response envelope
- Include warning text when fallback was used

6. Frontend state update
- Persist the normalized session state
- Rehydrate the current scan if the page reloads
- Render urgency, summary, recommendations, confidence, warnings, and extracted data
- Keep retry and rescan actions available

Output contract
---------------
Return a normalized object compatible with the `/scan` UI:
- `requestId: string`
- `status: "completed" | "error" | "pending"`
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

Gemini prompt rules
-------------------
- Use JSON only for the machine-readable response
- Keep the summary short and understandable for patients
- Use urgency labels exactly as `LOW`, `MODERATE`, or `HIGH`
- Include escalation guidance only when the pattern is risky
- Include a safety disclaimer for high-risk findings
- Return 1 to 3 recommendations only

Fallback behavior
-----------------
If Gemini cannot produce a valid result:
- Mark the result as safe fallback output
- Keep the response schema valid
- Provide a brief summary that explains the result is incomplete or uncertain
- Avoid alarming language unless the input clearly warrants it

Testing expectations
--------------------
The agent should add or update tests for:
- input validation
- file handling and upload state
- Gemini JSON parsing and normalization
- fallback behavior
- session persistence and rehydration
- UI rendering for completed, pending, and error states

Auto-commit guide
-----------------
The agent must create a commit after each validated milestone.

Commit triggers
- A logical unit of work is complete
- Related tests or checks pass for the touched scope
- No new lint, type, or build breakage is introduced in changed files

Commit style
- Use conventional commits
- One intent per commit
- Keep tests with the behavior change when possible

Suggested commit messages
- `feat(scan): finalize input validation and request contract`
- `feat(scan): implement processing pipeline with gemini-first logic`
- `fix(scan): add fallback and robust error envelope handling`
- `feat(scan): wire output contract to scan results ui`
- `test(scan): add unit and integration tests for scan workflow`
- `docs(scan): update prompt contract for input-process-output`

Definition of done
------------------
The task is complete only when:
- `/scan` supports the full input -> process -> output lifecycle
- Gemini is the primary provider in the analysis path
- Fallback works when Gemini is unavailable
- The output schema is stable and validated
- UI states are accurate and user-friendly
- Tests pass for the updated scan logic
- Auto-commit milestones are created with clear messages

Ready-to-use implementation prompt
----------------------------------
You are the Scan Workflow Implementation Agent for Klaro. Your mission is to complete the `/scan` page end to end using Google Gemini as the primary AI provider. Implement and verify the full input -> process -> output pipeline with strict schema validation, safe fallback behavior, and user-friendly UI states.

Requirements:
- Treat Gemini as the primary model for scan analysis and structured summary generation
- Enforce validated input schema and normalized output schema
- Ensure robust handling for loading, partial, and error states
- Maintain deterministic JSON parsing and safe fallback when model output is invalid
- Keep frontend session state synchronized with the backend response envelope
- Add or adjust tests for processing logic and UI rendering states
- Auto-commit after each validated milestone using conventional commit messages

Output expectations:
- Working `/scan` flow with complete lifecycle handling
- Clear urgency and recommendations rendering
- Stable API and UI contract
- Test coverage for critical paths
- Clean commit history aligned to milestone completions

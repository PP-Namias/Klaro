---
trigger: on_demand
description: AI agent prompt for implementing Klaro medical AI backend, Cloudinary storage, and Cal.com scheduling.
---

# Klaro Medical AI Backend Agent Prompt

You are an autonomous coding agent working in the Klaro monorepo. Your job is to implement the backend AI flow for medical document understanding, secure media storage, and doctor scheduling. Work in small verified slices. Do not commit unless the user explicitly approves.

## Goal

Build the production backend flow for Klaro:

1. Home/root CTA opens the scan flow.
2. Users capture or upload medical files from web/mobile.
3. Files are uploaded to Cloudinary.
4. Only the Cloudinary URL and metadata are stored in the database.
5. OCR and document parsing run on the uploaded file.
6. Gemini AI API produces plain-language medical explanations on the server.
7. Gemma 4 is used for free local/mobile inference when offline or cost-sensitive.
8. The output includes plain language, recommendations, and safe next steps.
9. Chat uses the extracted document context plus conversation history.
10. Cal.com handles doctor scheduling and availability.

## Product rules

- Never store raw file binaries in the database.
- Never commit secrets, API keys, or tokens.
- Never invent medical facts. If data is missing, say it is unknown.
- Always include a safety disclaimer when output touches diagnosis, medication, or urgent symptoms.
- Prefer structured output from the AI layer: summary, findings, recommendations, follow-up questions, and escalation flags.
- Keep patient-facing language simple, calm, and understandable.

## Required services

- Cloudinary: secure file storage for images and PDFs.
- Gemini AI API: server-side document interpretation and explanation.
- Gemma 4: local/mobile fallback model for free inference on-device.
- Cal.com: doctor scheduling and availability.
- PostgreSQL: metadata only, including file URL, file type, ownership, analysis status, and AI output references.
- tRPC and Next.js API routes: backend transport and route handling.

## Suggested response shape

Whenever the AI returns a document interpretation, use a typed structure like:

- `summary`
- `findings`
- `recommendations`
- `followUpQuestions`
- `riskFlags`
- `disclaimer`

## Execution order

### Slice 1: Audit current flow

- Inspect the upload, document, chat, booking, and scheduling routes.
- Confirm current database fields for documents, analyses, and file metadata.
- Identify which services already exist and which are still placeholders.
- Choose the smallest safe path to connect the new AI flow.

### Slice 2: Secure upload pipeline

- Ensure upload endpoints store only Cloudinary URLs and file metadata.
- Preserve ownership checks.
- Validate file type and size before upload.
- Return clear 401, 403, 413, and 415 responses where applicable.

### Slice 3: OCR and medical parsing

- Route uploaded file URLs through OCR and document parsing.
- Produce structured extracted fields and a normalized medical summary.
- Keep parsing deterministic when possible.

### Slice 4: Gemini analysis layer

- Add a server-side Gemini integration for explanation generation.
- Output plain-language explanations for general users.
- Include recommendations, next steps, and escalation hints.
- Use a strict prompt template and a typed response shape.

### Slice 5: Gemma 4 mobile/local layer

- Add a local/mobile AI fallback path using Gemma 4.
- Keep the mobile experience functional when cloud inference is unavailable.
- Prefer lightweight inference for summarization and suggestions.

### Slice 6: Chat integration

- Build chat around the uploaded document context.
- Include previous conversation turns and extracted document data.
- Make the assistant respond in simple language.
- Preserve safety boundaries and avoid medical overreach.

### Slice 7: Cal.com scheduling

- Wire Cal.com for doctor availability and booking.
- Keep schedule data tied to the patient context and selected doctor.
- Use the backend as the source of truth for schedule state.

### Slice 8: Validation

- Run `pnpm -w run typecheck`.
- Run `pnpm -w run lint`.
- Run `get_errors` on every touched file.
- Verify the scan -> upload -> AI -> chat -> scheduling flow.

## Implementation rules

- Use shared schema validation for every request and response.
- Put business logic in packages or backend services, not in UI components.
- Keep patient-facing copy short, calm, and easy to understand.
- If you add a helper or doc, keep it focused and minimal.
- Do not broaden scope unless a validation failure proves the current slice is wrong.

## What to update

- Backend routes for upload, OCR, analysis, and chat.
- AI service wrappers for Gemini and Gemma 4.
- Scheduling integration for Cal.com.
- PRD or progress notes only if the flow changes materially.
- OpenAPI docs only if endpoints change.

## Final output required from the agent

Provide:

- A short audit summary.
- Files changed.
- Validation results.
- Any follow-up work still needed.
- A copy-paste commit message only if the user explicitly approves committing.

End of prompt.

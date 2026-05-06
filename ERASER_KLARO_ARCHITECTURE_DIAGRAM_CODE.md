# Klaro — Eraser Diagram Code

This file保存s the actual Eraser diagram output for reuse in the Architecture Diagram Generator.

```text
direction right

// Client / Edge Zone
Clients [icon: smartphone, color: teal] {
  Expo Mobile [icon: react, label: "Expo / React Native"]
  Local LLM [icon: cpu, label: "On-Device LLM"]
  Local Storage [icon: database, label: "Local Cache"]
  Next.js Web [icon: nextjs, label: "Next.js + React"]
}

// API & Gateway Zone
Gateway [icon: aws-api-gateway, color: purple] {
  tRPC Gateway [icon: server, label: "tRPC Gateway"]
  Auth Service [icon: lock, label: "Auth (OAuth/JWT)"]
  Rate Limiter [icon: shield, label: "Rate Limiting"]
}

// Services Zone
Services [icon: layers, color: blue] {
  Document Intelligence [icon: file-text, color: teal] {
    Documents Service [icon: upload, label: "Documents Service"]
    OCR Pipeline [icon: eye, label: "OCR Pipeline"]
    Extraction Service [icon: filter, label: "Extraction Service"]
  }

  AI Services [icon: cpu, color: purple] {
    LLM Interpretation [icon: brain, label: "LLM Interpretation"]
    Chat Service [icon: message-circle, label: "Chat Service"]
  }

  Care Services [icon: heart, color: green] {
    Facility Discovery [icon: map-pin, label: "Facility Discovery"]
    Booking Service [icon: calendar, label: "Booking Service"]
  }
}

// Async Workers
Workers [icon: activity, color: orange] {
  Worker Queue [icon: list, label: "Redis Queue"]
  Background Jobs [icon: clock, label: "Background Workers"]
}

// Data & Storage Zone
Data [icon: database, color: gray] {
  Supabase [icon: postgresql, label: "Supabase (Postgres)"]
  Cloudinary [icon: cloud, label: "Cloudinary Storage"]
  Audit Log [icon: file-text, label: "Encrypted Audit Log"]
}

// External Integrations
External [icon: globe] {
  Google Vision [icon: eye, label: "Google Vision OCR"]
  Google Maps [icon: map, label: "Maps / Geocoding"]
  Cal.com [icon: calendar, label: "Cal.com Scheduling"]
}

// Deployment & Observability
Ops [icon: monitor, color: gray] {
  Vercel [icon: vercel, label: "Vercel Deployment"]
  Observability [icon: activity, label: "Logging / Tracing"]
  Sentry [icon: alert-triangle, label: "Sentry Errors"]
}

// Flow A: Document Upload & Analysis
Expo Mobile > tRPC Gateway: 1. upload
Next.js Web > tRPC Gateway: 1. upload
tRPC Gateway > Auth Service: validate
tRPC Gateway > Documents Service: 2. process
Documents Service > Cloudinary: 3. store file
Documents Service > Supabase: 3. metadata
Documents Service > Worker Queue: 4. enqueue OCR
Worker Queue > Background Jobs
Background Jobs < OCR Pipeline: 5. process
OCR Pipeline --> Google Vision: fallback if low confidence
OCR Pipeline > Extraction Service: 6. extract
Extraction Service > LLM Interpretation: refine values
Extraction Service > Supabase: 7. store results
LLM Interpretation > Audit Log: log prompt version

// Flow B: Chat & Interpretation
Expo Mobile > Chat Service: chat request
Chat Service > LLM Interpretation: 8. interpret
Local LLM <-- Expo Mobile: offline inference
LLM Interpretation > Supabase: store response
Chat Service < Expo Mobile: 9. response

// Flow C: Facility Discovery & Booking
Chat Service > Facility Discovery: suggest facilities
Facility Discovery > Google Maps: proximity search
Facility Discovery > Supabase: query facilities
Facility Discovery > Booking Service: 10. create booking
Booking Service > Cal.com: schedule slot
Booking Service > Supabase: booking record
Booking Service > Worker Queue: notify

// Offline Sync
Local Storage <-- Expo Mobile: cache locally
Local Storage --> Supabase: background sync

// Observability
tRPC Gateway > Observability: traces
Services > Sentry: errors
Vercel <-- Next.js Web: deploy
Vercel <-- tRPC Gateway: deploy

legend {
  [connection: ">", label: "Synchronous request / data flow"]
  [connection: "-->", label: "Async / fallback / optional flow"]
  [connection: "<>", label: "Bidirectional sync"]
}
```

## Notes

- No payments are included.
- The diagram is already arranged for a rightward, landscape-style flow.
- Cloudinary is used instead of S3.
- Supabase is the backend database.
- Expo Mobile is offline-first with a local on-device LLM.

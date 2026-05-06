# Klaro Devkada Codekada — Gamma Copy-Paste Prompt (10 Slides)

This file gives you a complete, copy-paste prompt for `https://gamma.app/create/paste`.

It is aligned to the **real Klaro product context**:

- Klaro scans medical documents (lab results, prescriptions, discharge summaries)
- Uses OCR + LLM to generate plain-language explanations
- Provides context-aware AI chat
- Helps users find nearby clinics/hospitals and proceed to booking/payment
- Focused on Filipino patients and caregivers

It also follows your constraints:

- Exactly **10 slides**
- **No emojis**
- English only
- Hackathon-appropriate tone
- No dedicated slide titled **System Architecture**

---

## Best approach before you paste into Gamma

Use these settings in Gamma:

- Audience: Hackathon judges, technical evaluators, product/business reviewers
- Language: American English
- Tone: Confident, clear, technical but accessible, impact-driven, product-focused
- Card mode: Card-by-card
- Keep slide count: 10

Recommended visual style keywords (paste in Gamma keywords):

- futuristic
- neon
- gradient
- minimalism
- luxurious
- elegant
- minimal
- premium

Recommended image style:

- Illustration or 3D for concept visuals
- Photo for any real product screenshots

---

## Copy this section into Gamma (card-by-card)

Klaro — Instant Plain-Language Medical Understanding for the Philippines

Tagline: Scan records, understand results, and take the right next step.

Context: Klaro helps patients and caregivers understand medical documents and navigate care faster.

---

The Problem: Medical Documents Are Hard to Understand

- Lab results and prescriptions are full of technical language.
- Patients often leave without clarity on what matters now.
- Caregivers and families struggle to interpret medical information correctly.
- Delays in understanding lead to delayed care decisions.

---

The Klaro Solution

- Upload or scan lab results, prescriptions, and discharge summaries.
- OCR extracts document data from images/PDFs.
- AI explains findings in plain language.
- Context-aware chat answers follow-up questions.
- Klaro guides users to nearby clinics/hospitals and enables booking/payment.

---

How Klaro Works (Patient Flow)

1. Capture or upload a medical document.
2. OCR + extraction structures test values and key notes.
3. LLM generates clear interpretation with safety guidance.
4. Patient asks follow-up questions in AI chat.
5. Patient is guided to care options and booking.

---

What Makes Klaro Different

- Medical understanding + care coordination in one flow
- Built for Filipino patient realities and caregiver use cases
- Shared typed backend for web and mobile consistency
- Practical next-step guidance, not just passive analysis

---

Core Features in the MVP

- Document upload and scan (mobile + web)
- OCR with fallback strategy
- Plain-language interpretation
- Context-aware AI chat
- Nearby facility discovery
- Doctor booking and payment flow

---

Product Value and User Impact

- Faster understanding of test results
- Better confidence before consultations
- Reduced confusion for caregivers and families
- Improved access to timely care decisions
- Better continuity from document to action

---

Technical Credibility (Without Full Architecture Slide)

- Mobile: Expo (React Native)
- Web: Next.js + React
- Backend: Node.js + centralized tRPC API (`packages/api`)
- Database: PostgreSQL/Neon
- OCR: Tesseract.js + cloud fallback
- AI: Prompt-based LLM with rule-based verification

---

Hackathon Readiness and Demo Scope

- End-to-end demo path: scan -> explain -> chat -> find care -> book/pay
- Shared API contract across mobile and web
- Production-minded foundations: validation, auth guards, structured errors
- Designed for a clear 3-minute demo narrative

---

Closing: Why Klaro Matters

Klaro turns complex medical documents into understandable guidance and actionable care steps.

It bridges patient understanding, AI interpretation, and care coordination in one practical product.

Klaro helps people move from confusion to confident healthcare decisions.

---

## Per-slide speaking script (English, no emojis)

Use this for voiceover/video narration. Keep total video under 3 minutes.

### Slide 1 Script

Klaro is an AI-enabled health product built for the Philippines. Our core mission is simple: when patients receive complex medical documents, Klaro helps them understand what those results mean in plain language and what to do next.

### Slide 2 Script

The problem is that medical documents are hard for non-clinicians to interpret. Patients and caregivers often struggle with technical terms, which can delay decisions and create anxiety at exactly the wrong moment.

### Slide 3 Script

Klaro solves this by combining document understanding with care navigation. We scan or upload records, extract information through OCR, interpret it with AI, and then guide users toward practical next steps, including nearby care options.

### Slide 4 Script

This slide shows the user journey. The patient uploads a document, Klaro processes and interprets the content, then the user can ask follow-up questions and continue directly into care coordination and booking if needed.

### Slide 5 Script

What makes Klaro different is that it is not just analysis. It connects understanding to action. It is designed around real patient and caregiver behavior and built with a unified backend so web and mobile behave consistently.

### Slide 6 Script

Our MVP already includes the most important building blocks: upload and scan, OCR, AI interpretation, contextual chat, facility discovery, and booking/payment flow. Together, these features form one coherent patient experience.

### Slide 7 Script

The impact is practical and immediate. Klaro reduces confusion, improves confidence, and helps families and patients make faster, better-informed care decisions.

### Slide 8 Script

From a technical perspective, Klaro is built as a modern monorepo. We use Expo for mobile, Next.js for web, a centralized typed tRPC backend, PostgreSQL/Neon, OCR services, and an LLM layer with verification safeguards.

### Slide 9 Script

For hackathon judging, we are demonstrating a complete end-to-end flow: from document ingestion to interpretation and into care coordination. This is not a disconnected prototype; it is a coherent product system.

### Slide 10 Script

In summary, Klaro transforms difficult medical records into understandable guidance and actionable care pathways. We believe this can improve patient outcomes by helping people decide earlier and act with clarity.

---

## Separate prompt for system architecture diagram (generate outside Gamma)

You asked to keep architecture separate. Use this in a diagram AI tool, then export PNG/SVG and insert the image into one of the 10 slides (preferably slide 8).

Prompt:

Create a clean, presentation-ready system architecture diagram for Klaro.

Requirements:

- Do not use emojis.
- Use a minimal, premium visual style with futuristic gradient accents.
- Label all components clearly.
- Export as high-resolution SVG and PNG.

Diagram content:

1. Client Layer

- Expo mobile app
- Next.js web app

1. API Layer

- Centralized tRPC backend (`packages/api`)
- Auth/session guards
- Validation and structured error handling

1. Intelligence Layer

- OCR pipeline (Tesseract.js + cloud fallback)
- Structured extraction/normalization
- LLM interpretation with rule-based verification
- Context-aware AI chat service

1. Care Coordination Layer

- Facility discovery service
- Booking service
- Payment integration

1. Data/Storage Layer

- PostgreSQL/Neon
- Object storage for uploaded documents

Show flow arrows:
Document upload -> OCR -> Extraction -> AI interpretation -> Chat follow-up -> Facility discovery -> Booking/payment

Add note:
Single typed backend contract is shared by web and mobile clients.

---

## Quick execution guide

1. Copy only the "Copy this section into Gamma" block and paste into Gamma.
2. Keep it at exactly 10 cards.
3. Generate slides using the recommended keywords/styles.
4. Generate architecture diagram separately using the dedicated prompt.
5. Insert that diagram image into slide 8 (Technical Credibility) without adding extra slides.
6. Use the per-slide speaking script for your 3-minute MP4 narration.

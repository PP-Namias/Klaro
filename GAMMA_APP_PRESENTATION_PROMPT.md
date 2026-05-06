# Klaro — Gamma.ai paste prompt for the hackathon deck

Paste the 10-slide block below into <https://gamma.app/create/paste> to generate a polished presentation for Klaro.

Use this as the best approach for the hackathon submission:

- Keep the deck to exactly 10 slides.
- Do not include a system architecture slide in Gamma.
- Generate the system architecture separately with another AI tool, then upload it as an image if needed.
- Use the deck to support the video, not replace the demo.
- Avoid emojis completely.

Recommended Gamma settings:

- Write for: Hackathon judges, technical evaluators, and product/business reviewers
- Tone: Confident, clear, technical but accessible, impact-driven, product-focused
- Output language: English
- Theme: Aurora or Blues
- Image source: AI image model
- Image art style: Illustration or Photo for app screenshots
- Card-by-card: On
- Emojis: none

Suggested visual approach:

- Use real product screenshots where possible.
- Keep each slide focused on one idea.
- Use short titles and short body copy.
- Put the strongest proof points on the middle slides.
- Leave the architecture diagram out of the slide deck so the 10-slide limit stays clean.

Use the `---` separators exactly as written. This keeps the deck to 10 slides.

---
Title: Klaro — Instant medical understanding for the Philippines
Subtitle: Scan records. Understand results. Take action.
Body: Klaro turns confusing medical documents into readable guidance for patients and caregivers.

---
Title: The problem
- Medical records are hard to understand.
- Patients often do not know what the results mean or what to do next.
- Families and caregivers lose time translating jargon into action.

---
Title: The solution
- Klaro reads medical records and turns them into plain language.
- It gives context-aware AI guidance based on the document.
- It helps users understand the next practical step.
- It connects them to clinics, hospitals, and doctors when needed.

---
Title: How Klaro works
- Upload or capture a lab result, prescription, or discharge summary.
- OCR extracts the text and structure.
- Klaro verifies the content and generates a readable explanation.
- The user can ask follow-up questions in chat.

---
Title: Demo flow
- Scan or upload a document.
- Review the key findings and severity highlights.
- Ask Klaro follow-up questions in plain language.
- Discover nearby clinics or hospitals.
- Continue to booking and payment if care is needed.

---
Title: Key capabilities
- Plain-language document explanation
- Context-aware AI chat
- Nearby clinic and hospital discovery
- Doctor booking and payment
- Filipino-first health guidance for real patient use

---
Title: User journey
- A patient receives a medical record.
- Klaro scans the document.
- Klaro explains the findings in simple language.
- Klaro suggests what may need attention and what the next step could be.
- The patient can search, book, and pay for care if needed.

---
Title: Why it matters
- Faster understanding of medical records
- Better patient confidence
- Less confusion for families and caregivers
- Faster care navigation
- Stronger product value for judges and users

---
Title: Technical stack
- Mobile: Expo (React Native)
- Web: Next.js + React
- Backend: centralized tRPC API
- Database: PostgreSQL / Neon
- OCR: Tesseract.js with Google Vision fallback
- LLM: prompt-based API with rule-based verification

---
Title: Closing
- Klaro makes medical records understandable.
- Klaro helps users decide what to do next.
- Klaro combines document understanding, AI guidance, and care coordination in one product.


## Separate system architecture diagram prompt

Do not use the architecture as a Gamma slide. Generate it separately as an SVG or PNG and upload it into Gamma if needed.

Use this diagram prompt in your diagram AI tool:

"Create a clean system architecture diagram for Klaro.

Show these layers:

- Client layer: Expo mobile app and Next.js web app.
- API layer: centralized tRPC backend.
- Service layer: OCR, medical-record parsing, AI interpretation, booking, payment, and resource suggestion.
- Data layer: PostgreSQL / Neon with Prisma migrations.
- Storage layer: S3-compatible storage for documents and images.
- AI layer: prompt-based LLM service with rule-based verification.
- Fallback OCR: Tesseract.js on client and server, with Google Vision as fallback.

Show the main flow:

medical record upload -> OCR -> structured extraction -> AI explanation -> chat follow-up -> clinic discovery -> booking/payment.

Show that the backend is centralized and shared by both web and mobile.

Label technologies clearly and keep the diagram modern, minimal, and presentation-ready."


## Video guidance

Keep the presentation supporting a 3-minute MP4 demo.

- Keep the deck visual and concise.
- Show the most important product moments.
- Use the slides to support the video, not fight it.
- Upload real screenshots where possible.
- Avoid emojis completely.

Suggested timing:

- Title: 5 to 8 seconds
- Problem: 10 to 12 seconds
- Solution: 10 to 12 seconds
- How it works: 15 to 20 seconds
- Demo flow: 10 to 12 seconds
- Key capabilities: 10 to 12 seconds
- User journey: 15 to 20 seconds
- Why it matters: 10 to 12 seconds
- Technical stack: 10 to 12 seconds
- Closing: 5 to 8 seconds

Notes:

- Before pasting into Gamma, update any repo or demo links.
- Use card-by-card control so Gamma makes exactly 10 slides.
- Keep the architecture diagram separate so the slide deck stays within the 10-slide limit.

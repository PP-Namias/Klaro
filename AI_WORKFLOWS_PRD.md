# AI Document Workflows - Product Requirements Document

## Overview

Klaro AI Workflows enables users to upload medical documents (lab results, prescriptions, discharge summaries, X-rays) and receive instant, plain-language explanations powered by AI. The system transforms complex medical data into actionable insights that Filipino patients can understand.

## User Journey

```
Upload Document → OCR Processing → AI Analysis → Plain Language Results → Chat Follow-up → Book Doctor
```

---

## Epic 1: Document Upload & Capture

### E-AI-100: Multi-Format Document Upload

**Priority:** High  
**Phase:** 1 (Days 1-3)  
**Owner:** Frontend Lead

#### Description
Support upload of images (JPG, PNG, HEIC), PDFs, and multi-page documents from both mobile camera capture and web file upload. Include drag-and-drop, preview, and validation.

#### Stories

**E-AI-100-S1: Camera Capture & Image Upload**
- Mobile camera capture with alignment guide overlay
- Auto-detect document edges and crop
- Support gallery selection as alternative
- Preview before upload

**E-AI-100-S2: PDF Upload & Multi-Page Support**
- Drag-and-drop file upload
- PDF preview with page thumbnails
- Multi-page selection (select specific pages)
- File size validation (max 10MB per file, max 20 pages)

**E-AI-100-S3: Upload Progress & State Management**
- Real-time upload progress indicator
- Cancel upload functionality
- Resume on network failure
- Success screen with document ID

#### Acceptance Criteria
- [ ] Mobile capture returns document ID within 5 seconds
- [ ] Web upload accepts PNG/JPG/PDF files
- [ ] Invalid files show clear error messages
- [ ] Upload progress visible at all times
- [ ] Network interruption allows resume

#### Tech Stack
- Expo Camera (mobile)
- React Dropzone (web)
- PDF.js (preview)
- tRPC upload endpoint

---

## Epic 2: AI-Powered OCR Processing

### E-AI-200: Intelligent Document Text Extraction

**Priority:** High  
**Phase:** 2 (Days 3-5)  
**Owner:** ML Engineer

#### Description
Extract text from medical documents using multi-layer OCR: local Tesseract for fast processing, with Gemini Vision fallback for complex layouts and low-confidence results.

#### Stories

**E-AI-200-S1: Local OCR Engine (Tesseract)**
- Initialize Tesseract with English + Filipino language packs
- Process uploaded images locally for fast initial extraction
- Compute per-field confidence scores
- Flag low-confidence results for cloud fallback

**E-AI-200-S2: Gemini Vision Integration**
- Integrate Gemini 2.0 Flash for complex documents
- Process multi-page PDFs as batch
- Extract structured data: test names, values, units, reference ranges
- Handle handwritten notes and annotations

**E-AI-200-S3: Result Aggregation & Quality**
- Merge local and cloud OCR results
- Prefer higher-confidence extraction
- Store both raw and normalized text
- Track processing time and confidence metrics

#### Acceptance Criteria
- [ ] OCR extracts >=90% of key-value pairs from demo lab results
- [ ] Processing time <15 seconds per page
- [ ] Confidence scores provided for each extracted field
- [ ] Cloud fallback triggered when local confidence <70%
- [ ] Filipino/English mixed text handled correctly

#### Tech Stack
- Tesseract.js (client + server)
- Gemini Vision API (cloud fallback)
- Image preprocessing (sharp/canvas)

---

## Epic 3: AI Text Transformation

### E-AI-300: Medical-to-Plain-Language Conversion

**Priority:** High  
**Phase:** 3 (Days 5-7)  
**Owner:** AI Engineer

#### Description
Transform extracted medical data into natural, easy-to-understand text for Filipino users. Support Tagalog, Bisaya, and English with dialect-specific explanations.

#### Stories

**E-AI-300-S1: Structured Data Extraction**
- Parse OCR text into structured JSON format
- Extract: test name, value, unit, reference range
- Flag abnormal values (high/low/critical)
- Map test name synonyms to canonical names

**E-AI-300-S2: Plain Language Explanation Generation**
- Generate patient-friendly explanations for each test
- Use analogies and simple vocabulary (Grade 8 reading level)
- Include Filipino/Tagalog language options
- Add contextual warnings for critical values

**E-AI-300-S3: Severity Scoring & Recommendations**
- Calculate urgency level: LOW, MODERATE, HIGH, CRITICAL
- Generate personalized recommendations
- Create "Tanong Mo Sa Doktor" (Ask Your Doctor) cards
- Include booking CTA for high-severity results

**E-AI-300-S4: Multi-Language Support**
- Tagalog (Filipino) explanations
- Bisaya (Cebuano) explanations
- English explanations
- Dialect detection from user input

#### Acceptance Criteria
- [ ] Each test has plain-language explanation
- [ ] Explanations readable by average Filipino (Grade 8 level)
- [ ] High-severity results include clear warnings
- [ ] Tanong Mo Sa Doktor card has 3+ questions
- [ ] Language switching works correctly

#### Tech Stack
- Gemini LLM API
- Prompt engineering templates
- Dialect detection classifier

---

## Epic 4: Results Display & UI

### E-AI-400: Interactive Results Dashboard

**Priority:** High  
**Phase:** 4 (Days 7-10)  
**Owner:** Frontend Lead

#### Description
Display processed results with interactive visualizations, severity indicators, and actionable cards. Mobile-first responsive design.

#### Stories

**E-AI-400-S1: Results Overview Screen**
- Document type badge and scan timestamp
- Urgency indicator with color coding
- Plain-language summary card
- Quick actions: Share, Download PDF, Book Doctor

**E-AI-400-S2: Detailed Test Results**
- Expandable test cards with:
  - Test name (normal vs flagged)
  - Value with unit
  - Reference range visualization
  - Status indicator (normal/high/low/critical)
  - Plain-language explanation
- Filter by status (show flagged only)

**E-AI-400-S3: Tanong Mo Sa Doktor Card**
- AI-generated questions for doctor consultation
- Copy-to-clipboard functionality
- Share with doctor button
- Print-friendly format

**E-AI-400-S4: Document Timeline**
- Upload timestamp
- Processing status
- Analysis completion
- Share link creation

#### Acceptance Criteria
- [ ] Results load within 2 seconds
- [ ] Mobile responsive on all screen sizes
- [ ] Severity colors: Green (normal), Yellow (moderate), Red (high)
- [ ] Share link generates correctly
- [ ] PDF export includes all results

#### Tech Stack
- React + TypeScript
- Tailwind CSS
- Framer Motion (animations)
- React-PDF (export)

---

## Epic 5: AI Chat Integration

### E-AI-500: Contextual Document Chat

**Priority:** Medium  
**Phase:** 5 (Days 10-12)  
**Owner:** AI Lead

#### Description
Enable users to ask follow-up questions about their results in natural language. The AI understands document context and provides relevant answers.

#### Stories

**E-AI-500-S1: Chat Interface**
- Chat bubble UI with message history
- Input field with send button
- Typing indicator
- Message timestamps

**E-AI-500-S2: Document-Aware Responses**
- AI has access to extracted data and analysis
- Responses reference specific test values
- Context-aware follow-up suggestions
- Safety disclaimers for medical advice

**E-AI-500-S3: Simplification Mode**
- "Simplify" button to get easier explanations
- Toggle between normal and simple language
- Shorter sentences, basic vocabulary
- Visual indicators for simplified mode

**E-AI-500-S4: Suggested Questions**
- Pre-generated follow-up questions
- Category-based: Results, Next Steps, Symptoms
- One-tap to ask question
- Dynamic based on severity

#### Acceptance Criteria
- [ ] Responses generated within 3 seconds
- [ ] Follow-up suggestions present in >80% of responses
- [ ] Simplify mode produces shorter, simpler text
- [ ] Medical advice disclaimers present
- [ ] Chat history persisted per document

#### Tech Stack
- tRPC chat endpoint
- Gemini LLM with context
- WebSocket for real-time (optional)

---

## Epic 6: Sharing & Export

### E-AI-600: Document Sharing & PDF Export

**Priority:** Medium  
**Phase:** 6 (Days 12-14)  
**Owner:** Backend Lead

#### Description
Generate shareable links and export results as PDF for doctor consultation or personal records.

#### Stories

**E-AI-600-S1: Share Link Generation**
- Tokenized URL with expiry (30 days)
- Public view without login required
- Copy-to-clipboard
- QR code generation

**E-AI-600-S2: PDF Export**
- Print-friendly format
- Include all test results
- Plain-language explanations
- Tanong Mo Sa Doktor questions
- Company branding

**E-AI-600-S3: Doctor Preview Mode**
- Read-only view for shared links
- No edit capabilities
- Professional formatting
- Download button

#### Acceptance Criteria
- [ ] Share link works without authentication
- [ ] PDF exports correctly formatted
- [ ] Share link expires after 30 days
- [ ] QR code scannable
- [ ] PDF includes all required sections

#### Tech Stack
- JWT for token generation
- React-PDF or Puppeteer
- QR code library

---

## Epic 7: Backend Integration

### E-AI-700: API & Database Architecture

**Priority:** High  
**Phase:** 1 (Days 1-2)  
**Owner:** Backend Engineer

#### Description
Setup centralized backend API, database schema, and core services for document processing workflow.

#### Stories

**E-AI-700-S1: Database Schema**
- Document table: id, userId, filename, type, status, metadata
- Analysis table: documentId, extractedData, analysis, plainLanguage
- Chat table: documentId, messages, timestamps
- ShareLink table: documentId, token, expiresAt

**E-AI-700-S2: tRPC Endpoints**
- documents.upload: Upload document
- documents.analyze: Trigger AI analysis
- documents.getById: Get document details
- documents.list: List user documents
- chat.send: Send chat message
- chat.history: Get chat history
- share.create: Generate share link
- share.getByToken: Access shared document

**E-AI-700-S3: Processing Queue**
- Background job for AI processing
- Status updates: pending, processing, completed, failed
- Retry logic for failed jobs
- Webhook for completion notification

#### Acceptance Criteria
- [ ] All endpoints functional
- [ ] Database migrations created
- [ ] Processing queue handles concurrent uploads
- [ ] Error responses structured consistently
- [ ] API documentation generated

#### Tech Stack
- tRPC + Prisma ORM
- PostgreSQL
- Bull/BullMQ (job queue)

---

## Technical Architecture

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User Upload │────▶│   OCR Engine │────▶│ AI Analysis │
│  (Mobile/Web)│     │ (Tesseract + │     │  (Gemini)   │
└─────────────┘     │   Gemini)    │     └─────────────┘
                    └──────────────┘           │
                                               ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Share Link │◀────│  Plain Lang  │◀────│  Structured │
│  / PDF Export│     │  Generation  │     │   Extract   │
└─────────────┘     └──────────────┘     └─────────────┘
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload document for processing |
| `/api/documents/:id` | GET | Get document details |
| `/api/documents/:id/analyze` | POST | Trigger AI analysis |
| `/api/documents/:id/chat` | POST | Send chat message |
| `/api/share/:token` | GET | Access shared document |
| `/api/share/create` | POST | Generate share link |

### Database Schema

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID,
  filename VARCHAR(255),
  file_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  extracted_data JSONB,
  plain_language JSONB,
  severity VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  role VARCHAR(20),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE share_links (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  token VARCHAR(100) UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Foundation (Days 1-3)
- [ ] Database schema setup
- [ ] tRPC endpoint scaffolding
- [ ] Basic upload component

### Phase 2: OCR Pipeline (Days 3-5)
- [ ] Tesseract integration
- [ ] Gemini Vision fallback
- [ ] Confidence scoring

### Phase 3: AI Analysis (Days 5-7)
- [ ] Structured extraction
- [ ] Plain language generation
- [ ] Severity scoring

### Phase 4: Results UI (Days 7-10)
- [ ] Results dashboard
- [ ] Test result cards
- [ ] Tanong Mo Sa Doktor

### Phase 5: Chat & Sharing (Days 10-14)
- [ ] Chat interface
- [ ] Share links
- [ ] PDF export

### Phase 6: Polish & Testing (Days 14-16)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes

---

## Success Metrics

| Metric | Target |
|--------|--------|
| OCR Accuracy | >=90% on demo dataset |
| Processing Time | <30 seconds per document |
| Plain Language Readability | Grade 8 level |
| User Understanding | >=80% comprehension rate |
| Share Link Usage | >=30% of users share |
| Chat Engagement | >=50% ask follow-up questions |

---

## Demo Dataset Requirements

1. 5 lab result PDFs (blood work, urinalysis, lipid profile)
2. 2 prescription images
3. 1 discharge summary
4. 1 X-ray report

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low OCR confidence | Multi-layer fallback (Tesseract → Gemini) |
| Medical misinterpretation | Disclaimer + encourage doctor consultation |
| Data privacy | Encryption at rest, secure share links |
| LLM hallucination | Structured extraction, validation rules |
| Network failures | Retry logic, offline cache |

---

## Appendix

### A. Plain Language Examples

**Medical Term:** "Elevated LDL cholesterol (180 mg/dL)"
**Plain Language:** "Your 'bad cholesterol' is higher than it should be. This can clog your arteries over time. Try to eat less fatty food and exercise more."

**Medical Term:** "Hemoglobin 14.2 g/dL"
**Plain Language:** "Your blood's ability to carry oxygen is good. This is within normal range for adults."

### B. Tanong Mo Sa Doktor Examples

1. "What does my cholesterol level mean for my heart health?"
2. "Should I change my diet based on these results?"
3. "When should I get retested?"
4. "Are there any medications I should consider?"
5. "What lifestyle changes can improve my results?"

### C. Severity Color Coding

| Level | Color | Meaning |
|-------|-------|---------|
| LOW | 🟢 Green | Normal, no action needed |
| MODERATE | 🟡 Yellow | Monitor, follow-up recommended |
| HIGH | 🟠 Orange | See doctor soon |
| CRITICAL | 🔴 Red | Seek immediate medical attention |

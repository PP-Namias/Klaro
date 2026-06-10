# AI Document Workflows - Backend Architecture PRD

## Overview

Klaro's backend processes medical documents (lab results, prescriptions, discharge summaries, X-rays) through an intelligent pipeline that extracts text, understands medical data, and transforms it into plain-language explanations. This PRD defines a **smarter, faster, more resilient** backend architecture.

## Current State Analysis

### What Exists Today
- **Two parallel processing paths** (authenticated tRPC flow vs guest Gemini Express flow)
- **Synchronous processing** — OCR, extraction, and LLM calls block the request
- **Regex-only extraction** — No LLM-assisted extraction despite schema support
- **No job queue** — All processing happens in request lifecycle
- **File-based storage** in Gemini backend — No database persistence
- **Rule-based LLM fallback** — Templates used when API key missing

### Key Problems
1. **Timeout risk** — Large documents + slow LLM = request timeout
2. **No retry logic** — API failures = permanent failure
3. **Dual processing paths** — Duplicate logic, different output shapes
4. **No progress tracking** — Users see "processing" with no granularity
5. **Expensive OCR workers** — Tesseract workers created/destroyed per request
6. **Dead code** — `executeDocumentWorkflow()` never called from any router

---

## Smart Backend Architecture

### Design Principles

1. **Async-First** — All heavy processing offloaded to job queue
2. **Pipeline Pattern** — Modular stages that can be swapped independently
3. **Smart Routing** — Route to the right processor based on document type
4. **Fail Gracefully** — Each stage has fallback; partial results preserved
5. **Observable** — Every step emits metrics, progress, and audit trail

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  Mobile (Expo)  │  Web (Next.js)  │  Guest (Public)                     │
└────────┬────────┴────────┬────────┴────────┬────────────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (tRPC)                               │
│  documents.upload → documents.process → documents.getById               │
│  chat.sendMessage → chat.getHistory                                     │
│  share.create → share.getByToken                                        │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       JOB QUEUE (BullMQ + Redis)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Upload   │→│   OCR    │→│ Extract  │→│ Analysis │→│ Complete │  │
│  │  Queue    │  │  Queue   │  │  Queue   │  │  Queue   │  │  Queue   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                                          │
│  Retry: 3x  │  Dead Letter: Yes  │  Priority: medical > general        │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING WORKERS                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  OCR Worker Pool                                                   │ │
│  │  ├── Tesseract Pool (5 workers, reuse across requests)            │ │
│  │  ├── Gemini Vision (cloud fallback, rate limited)                 │ │
│  │  └── Image Preprocessor (sharp: deskew, denoise, crop)           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Extraction Worker                                                 │ │
│  │  ├── Regex Engine (200+ Philippine lab patterns)                  │ │
│  │  ├── LLM Extractor (Gemini: ambiguous fields)                    │ │
│  │  └── Canonical Normalizer (test name mapping)                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Analysis Worker                                                   │ │
│  │  ├── Plain Language Generator (LLM with dialect support)          │ │
│  │  ├── Severity Scorer (rules + LLM hybrid)                        │ │
│  │  └── Tanong Mo Card Generator (question generation)               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                        │
│  PostgreSQL (Drizzle ORM)  │  Redis (Queue + Cache)  │  S3 (Documents) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Smart Processing Pipeline

### Stage 1: Intelligent Upload & Classification

**Goal:** Accept any medical document, classify it, and route to the optimal processing path.

```typescript
interface UploadResult {
  documentId: string;
  classification: {
    type: 'lab_result' | 'prescription' | 'discharge_summary' | 'xray' | 'unknown';
    confidence: number;
    suggestedProcessor: 'standard' | 'medical' | 'radiology';
  };
  metadata: {
    pageCount: number;
    fileSize: number;
    mimeType: string;
    language?: 'en' | 'fil' | 'bis';
  };
}
```

**Smart Routing Logic:**
```
IF image && containsTableLayout → standard OCR + table extraction
IF image && handwrittenNotes → Gemini Vision (better handwriting)
IF PDF && multiPage → parallel page processing
IF xray/radiology → specialized radiology prompt
IF prescription → drug interaction check
```

**Acceptance Criteria:**
- [ ] Classification accuracy >=85% on demo dataset
- [ ] Routing decision made in <500ms
- [ ] Unknown types default to standard medical processing

---

### Stage 2: Adaptive OCR Engine

**Goal:** Use the right OCR engine for the right document, with worker pooling for performance.

#### OCR Strategy Matrix

| Document Type | Primary OCR | Fallback | Preprocessing |
|---------------|-------------|----------|---------------|
| Printed Lab Result | Tesseract (local) | Gemini Vision | Deskew, denoise |
| Handwritten Notes | Gemini Vision | Tesseract | Contrast boost |
| PDF (text-based) | PDF.js text extraction | OCR on rendered pages | None |
| PDF (scanned) | Tesseract (per page) | Gemini Vision | Deskew per page |
| X-Ray Report | Gemini Vision | Tesseract | Edge detection |
| Prescription | Gemini Vision | Tesseract | Enhance handwriting |

#### Worker Pool Configuration

```typescript
interface OcrWorkerPool {
  tesseract: {
    minWorkers: 2;
    maxWorkers: 8;
    idleTimeout: 30_000; // 30s
    languages: ['eng', 'fil'];
  };
  gemini: {
    rateLimit: 10; // requests per minute
    timeout: 30_000;
    retries: 2;
  };
}
```

#### Image Preprocessing Pipeline

```typescript
async function preprocessImage(buffer: Buffer): Promise<PreprocessedImage> {
  return pipeline([
    sharp(buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }) // normalize size
      .sharpen({ sigma: 1.5 }) // enhance text
      .normalize() // fix contrast
      .threshold(128) // binarize for OCR
      .toBuffer()
  ]);
}
```

**Acceptance Criteria:**
- [ ] OCR accuracy >=92% on printed documents
- [ ] OCR accuracy >=75% on handwritten notes
- [ ] Worker pool reduces cold start by 60%
- [ ] Preprocessing improves OCR confidence by >=15%

---

### Stage 3: Hybrid Extraction Engine

**Goal:** Extract medical test data using both rules and AI, with intelligent fallback.

#### Extraction Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   OCR TEXT INPUT                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              STAGE 1: REGEX EXTRACTION                   │
│  - 200+ Philippine lab format patterns                  │
│  - Canonical name mapping (200+ synonyms)               │
│  - Reference range parsing                               │
│  - Confidence: 0.0 - 1.0 per field                      │
└─────────────────────────┬───────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│ High Confidence (≥0.8)│   │ Low Confidence (<0.8) │
│   → Use regex result  │   │   → Send to LLM       │
└───────────────────────┘   └───────────┬───────────┘
                                        │
                                        ▼
                          ┌───────────────────────┐
                          │  LLM EXTRACTION        │
                          │  Prompt: "Extract      │
                          │  test name, value,     │
                          │  unit, reference       │
                          │  range from: [text]"   │
                          └───────────┬───────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  MERGE & DEDUPLICATE   │
                          │  - Prefer regex if     │
                          │    both exist          │
                          │  - Use LLM for         │
                          │    ambiguous fields    │
                          └───────────────────────┘
```

#### Extraction Types

```typescript
interface ExtractionResult {
  method: 'regex' | 'llm' | 'hybrid';
  confidence: number;
  fields: ExtractedField[];
  warnings: string[];
  processingTimeMs: number;
}

interface ExtractedField {
  name: string;              // Canonical name
  rawName: string;           // Original text
  value: string;
  unit: string;
  referenceRange?: string;
  flagged: boolean;
  confidence: number;        // 0.0 - 1.0
  source: 'regex' | 'llm';  // Which method extracted this
}
```

#### LLM Extraction Prompt (Gemini)

```
You are a medical data extraction assistant. Extract all lab test results from this text.

For each test, return:
- name: canonical test name (use standard medical terminology)
- value: numeric value only
- unit: measurement unit
- referenceRange: "low-high" format if available
- flagged: true if value is outside reference range

Output as JSON array. If a field is uncertain, set confidence < 0.5.

Text:
{ocr_text}
```

**Acceptance Criteria:**
- [ ] Regex extracts >=85% of common lab values
- [ ] LLM extraction fills gaps for ambiguous fields
- [ ] Hybrid method achieves >=95% overall extraction rate
- [ ] Processing time <10s for typical 20-test result

---

### Stage 4: AI Analysis & Plain Language

**Goal:** Transform extracted medical data into patient-friendly explanations.

#### Analysis Pipeline

```typescript
interface AnalysisPipeline {
  // Step 1: Severity scoring
  severity: {
    method: 'rules' | 'llm' | 'hybrid';
    levels: {
      LOW: 'All values within normal range';
      MODERATE: '1-2 abnormal values, non-critical';
      HIGH: 'Multiple abnormal or critical values';
      CRITICAL: 'Life-threatening values detected';
    };
  };

  // Step 2: Plain language generation
  plainLanguage: {
    dialect: 'Filipino' | 'Bisaya' | 'Ilocano';
    readingLevel: 'grade8'; // Target reading level
    maxWords: 200;
    includeAnalogies: true;
    avoidJargon: true;
  };

  // Step 3: Question generation
  tanqmoCard: {
    questionCount: 3-5;
    focusAreas: ['meaning', 'treatment', 'lifestyle', 'follow-up'];
    dialect: string;
  };
}
```

#### Dialect-Aware Prompts

```typescript
const PLAIN_LANGUAGE_PROMPTS = {
  Filipino: {
    system: `Ikaw ay isang health assistant. Ipaliwanag ang medical results sa simpleng Tagalog.
             Gumamit ng mga halimbawa at analogies. Iwasan ang medical jargon.
             Maximum 200 words. Kasama ang mga sumusunod:
             1. Summary ng resulta
             2. Kahulugan ng bawat flagged value
             3. Mga dapat gawin
             4. Mga itatanong sa doktor`,
    
    tanqmo: `Gumawa ng 3-5 specific na tanong para sa doktor base sa mga flagged results.
              Dapat simple at direkta. Halimbawa:
              - "Ano ang ibig sabihin ng mataas na {test_name}?"
              - "Kailangan ko ba ng gamot?"`
  },
  
  Bisaya: {
    system: `Ikaw ang imong health assistant. Ipasabot ang medical results sa simpleng Bisaya.
             Gamit ug mga halimbawa. Iwasay medical jargon.
             Maximum 200 words.`,
    
    tanqmo: `Himo ug 3-5 specific nga pangutana para sa doktor base sa flagged results.`
  }
};
```

**Acceptance Criteria:**
- [ ] Plain language readable by average Filipino (Grade 8 level)
- [ ] Explanations in correct dialect (validated by native speakers)
- [ ] Tanong Mo card has 3-5 relevant questions
- [ ] High severity includes safety disclaimer + booking CTA

---

### Stage 5: Chat Context Assembly

**Goal:** Enable contextual Q&A about document results.

#### Context Window Strategy

```typescript
interface ChatContext {
  // Document context (always included)
  documentContext: {
    type: string;           // lab_result, prescription, etc.
    summary: string;        // Plain language summary
    keyFindings: string[];  // Top 3-5 findings
    severity: string;
  };

  // Test results (summarized for token efficiency)
  testResults: Array<{
    name: string;
    value: string;
    status: 'normal' | 'abnormal';
    explanation: string;    // One-line explanation
  }>;

  // Conversation history (last 5 exchanges)
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  // System instructions
  systemPrompt: string;
}
```

#### Smart Context Compression

```
IF totalTokens > 4000:
  1. Summarize test results to key findings only
  2. Keep only last 3 message exchanges
  3. Remove detailed explanations, keep summaries
  
IF totalTokens > 6000:
  1. Use only severity + top 3 flagged tests
  2. Keep only last 1 message exchange
  3. Add "Ask about specific tests" prompt
```

**Acceptance Criteria:**
- [ ] Chat responses within 3 seconds
- [ ] Context window manages token limits automatically
- [ ] Follow-up suggestions present in >80% of responses

---

## Database Schema Improvements

### New Tables

```sql
-- Job queue tracking
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  status VARCHAR(20) DEFAULT 'queued', -- queued, processing, completed, failed
  stage VARCHAR(50), -- upload, ocr, extraction, analysis, complete
  progress INTEGER DEFAULT 0, -- 0-100
  result JSONB,
  error JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_time_ms INTEGER
);

-- OCR audit trail
CREATE TABLE ocr_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  engine VARCHAR(20), -- tesseract, gemini
  confidence DECIMAL(5,4),
  raw_text TEXT,
  blocks JSONB, -- [{text, confidence, bbox}]
  preprocessing_applied JSONB, -- [{type, params}]
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extraction audit trail
CREATE TABLE extraction_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  method VARCHAR(20), -- regex, llm, hybrid
  fields_extracted INTEGER,
  fields_flagged INTEGER,
  confidence DECIMAL(5,4),
  regex_fields JSONB, -- fields found by regex
  llm_fields JSONB,   -- fields found by LLM
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow tracking
CREATE TABLE workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  event_type VARCHAR(50), -- stage.started, stage.completed, stage.failed
  stage VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Updated Document Table

```sql
ALTER TABLE documents ADD COLUMN processing_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN processing_progress INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN ocr_engine VARCHAR(20);
ALTER TABLE documents ADD COLUMN extraction_method VARCHAR(20);
ALTER TABLE documents ADD COLUMN workflow_id UUID;
```

---

## API Endpoints

### Document Processing

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `documents.upload` | mutation | Yes | Upload document, start async processing |
| `documents.process` | mutation | Yes | Trigger processing (if not auto-started) |
| `documents.status` | query | Yes | Get processing status + progress |
| `documents.cancel` | mutation | Yes | Cancel processing |
| `documents.retry` | mutation | Yes | Retry failed processing |

### Processing Status Response

```typescript
interface ProcessingStatus {
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stage: 'upload' | 'ocr' | 'extraction' | 'analysis' | 'complete';
  progress: number; // 0-100
  stages: {
    upload: { status: string; duration?: number };
    ocr: { status: string; engine?: string; confidence?: number; duration?: number };
    extraction: { status: string; method?: string; fieldsFound?: number; duration?: number };
    analysis: { status: string; severity?: string; duration?: number };
  };
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}
```

---

## Job Queue Configuration

### BullMQ Setup

```typescript
// packages/api/src/queue/index.ts
import { Queue, Worker } from 'bullmq';

export const documentQueue = new Queue('documents', {
  connection: { host: 'redis', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 }, // 24h
    removeOnFail: { age: 604800 }, // 7 days
  },
});

// Priority: medical documents > general
export const MEDICAL_PRIORITY = 1;
export const GENERAL_PRIORITY = 5;
```

### Worker Definitions

```typescript
// OCR Worker
const ocrWorker = new Worker('ocr', async (job) => {
  const { documentId, imageUrl, documentType } = job.data;
  
  // Update progress
  await job.updateProgress({ stage: 'ocr', progress: 10 });
  
  // Preprocess
  const preprocessed = await preprocessImage(imageUrl);
  await job.updateProgress({ stage: 'ocr', progress: 30 });
  
  // Route to appropriate OCR
  const ocrResult = documentType === 'handwritten' 
    ? await geminiOcr(preprocessed)
    : await tesseractOcr(preprocessed);
  
  await job.updateProgress({ stage: 'ocr', progress: 90 });
  
  // Save audit
  await saveOcrAudit(documentId, ocrResult);
  
  return ocrResult;
}, { connection: redis, concurrency: 5 });

// Extraction Worker
const extractionWorker = new Worker('extraction', async (job) => {
  const { documentId, ocrText } = job.data;
  
  // Stage 1: Regex extraction
  const regexResult = regexExtract(ocrText);
  
  // Stage 2: LLM extraction for low-confidence fields
  const lowConfidenceFields = regexResult.fields.filter(f => f.confidence < 0.8);
  let llmResult = null;
  
  if (lowConfidenceFields.length > 0) {
    llmResult = await llmExtract(ocrText, lowConfidenceFields);
  }
  
  // Stage 3: Merge results
  const merged = mergeExtractionResults(regexResult, llmResult);
  
  return merged;
}, { connection: redis, concurrency: 3 });

// Analysis Worker
const analysisWorker = new Worker('analysis', async (job) => {
  const { documentId, extractedFields, dialect } = job.data;
  
  // Severity scoring
  const severity = computeSeverity(extractedFields);
  
  // Plain language generation
  const plainLanguage = await generatePlainLanguage(extractedFields, dialect);
  
  // Tanong Mo card
  const tanqmoCard = await generateTanqmoCard(extractedFields, dialect);
  
  return { severity, plainLanguage, tanqmoCard };
}, { connection: redis, concurrency: 3 });
```

---

## Error Handling & Resilience

### Retry Strategy

| Error Type | Max Retries | Backoff | Action |
|------------|-------------|---------|--------|
| OCR Timeout | 3 | Exponential | Switch to fallback engine |
| LLM Rate Limit | 5 | Exponential | Queue + wait |
| LLM Error | 2 | Fixed 2s | Retry, then rule-based fallback |
| Network Error | 3 | Exponential | Retry with timeout |
| Validation Error | 0 | None | Log + mark failed |

### Dead Letter Queue

```typescript
// Failed jobs after max retries go to DLQ
const dlqWorker = new Worker('dead-letter', async (job) => {
  const { documentId, error, attempts } = job.data;
  
  // Log for manual review
  await logToMonitoring({
    level: 'critical',
    documentId,
    error,
    attempts,
    action: 'manual_review_required',
  });
  
  // Notify admin
  await notifyAdmin(`Document ${documentId} failed after ${attempts} attempts`);
  
  // Update document status
  await updateDocumentStatus(documentId, 'failed', { error });
});
```

### Fallback Chain

```
Primary OCR (Tesseract) → Fallback OCR (Gemini) → Manual Flag
Primary LLM (Gemini) → Fallback LLM (OpenAI) → Rule-based Templates
Primary Extraction (Hybrid) → Regex Only → Empty + Warning
```

---

## Monitoring & Metrics

### Key Metrics

```typescript
interface PipelineMetrics {
  // Processing metrics
  avgProcessingTime: number;     // ms
  p95ProcessingTime: number;     // ms
  successRate: number;           // 0-100%
  retryRate: number;             // 0-100%
  
  // OCR metrics
  ocrAccuracy: number;           // 0-100%
  ocrEngineDistribution: {
    tesseract: number;
    gemini: number;
  };
  
  // Extraction metrics
  extractionAccuracy: number;    // 0-100%
  regexHitRate: number;          // % fields found by regex
  llmFallbackRate: number;       // % fields needing LLM
  
  // Queue metrics
  queueDepth: number;
  avgWaitTime: number;           // ms
  workerUtilization: number;     // 0-100%
}
```

### Health Check Endpoint

```typescript
app.get('/health/processing', async (req, res) => {
  const health = {
    status: 'healthy',
    queue: {
      depth: await documentQueue.getWaitingCount(),
      active: await documentQueue.getActiveCount(),
      failed: await documentQueue.getFailedCount(),
    },
    workers: {
      ocr: { active: ocrWorkerActive, idle: ocrWorkerIdle },
      extraction: { active: extractionWorkerActive },
      analysis: { active: analysisWorkerActive },
    },
    metrics: await getProcessingMetrics(),
  };
  
  res.json(health);
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup BullMQ + Redis infrastructure
- [ ] Create processing_jobs table
- [ ] Implement basic job queue with single worker
- [ ] Add status tracking to documents API

### Phase 2: OCR Pipeline (Week 2)
- [ ] Implement Tesseract worker pool
- [ ] Add image preprocessing with sharp
- [ ] Create OCR audit table
- [ ] Implement Gemini Vision fallback

### Phase 3: Hybrid Extraction (Week 3)
- [ ] Build regex extraction engine (200+ patterns)
- [ ] Add LLM extraction for ambiguous fields
- [ ] Create extraction audit table
- [ ] Implement result merging logic

### Phase 4: Analysis & Language (Week 4)
- [ ] Build plain language generator with dialect support
- [ ] Implement severity scoring (rules + LLM)
- [ ] Create Tanong Mo card generator
- [ ] Add context assembly for chat

### Phase 5: Resilience & Monitoring (Week 5)
- [ ] Add retry logic with exponential backoff
- [ ] Implement dead letter queue
- [ ] Create health check endpoints
- [ ] Add Prometheus metrics

### Phase 6: Optimization (Week 6)
- [ ] Optimize worker pool sizing
- [ ] Add result caching
- [ ] Implement parallel page processing
- [ ] Performance tuning

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Processing Time (avg) | ~30s | <15s |
| Processing Time (p95) | ~60s | <30s |
| OCR Accuracy | ~85% | >=92% |
| Extraction Accuracy | ~80% | >=95% |
| Success Rate | ~90% | >=99% |
| Retry Rate | 0% | <5% |
| Time to First Result | ~5s | <3s |

---

## Migration from Current System

### Step 1: Add Queue Infrastructure
```bash
pnpm add bullmq ioredis
```

### Step 2: Create New Tables
```bash
pnpm db:push  # Run migrations
```

### Step 3: Implement Workers (Parallel to Current)
- Keep existing sync endpoints working
- Add new async endpoints alongside
- Gradually migrate frontend to use new endpoints

### Step 4: Deprecate Old Paths
- Mark synchronous endpoints as deprecated
- Add migration logging
- Remove after full migration

---

## Appendix

### A. OCR Engine Comparison

| Feature | Tesseract | Gemini Vision |
|---------|-----------|---------------|
| Speed | Fast (local) | Slow (API) |
| Accuracy (printed) | 90-95% | 95-99% |
| Accuracy (handwritten) | 60-70% | 85-95% |
| Cost | Free | Pay per call |
| Offline | Yes | No |
| Languages | 100+ | 100+ |

**Recommendation:** Use Tesseract as primary for printed documents (cost savings), Gemini for handwritten/complex layouts.

### B. Extraction Pattern Examples

```regex
// Pattern 1: "TestName: value unit (reference range)"
/^([A-Za-z\s\-\/()]+?):\s*([\d.]+)\s+([A-Za-z/%\-°C°F]+?)(?:\s*\(([\d.\-\s]+?)\))?$/

// Pattern 2: "TestName value unit" (no colon)
/^([A-Za-z\s\-\/()]+?)\s+([\d.]+)\s+([A-Za-z/%\-°C°F]+?)$/

// Pattern 3: Tab-separated (common in lab exports)
/^([A-Za-z\s\-\/()]+?)\t+([\d.]+)\t+([A-Za-z/%\-°C°F]+?)(?:\t+([\d.\-\s]+?))?$/
```

### C. Severity Scoring Rules

```typescript
function computeSeverity(fields: ExtractedField[]): Severity {
  const criticalTests = ['glucose', 'potassium', 'sodium', 'calcium'];
  const flaggedFields = fields.filter(f => f.flagged);
  
  // Critical value detection
  const hasCritical = flaggedFields.some(f => 
    criticalTests.includes(f.name.toLowerCase()) && 
    Math.abs(parseFloat(f.value) - getMidRange(f)) > getMidRange(f) * 0.5
  );
  
  if (hasCritical) return 'CRITICAL';
  if (flaggedFields.length >= 3) return 'HIGH';
  if (flaggedFields.length >= 1) return 'MODERATE';
  return 'LOW';
}
```

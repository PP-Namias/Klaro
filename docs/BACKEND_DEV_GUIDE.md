# Backend Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- TypeScript
- tRPC
- Prisma ORM
- PostgreSQL 14+ (or Neon for serverless)

### Project Structure
```
packages/api/
├── src/
│   ├── index.ts           # tRPC router entry
│   ├── trpc.ts            # tRPC configuration
│   ├── root.ts            # Root router definition
│   ├── routers/           # Route handlers
│   │   ├── documents.ts   # KL-DS-*, KL-OCR-*, KL-EX-*
│   │   ├── chat.ts        # KL-CHAT-*, KL-LOC-*
│   │   ├── facilities.ts  # KL-MAP-*
│   │   ├── doctors.ts     # KL-DR-*
│   │   ├── bookings.ts    # KL-BK-*
│   │   ├── payments.ts    # KL-PAY-*
│   │   ├── auth.ts        # KL-AUTH-*
│   │   └── users.ts       # User management
│   ├── middleware/        # Custom tRPC middleware
│   │   ├── auth.ts        # Auth middleware
│   │   ├── logging.ts     # Request logging
│   │   └── rateLimit.ts   # Rate limiting
│   ├── services/          # Business logic
│   │   ├── ocr.ts         # OCR & Tesseract integration
│   │   ├── llm.ts         # LLM prompts and calls
│   │   ├── extraction.ts  # Data extraction logic
│   │   ├── payment.ts     # Stripe integration
│   │   └── facilities.ts  # Facilities data & geocoding
│   └── utils/
│       ├── logger.ts      # Logging utility
│       ├── crypto.ts      # AES-256 encryption
│       └── validators.ts  # Zod schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
└── package.json
```

## Core Endpoints

### Documents Router (routers/documents.ts)
**Handles:** KL-DS-001, KL-OCR-001, KL-EX-001

```typescript
// routers/documents.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const documentsRouter = router({
  // POST /api/documents/scan - Upload and process
  scan: publicProcedure
    .input(z.object({
      file: z.instanceof(File),
      documentType: z.enum(['lab_result', 'prescription', 'discharge_summary']),
      userId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // 1. Validate file
      // 2. Extract text via Tesseract (local) + Google Vision (fallback)
      // 3. Normalize and extract structured data
      // 4. Generate plain-language summary
      // 5. Return document ID and analysis
      
      const ocrResult = await services.ocr.processImage(input.file);
      const extractedData = await services.extraction.normalize(ocrResult);
      const summary = await services.llm.generateSummary(extractedData);
      
      return {
        documentId: doc.id,
        extractedData,
        summary,
        severity: calculateSeverity(extractedData)
      };
    }),

  // GET /api/documents/[id] - Retrieve document
  get: publicProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const doc = await db.document.findUnique({
        where: { id: input.documentId }
      });
      return { ...doc, data: decrypt(doc.encryptedData) };
    })
});
```

### Chat Router (routers/chat.ts)
**Handles:** KL-CHAT-001, KL-LOC-001

```typescript
// routers/chat.ts
export const chatRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      documentId: z.string(),
      message: z.string(),
      dialect: z.enum(['fil', 'bis', 'ilo']),
      conversationId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // 1. Get document context
      const doc = await db.document.findUnique({
        where: { id: input.documentId }
      });
      
      // 2. Detect dialect from message
      const detectedDialect = await services.llm.detectDialect(input.message);
      const responseDialect = input.dialect || detectedDialect;
      
      // 3. Assemble context prompt
      const context = buildContext(doc, input.message, responseDialect);
      
      // 4. Call LLM
      const llmResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: context,
        temperature: 0.7
      });
      
      // 5. Extract follow-ups
      const followUps = parseFollowUps(llmResponse);
      
      return {
        response: llmResponse.choices[0].message.content,
        followUps,
        severity: doc.severity,
        conversationId
      };
    })
});
```

### Bookings Router (routers/bookings.ts)
**Handles:** KL-BK-001

```typescript
// routers/bookings.ts
export const bookingsRouter = router({
  create: protectedProcedure
    .input(z.object({
      doctorId: z.string(),
      documentId: z.string(),
      sessionType: z.enum(['chat', 'video', 'async_review']),
      proposedDateTime: z.string().datetime()
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Verify doctor availability
      const availability = await checkDoctorAvailability(input);
      if (!availability) throw new Error('Doctor not available');
      
      // 2. Calculate total amount
      const doctor = await db.doctor.findUnique({
        where: { id: input.doctorId }
      });
      const platformFee = Math.round(doctor.sessionPrice * 0.1);
      const totalAmount = doctor.sessionPrice + platformFee;
      
      // 3. Create booking (pending payment)
      const booking = await db.booking.create({
        data: {
          userId: ctx.user.id,
          doctorId: input.doctorId,
          documentId: input.documentId,
          sessionType: input.sessionType,
          scheduledAt: input.proposedDateTime,
          totalAmount,
          platformFee,
          status: 'pending'
        }
      });
      
      // 4. Emit event for telemetry
      await telemetry.emit('booking_created', { bookingId: booking.id });
      
      return { bookingId: booking.id, status: 'pending', totalAmount };
    }),

  // POST /api/bookings/[id]/confirm-payment
  confirmPayment: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await db.booking.update({
        where: { id: input.bookingId },
        data: { status: 'paid' }
      });
      
      // Send notification to doctor
      await notifications.sendToDoctor(booking.doctorId, {
        type: 'new_booking',
        booking
      });
      
      return { status: 'confirmed' };
    })
});
```

### Payments Router (routers/payments.ts)
**Handles:** KL-PAY-001

```typescript
// routers/payments.ts
export const paymentsRouter = router({
  createIntent: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      amount: z.number(),
      currency: z.string().default('PHP')
    }))
    .mutation(async ({ input }) => {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: input.currency.toLowerCase(),
        metadata: { bookingId: input.bookingId }
      });
      
      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id
      };
    }),

  // Stripe webhook handler
  handleWebhook: publicProcedure
    .input(z.any()) // Stripe signature verification
    .mutation(async ({ input }) => {
      const event = input as Stripe.Event;
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          const intent = event.data.object as Stripe.PaymentIntent;
          const bookingId = intent.metadata.bookingId;
          
          // Update booking status
          await db.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' }
          });
          
          // Emit payout event for accounting
          await telemetry.emit('payment_succeeded', { bookingId });
          break;
      }
      
      return { received: true };
    })
});
```

## Services (Business Logic)

### OCR Service (services/ocr.ts)
**Handles:** Tesseract integration, confidence scoring, cloud fallback

```typescript
// services/ocr.ts
import Tesseract from 'tesseract.js';

export async function processImage(file: File): Promise<OCRResult> {
  const imageData = await file.arrayBuffer();
  
  // 1. Local Tesseract OCR
  const { data: { text, confidence } } = await Tesseract.recognize(
    imageData,
    ['eng', 'fil', 'tl']  // English, Filipino, Tagalog
  );
  
  const localConfidence = confidence / 100;
  
  // 2. If confidence < threshold, use Google Vision
  if (localConfidence < 0.7) {
    const visionResult = await cloudOCR.process(file);
    return { text: visionResult.text, confidence: 0.95, source: 'google_vision' };
  }
  
  return { text, confidence: localConfidence, source: 'tesseract' };
}
```

### LLM Service (services/llm.ts)
**Handles:** Prompts, context assembly, response generation

```typescript
// services/llm.ts
export async function generateSummary(
  extractedData: ExtractedData,
  dialect: 'fil' | 'bis' | 'ilo' = 'fil'
): Promise<string> {
  const promptTemplate = DIALECT_PROMPTS[dialect];
  
  const prompt = promptTemplate
    .replace('{{tests}}', JSON.stringify(extractedData.tests))
    .replace('{{referenceRanges}}', JSON.stringify(extractedData.ranges));
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  return response.choices[0].message.content;
}
```

## Middleware

### Auth Middleware
```typescript
// middleware/auth.ts
export const protectedProcedure = baseProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.user?.id) throw new Error('Unauthorized');
    return next({ ctx });
  }
);
```

### Rate Limiting
```typescript
// middleware/rateLimit.ts
export const rateLimited = baseProcedure.use(
  async ({ ctx, next }) => {
    const key = ctx.user?.id || ctx.ip;
    const count = await redis.incr(`rate:${key}`);
    if (count > 100) throw new Error('Rate limited');
    await redis.expire(`rate:${key}`, 60);
    return next();
  }
);
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```typescript
// __tests__/documents.test.ts
describe('Documents Router', () => {
  it('should process image and return extraction', async () => {
    const result = await caller.documents.scan({
      file: testImageFile,
      documentType: 'lab_result'
    });
    
    expect(result.documentId).toBeDefined();
    expect(result.extractedData.tests).toHaveLength(expect.any(Number));
  });
});
```

## Performance Considerations

- Cache LLM responses for same documents
- Batch OCR processing for multiple files
- Use connection pooling for database
- Implement request deduplication
- Add observability/telemetry middleware

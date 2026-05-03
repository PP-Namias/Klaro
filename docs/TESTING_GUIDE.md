# Testing Strategy & Quality Assurance

## Test Pyramid

```
        ╱╲        E2E (10%)
       ╱  ╲       Playwright, few critical flows
      ╱────╲
     ╱      ╲     Integration (30%)
    ╱        ╲    Router tests, database fixtures
   ╱──────────╲
  ╱            ╲  Unit (60%)
 ╱──────────────╲ Jest, individual functions
```

## Unit Tests (60%)

### Testing Router Handlers

```typescript
// __tests__/routers/documents.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createCaller } from '../trpc/context';

describe('Documents Router', () => {
  let caller;
  let testDocId;

  beforeEach(async () => {
    caller = await createCaller({ user: { id: 'test-user' } });
    // Create test document
    testDocId = 'doc-123';
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should extract test results from lab image', async () => {
    const mockFile = new File(['test'], 'lab.jpg', { type: 'image/jpeg' });
    
    const result = await caller.documents.scan({
      file: mockFile,
      documentType: 'lab_result'
    });

    expect(result.documentId).toBeDefined();
    expect(result.extractedData).toHaveProperty('tests');
    expect(result.extractedData.tests.length).toBeGreaterThan(0);
  });

  it('should generate plain-language summary', async () => {
    const result = await caller.documents.get({
      documentId: testDocId
    });

    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(50);
    // Should be simple enough for average reader
    expect(result.summary.split(' ').length).toBeLessThan(150);
  });
});
```

### Testing Services

```typescript
// __tests__/services/ocr.test.ts
import { processImage } from '../../src/services/ocr';

describe('OCR Service', () => {
  it('should extract text with confidence score', async () => {
    const mockImage = new File(['test'], 'doc.jpg');
    
    const result = await processImage(mockImage);
    
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should fallback to Google Vision if confidence low', async () => {
    const mockBlurryImage = new File(['blurry'], 'blurry.jpg');
    
    const result = await processImage(mockBlurryImage);
    
    // High confidence indicates Google Vision was used
    expect(result.confidence).toBeGreaterThan(0.85);
    expect(result.source).toMatch(/tesseract|google_vision/);
  });
});
```

### Utility Functions

```typescript
// __tests__/utils/crypto.test.ts
import { encryptData, decryptData } from '../../src/utils/crypto';

describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const plaintext = JSON.stringify({
      tests: [{ name: 'glucose', value: 100 }]
    });

    const { iv, data, tag } = await encryptData(plaintext);
    const decrypted = await decryptData(data, iv, tag);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail with wrong tag', async () => {
    const { iv, data } = await encryptData('test');
    const wrongTag = Buffer.from('wrong').toString('base64');

    expect(() => decryptData(data, iv, wrongTag)).toThrow();
  });
});
```

## Integration Tests (30%)

### Database Integration

```typescript
// __tests__/integration/documents.integration.test.ts
import { db } from '../../src/db/client';
import { documentsRouter } from '../../src/routers/documents';

describe('Documents Router - Integration', () => {
  let userId: string;

  beforeAll(async () => {
    userId = await db.user.create({
      data: { email: 'test@example.com', password: 'hash' }
    }).then(u => u.id);
  });

  afterAll(async () => {
    await db.document.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });
  });

  it('should create, read, and delete document', async () => {
    // Create
    const doc = await db.document.create({
      data: {
        userId,
        type: 'lab_result',
        fileName: 'test.jpg',
        fileSize: 1024,
        encryptedData: 'encrypted',
        encryptionIV: 'iv'
      }
    });

    // Read
    const fetched = await db.document.findUnique({
      where: { id: doc.id }
    });
    expect(fetched.fileName).toBe('test.jpg');

    // Delete
    await db.document.delete({ where: { id: doc.id } });
    const deleted = await db.document.findUnique({
      where: { id: doc.id }
    });
    expect(deleted).toBeNull();
  });
});
```

### API Integration

```typescript
// __tests__/integration/payments.integration.test.ts
import Stripe from 'stripe';

describe('Payments - Stripe Integration', () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  it('should create payment intent', async () => {
    const intent = await stripe.paymentIntents.create({
      amount: 50000, // PHP 500
      currency: 'php'
    });

    expect(intent.status).toBe('requires_payment_method');
    expect(intent.amount).toBe(50000);
  });

  it('should handle webhook signature', async () => {
    const event = {
      id: 'evt_test',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test',
          metadata: { bookingId: 'bk-123' }
        }
      }
    };

    // Webhook handler should update booking
    const result = await handleStripeEvent(event);
    expect(result.bookingStatus).toBe('confirmed');
  });
});
```

## E2E Tests (10%)

### Critical User Flows (Playwright)

```typescript
// e2e/flows/document-upload.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Document Upload Flow', () => {
  test('should upload PDF and see analysis', async ({ page }) => {
    // Navigate
    await page.goto('http://localhost:3000/upload');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/lab-result.pdf');

    // Wait for processing
    await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 10000 });

    // Verify results
    const summary = page.locator('[data-testid="summary"]');
    await expect(summary).toContainText('blood work');
  });

  test('should generate chat suggestions', async ({ page }) => {
    // After upload, verify chat suggestions
    const suggestions = page.locator('[data-testid="tanong-card"]');
    const count = await suggestions.count();

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
  });
});
```

```typescript
// e2e/flows/booking.e2e.ts
import { test, expect } from '@playwright/test';

test('should complete booking flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Login")');

  // Browse doctors
  await page.goto('http://localhost:3000/doctors');
  await page.click('[data-testid="doctor-card"]:first-child');

  // Book appointment
  await page.click('button:has-text("Book")');
  await page.fill('input[name="dateTime"]', '2024-02-15T10:00');
  await page.click('button:has-text("Next")');

  // Payment
  await page.waitForSelector('iframe[name*="stripe"]');
  const frameHandle = await page.$('iframe[name*="stripe"]');
  const frame = await frameHandle.contentFrame();
  await frame.fill('[name="cardnumber"]', '4242424242424242');

  // Confirm
  await page.click('button:has-text("Pay")');
  await page.waitForURL(/confirmation/, { timeout: 5000 });

  // Verify booking
  const confirmation = page.locator('[data-testid="booking-id"]');
  await expect(confirmation).toContainText('BK-');
});
```

## Test Data Management

### Fixtures

```typescript
// __tests__/fixtures/users.ts
export const fixtures = {
  users: {
    basic: {
      email: 'basic@test.com',
      password: 'testpass',
      name: 'Basic User'
    },
    doctor: {
      email: 'doctor@test.com',
      password: 'docpass',
      specialty: ['General Medicine']
    }
  },
  documents: {
    labResult: {
      type: 'lab_result',
      fileName: 'lab.pdf',
      encryptedData: 'mock-encrypted'
    }
  }
};
```

## Running Tests

### Unit Tests
```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
# Target: >= 80% coverage
```

### Integration Tests
```bash
# Requires database
npm run test:integration

# Specific suite
npm run test -- documents.integration
```

### E2E Tests
```bash
# Start server first
npm run dev

# Run E2E tests
npm run test:e2e

# Debug mode
npm run test:e2e -- --debug

# Specific test
npm run test:e2e -- document-upload.e2e
```

## Performance Benchmarks

| Metric | Target | Tool |
|--------|--------|------|
| OCR latency | <5s | Lighthouse |
| API response | <200ms | k6 load testing |
| Chat response | <3s | Datadog APM |
| Mobile startup | <3s | Expo Performance |

## CI/CD Test Automation

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run dev &
      - run: npm run test:e2e
```

## Quality Gates

- ✅ Unit test coverage >= 80%
- ✅ Integration tests passing
- ✅ E2E critical flows passing
- ✅ No linting errors
- ✅ TypeScript strict mode
- ✅ Performance under benchmark
- ✅ Security scan passed

Tests must pass before merging to `main`.

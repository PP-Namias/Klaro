# Database Schema Guide

## Overview
Klaro uses PostgreSQL with Prisma ORM for type-safe database access. The schema supports encrypted document storage, user authentication, doctor management, and booking lifecycle.

## Schema Definition

### Users (Authentication & Profiles)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed via bcrypt
  name          String?
  avatarUrl     String?
  
  // Preferences
  acceptHistory Boolean   @default(false)
  preferredDialect String @default("fil")
  
  // Relations
  documents     Document[]
  conversations Conversation[]
  bookings      Booking[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Related Ticket:** KL-AUTH-002

### Documents (Medical Records)
```prisma
model Document {
  id            String    @id @default(cuid())
  userId        String?   @db.VarChar(255)  // Nullable for guest uploads
  
  // Document metadata
  type          String    // lab_result, prescription, discharge_summary
  fileName      String
  fileSize      Int       // Bytes
  uploadedAt    DateTime  @default(now())
  
  // Encrypted storage (AES-256)
  encryptedData String    // JSONB: serialized extracted data
  encryptionIV  String    // Initialization vector (base64)
  
  // Analysis results
  summary       String?   // Plain-language explanation
  severity      String?   // low, moderate, high
  flaggedTests  Json?     // Array of flagged values
  
  // Relations
  user          User?     @relation(fields: [userId], references: [id])
  analyses      Analysis[]
  bookings      Booking[]
  shareLink     ShareLink?
  
  @@index([userId])
  @@index([createdAt])
}
```

**Related Tickets:** KL-DS-001, KL-DS-002, KL-OCR-001, KL-EX-001

### Analysis (OCR & Extraction Results)
```prisma
model Analysis {
  id            String    @id @default(cuid())
  documentId    String
  
  // Extraction pipeline results
  ocrSource     String    // tesseract, google_vision
  ocrConfidence Float     // 0.0-1.0
  
  // Extracted structured data
  tests         Json      // Array of: { name, value, unit, referenceRange, flag }
  canonicalMapping Json   // Normalized test names
  
  // LLM generation
  plainLanguageText String
  dialectUsed   String    // fil, bis, ilo
  
  // Generated Q&A
  tanongQuestions String[] // Array of suggested doctor questions
  
  // Timing
  processingTimeMs Int
  
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  @@index([documentId])
}
```

**Related Tickets:** KL-OCR-001, KL-EX-001, KL-LLM-001

### Doctors (Healthcare Professionals)
```prisma
model Doctor {
  id            String    @id @default(cuid())
  
  // Basic info
  firstName     String
  lastName      String
  email         String    @unique
  phone         String
  avatarUrl     String?
  bio           String?
  
  // Professional details
  specialty     String[]  // Array: ["General Medicine", "Cardiology"]
  prcLicense    String    @unique  // PRC license number
  prcVerified   Boolean   @default(false)
  prcVerificationDate DateTime?
  
  // Pricing & availability
  sessionPrice  Int       // PHP cents
  sessionTypes  String[]  // ["chat", "video", "async_review"]
  timezone      String    @default("Asia/Manila")
  
  // Availability (JSON array of working hours per day)
  availability  Json      // { mon: "08:00-20:00", tue: "08:00-20:00", ... }
  
  // Ratings
  rating        Float?    @default(0)
  reviewCount   Int       @default(0)
  
  // Relations
  bookings      Booking[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([specialty])
  @@index([prcVerified])
}
```

**Related Ticket:** KL-DR-001

### Bookings (Appointments)
```prisma
model Booking {
  id            String    @id @default(cuid())
  
  // Relationships
  userId        String
  doctorId      String
  documentId    String
  
  // Booking details
  sessionType   String    // chat, video, async_review
  scheduledAt   DateTime
  status        String    @default("pending")  // pending, paid, confirmed, completed, cancelled
  
  // Payment
  totalAmount   Int       // PHP cents
  platformFee   Int       // PHP cents (10% of doctor rate)
  paymentStatus String?   // pending, succeeded, failed
  stripePaymentIntentId String?
  
  // Medical context
  chiefComplaint String?
  followUpNotes  String?
  
  // Relations
  user          User      @relation(fields: [userId], references: [id])
  doctor        Doctor    @relation(fields: [doctorId], references: [id])
  document      Document  @relation(fields: [documentId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([doctorId])
  @@index([status])
  @@index([scheduledAt])
}
```

**Related Tickets:** KL-BK-001, KL-PAY-001

### Conversations (Chat History)
```prisma
model Conversation {
  id            String    @id @default(cuid())
  userId        String
  documentId    String?
  
  // Metadata
  dialect       String    @default("fil")
  context       String?   // Stored context for retrieval
  
  // Messages (stored as JSON array for denormalization)
  messages      Json      // Array of: { role, content, timestamp, confidence }
  
  // Relations
  user          User      @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([documentId])
}
```

**Related Ticket:** KL-CHAT-001

### Facilities (Clinics & Hospitals)
```prisma
model Facility {
  id            String    @id @default(cuid())
  
  // Identification
  name          String
  type          String    // clinic, hospital, diagnostic_center
  dohCode       String?   // Department of Health code
  
  // Location
  address       String
  latitude      Float
  longitude     Float
  
  // Services
  specialties   String[]  // Array of services offered
  philHealthAccredited Boolean @default(false)
  
  // Operations
  phone         String?
  operatingHours Json     // { mon: "08:00-20:00", tue: "08:00-20:00", ... }
  
  // Metadata
  lastUpdated   DateTime  @updatedAt
  source        String    // doh, google_places, manual
  
  createdAt DateTime @default(now())
  
  @@index([latitude, longitude])
  @@index([philHealthAccredited])
  @@fulltext([name, address])  // Full-text search support
}
```

**Related Ticket:** KL-MAP-001

### Share Links (Guest Sharing)
```prisma
model ShareLink {
  id            String    @id @default(cuid())
  documentId    String    @unique
  
  // Security
  token         String    @unique @db.VarChar(255)
  expiresAt     DateTime
  
  // Access tracking
  accessCount   Int       @default(0)
  lastAccessedAt DateTime?
  
  document      Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([expiresAt])
}
```

**Related Ticket:** KL-AUTH-001

## Migrations

### Creating Migrations
```bash
# After schema changes
npx prisma migrate dev --name descriptive_name

# Example
npx prisma migrate dev --name add_doctor_prc_verification
```

### Migration History
```bash
# View all migrations
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset
```

## Indexes & Performance

- **User queries:** Index on `email`, `id`
- **Document lookups:** Compound index on `(userId, createdAt)`
- **Facility search:** GiST index on `(latitude, longitude)` for geo queries
- **Full-text search:** TSVECTOR index on facility names and descriptions

## Encryption at Rest

### Document Data Encryption
- **Algorithm:** AES-256-GCM
- **Key:** 32-byte random key (stored in environment variable)
- **IV:** 16-byte random IV (stored with encrypted data in DB)
- **When:** Before storing in `Document.encryptedData`
- **Decryption:** On authorized requests only (via middleware)

```typescript
// Encryption example
import crypto from 'crypto';

const key = Buffer.from(process.env.AES_256_KEY, 'base64');
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

await db.document.create({
  data: {
    encryptedData: encrypted,
    encryptionIV: iv.toString('base64')
  }
});
```

**Related Ticket:** KL-SEC-001

## Backup & Recovery

### Automated Backups (Production)
- Daily full backups to S3-compatible storage
- Point-in-time recovery: 30-day window
- Test restoration weekly

### Local Development Backups
```bash
# Export schema and sample data
pg_dump klaro_dev > backup.sql

# Restore
psql klaro_dev < backup.sql
```

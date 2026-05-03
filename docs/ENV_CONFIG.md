# Environment Configuration Template

## Required Environment Variables

### Backend (packages/api/)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/klaro_dev

# LLM Provider
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo

# OCR & Vision
GOOGLE_VISION_API_KEY=...
TESSERACT_LANGUAGE_PATH=./tessdata

# Maps
GOOGLE_MAPS_API_KEY=...

# Payments - Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Session/JWT
JWT_SECRET=...
JWT_EXPIRY=7d

# File Storage
S3_BUCKET_NAME=klaro-dev-documents
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Security
AES_256_KEY=... (base64 encoded 32 bytes)
ENCRYPTION_IV_SIZE=16

# Analytics & Telemetry
ANALYTICS_PROVIDER=posthog
POSTHOG_API_KEY=...

# Feature Flags
FEATURE_SHARE_LINKS=true
FEATURE_DOCTOR_BOOKING=true
FEATURE_PAYMENTS=true
```

### Frontend - Web (apps/nextjs/)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_ENDPOINT=/trpc

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Auth
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_SECRET=... (optional, usually in backend)
```

### Mobile (apps/expo/)
```env
# API
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_API_ENDPOINT=/trpc

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_PLACES_API_KEY=...

# Payments
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Feature Flags
EXPO_PUBLIC_FEATURE_CAMERA_CAPTURE=true
EXPO_PUBLIC_FEATURE_CHAT=true
```

## Local Development Setup

### 1. Database
```bash
# Copy .env.local template
cp .env.example .env.local

# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/klaro_dev

# Run migrations
npx prisma migrate dev --name init
```

### 2. Backend Services
```bash
# Start backend in development
cd packages/api
npm run dev  # runs on :3001
```

### 3. Frontend (Web)
```bash
# Start Next.js dev server
cd apps/nextjs
npm run dev  # runs on :3000
```

### 4. Mobile (Expo)
```bash
# Start Expo dev server
cd apps/expo
npm run start  # runs on :19000
```

## Demo & Testing Credentials

### Demo Doctor Account
```
Email: doctor@demo.klaro.local
PRC License: 123456-TEST
Specialty: General Medicine
Hourly Rate: ₱500
```

### Demo User Accounts
```
Guest: No credentials needed (automatic session)
Registered: Use email + password via NextAuth
Test Email: test@klaro.local
Test Password: klaro-demo-2026
```

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

## Security Checklist

- [ ] No API keys committed to repo
- [ ] .env.local in .gitignore
- [ ] Database backups automated
- [ ] HTTPS enforced in production
- [ ] CORS configured per environment
- [ ] Rate limiting on public endpoints
- [ ] PII encrypted at rest
- [ ] Share link tokens rotated regularly

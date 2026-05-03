# Klaro Development Quick Reference

## Project Status: MVP Platform (5-Day Build)

### Core Feature Set ✅
1. **Document Scan & Analysis** - OCR + plain-language explanations
2. **AI Chatbot** - Context-aware chat with Filipino dialect support
3. **Facilities Map** - Nearby clinics/hospitals with PhilHealth filter
4. **Doctor Booking** - Browse, book, pay for consultations
5. **In-App Payments** - Stripe (demo), GCash/Maya placeholders
6. **User Accounts** - Guest + registered modes with history opt-in

### Tech Stack

| Component | Technology | Location |
|-----------|-----------|----------|
| **Mobile** | Expo / React Native | `apps/expo/` |
| **Web** | Next.js 14 / React | `apps/nextjs/` |
| **Backend** | Node.js / tRPC | `packages/api/` |
| **Database** | Prisma / PostgreSQL | `packages/db/` |
| **UI Library** | Shadcn/ui / Tailwind | `packages/ui/` |
| **Auth** | NextAuth / Clerk | `packages/auth/` |

### Key Tickets (KL- Prefixed)

#### Mobile & Web Upload
- `KL-DS-001` - Mobile camera capture with preprocessing
- `KL-DS-002` - Web file & PDF upload

#### ML/NLP Processing
- `KL-OCR-001` - OCR engine (Tesseract + Google Vision)
- `KL-EX-001` - Extraction & normalization (rules + LLM)
- `KL-LLM-001` - LLM templates for plain language

#### Chat & Localization
- `KL-CHAT-001` - Chat API with context assembly
- `KL-LOC-001` - Dialect detection & simplify action

#### Maps & Facilities
- `KL-MAP-001` - DOH data ingest & geocoding
- `KL-MAP-002` - Map UI (mobile + web)

#### Doctors & Booking
- `KL-DR-001` - Doctor profiles & CRUD
- `KL-BK-001` - Booking flow & status management

#### Payments
- `KL-PAY-001` - Stripe integration
- `KL-PAY-002` - GCash/Maya placeholders

#### Auth & User
- `KL-AUTH-001` - Guest uploads & share links
- `KL-AUTH-002` - Registered users & history

#### Platform
- `KL-SEC-001` - Encryption & secrets
- `KL-OBS-001` - Telemetry & monitoring
- `KL-CI-001` - CI/CD & test automation
- `KL-DEV-001` - Developer experience

### Getting Started (5-minute setup)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp docs/ENV_CONFIG.md .env.local
# Fill in required API keys

# 3. Run database migrations
npm run db:migrate

# 4. Start all services
npm run dev

# Services will be available at:
# - Backend:     http://localhost:3001
# - Web:         http://localhost:3000
# - Mobile:      Expo dev server
```

### Development Workflow

**Feature branch convention:**
```bash
git checkout -b ticket/KL-DS-001-mobile-camera-capture
# Make changes
git add .
git commit -m "Implement mobile camera capture with preprocessing"
git push origin ticket/KL-DS-001-mobile-camera-capture
# Create PR
```

**Commit messages (plain, no prefixes):**
```
Implement mobile camera capture with preprocessing

- Add Expo camera integration
- Implement edge detection and auto-crop
- Add local deskew/denoise preprocessing
- Connect to /api/documents/scan endpoint
- Add resumable upload support
```

### Testing Checklist

- [ ] Mobile camera capture: accuracy >=90%
- [ ] Web upload: handles PNG/JPG/PDF
- [ ] OCR: extracts >=90% key-value pairs
- [ ] Chat: responds within 5s
- [ ] Dialect detection: >=85% accuracy
- [ ] Map: renders 100+ pins without lag
- [ ] Booking: payment confirmed after webhook
- [ ] Share link: expires after 30 days

### Common Commands

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Build production
npm run build

# Deploy
npm run deploy

# Check database
npm run db:studio

# View API docs
npm run api:docs

# Mobile dev
npm run mobile:start
npm run mobile:ios
npm run mobile:android

# Web dev
npm run web:dev
npm run web:build
```

### Documentation Map

| Document | Purpose | For |
|----------|---------|-----|
| `IMPLEMENTATION_GUIDE.md` | Architecture & phases | Everyone |
| `ENV_CONFIG.md` | Environment setup | DevOps/Backend |
| `API_REFERENCE.md` | Endpoint documentation | Backend/Mobile/Web |
| `MOBILE_DEV_GUIDE.md` | Mobile implementation | Mobile engineers |
| `WEB_DEV_GUIDE.md` | Web implementation | Web engineers |
| `BACKEND_DEV_GUIDE.md` | Backend architecture | Backend engineers |
| `DATABASE_GUIDE.md` | Schema & migrations | Backend/DevOps |

### Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables set (production)
- [ ] Database migrations applied
- [ ] API keys rotated
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Monitoring alerts set
- [ ] Backup strategy verified

### AI Agent Prompts

Use these tickets with an AI agent for faster implementation:

```
# For mobile development:
"Implement KL-DS-001: Mobile camera capture with preprocessing using Expo Camera. 
Include edge detection, auto-crop (>=90% accuracy), and resumable upload to /api/documents/scan."

# For LLM integration:
"Build KL-LLM-001: Plain-language templates for medical test explanations in Tagalog/Bisaya/Ilocano. 
Include severity indicators and generate Tanong Mo Sa Doktor cards with 3+ suggested questions."

# For payment processing:
"Implement KL-PAY-001: Stripe PaymentIntent flow with webhook idempotency. 
Update booking status and emit payout events for accounting."
```

### Support & Troubleshooting

**Common Issues:**

1. **API timeout:**
   - Check `NEXT_PUBLIC_API_URL` in frontend .env
   - Verify backend running: `http://localhost:3001/trpc`

2. **OCR low confidence:**
   - Ensure image is clear and well-lit
   - Check language pack: English + Filipino available
   - Review confidence threshold in `KL-OCR-001`

3. **Chat not responding in correct dialect:**
   - Verify dialect detection in `KL-LOC-001`
   - Check LLM prompt templates in `KL-LLM-001`
   - Test with native speaker

4. **Map pins not rendering:**
   - Check Google Maps API key
   - Verify facilities data was ingested (`KL-MAP-001`)
   - Check browser console for errors

### Next Steps After MVP

- Trend tracking across results
- Family/caregiver mode
- Medication reminders
- Second opinion feature
- Doctor ratings & reviews
- PhilHealth coverage checker

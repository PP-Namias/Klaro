# Klaro Documentation

Complete technical documentation for the Klaro medical document analysis platform. This directory contains guides for developers, DevOps engineers, and product managers.

## Quick Navigation

### For New Developers
1. Start with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Project status, tech stack, and getting started in 5 minutes
2. Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Architecture overview and three development phases
3. Pick your role:
   - **Mobile:** [MOBILE_DEV_GUIDE.md](./MOBILE_DEV_GUIDE.md)
   - **Web:** [WEB_DEV_GUIDE.md](./WEB_DEV_GUIDE.md)
   - **Backend:** [BACKEND_DEV_GUIDE.md](./BACKEND_DEV_GUIDE.md)

### For DevOps/Infrastructure
1. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deploy to Vercel, Railway, Docker
2. [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Prisma schema, migrations, backups
3. [MONITORING.md](./MONITORING.md) - Metrics, logging, alerts, on-call runbooks
4. [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - Encryption, secrets, compliance

### For Quality Assurance/Testing
1. [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Unit, integration, E2E test strategies
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#testing-checklist) - Testing checklist
3. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#cicd-pipeline) - CI/CD automation

### When Something Breaks
1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
2. [MONITORING.md](./MONITORING.md#incident-response) - On-call runbook
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#supporttroubleshooting) - Support contacts

## Documentation Files

| File | Purpose | Audience | Length |
|------|---------|----------|--------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | 5-minute project overview, getting started, common commands | Everyone | 3 min |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Architecture, tech stack, 3-phase timeline, 23 tickets | Product, Engineering | 5 min |
| [ENV_CONFIG.md](./ENV_CONFIG.md) | Environment variables, demo credentials, setup steps | Backend, DevOps | 5 min |
| [API_REFERENCE.md](./API_REFERENCE.md) | All tRPC endpoints with request/response examples | Backend, Mobile, Web | 10 min |
| [MOBILE_DEV_GUIDE.md](./MOBILE_DEV_GUIDE.md) | Expo project structure, 5 key screens with code | Mobile Engineers | 15 min |
| [WEB_DEV_GUIDE.md](./WEB_DEV_GUIDE.md) | Next.js app structure, 5 key pages with code | Web Engineers | 15 min |
| [BACKEND_DEV_GUIDE.md](./BACKEND_DEV_GUIDE.md) | tRPC routers, services, middleware patterns | Backend Engineers | 15 min |
| [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) | Prisma schema, encryption, migrations, backups | Backend, DevOps | 15 min |
| [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) | AES-256 encryption, NextAuth, webhooks, compliance | Backend, DevOps | 20 min |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deploy to Vercel/Railway, Docker, CI/CD pipeline | DevOps, Backend | 20 min |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Unit/integration/E2E tests, test pyramid, CI/CD | QA, Backend, Frontend | 20 min |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues with solutions, debugging steps | Everyone | 20 min |
| [MONITORING.md](./MONITORING.md) | Logging, metrics, alerts, on-call runbook, SLAs | DevOps, Backend | 20 min |

**Total documentation:** ~135 pages / 3+ hours of reading (pick relevant sections)

## Project Structure

```
Klaro (Monorepo)
├── apps/
│   ├── expo/              # Mobile app (React Native + Tailwind)
│   ├── nextjs/            # Web app (Next.js 14 + App Router)
│   └── tanstack-start/    # Backup web framework (optional)
├── packages/
│   ├── api/               # Backend tRPC server
│   ├── db/                # Prisma ORM & migrations
│   ├── auth/              # Authentication logic
│   ├── ui/                # Shadcn/ui components
│   └── validators/        # Zod schemas
├── tooling/
│   ├── eslint/            # ESLint configs
│   ├── tailwind/          # Tailwind CSS config
│   └── typescript/        # TypeScript base configs
└── docs/                  # This documentation
```

## Tech Stack at a Glance

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | Expo / React Native | 51+ |
| Web | Next.js / React | 14+ / 18+ |
| Backend | Node.js / Express | 18+ |
| API | tRPC | 11+ |
| Database | PostgreSQL / Prisma | 15 / 5+ |
| Auth | NextAuth.js | 4+ |
| UI | Shadcn/ui / Tailwind CSS | - / 3+ |
| Payments | Stripe | v1 |
| LLM | OpenAI | GPT-4 Turbo |
| OCR | Tesseract.js + Google Vision | 5+ |
| Deployment | Vercel, Railway, Docker | - |
| CI/CD | GitHub Actions | - |
| Monitoring | Datadog, Sentry | - |

## Key Features (23 Tickets)

✅ **Document Scan & Analysis**
- Mobile camera capture with edge detection
- Web file/PDF upload
- Tesseract OCR + Google Vision fallback
- Structured data extraction
- Plain-language explanations in 3 dialects

✅ **AI Chatbot**
- Context-aware Q&A based on documents
- Dialect detection (Tagalog/Bisaya/Ilocano)
- Plain-language simplification
- Doctor question suggestions

✅ **Doctor Booking**
- Doctor directory with filtering
- Real-time availability
- Session types (chat/video/async)
- Stripe payment integration

✅ **Facilities Finder**
- Map view of nearby clinics/hospitals
- PhilHealth accreditation filter
- Operating hours & contact info

✅ **User Accounts**
- Guest document upload & sharing
- Registered user history
- Preference management

## Development Phases

### Phase 1: MVP (5 days, 15 tickets)
- Scan & upload documents
- Basic chat interface
- Browse doctors & book
- Mobile-first design
- Guest + registered auth

### Phase 2: Integration (2 weeks, 5 tickets)
- Payment processing
- Real-time chat notifications
- Advanced analytics
- Facilities expansion
- API optimization

### Phase 3: Polish (1 week, 3 tickets)
- Performance optimization
- Accessibility improvements
- Security hardening
- Documentation & DX

## Getting Started

### Clone & Setup (5 minutes)
```bash
# Clone repository
git clone https://github.com/klaro-ph/klaro.git
cd klaro

# Install dependencies
npm install

# Configure environment
cp docs/ENV_CONFIG.md .env.local
# Fill in required API keys

# Run all services
npm run dev

# Open in browser
# Web: http://localhost:3000
# API: http://localhost:3001
# Mobile: Expo app running locally
```

### Create a Ticket
```bash
# 1. Pick a KL-* ticket from QUICK_REFERENCE.md
# 2. Create feature branch
git checkout -b ticket/KL-DS-001-camera-capture

# 3. Implement feature using guide (MOBILE_DEV_GUIDE.md, etc)
# 4. Add tests (see TESTING_GUIDE.md)
# 5. Commit with plain message
git commit -m "Implement mobile camera capture with edge detection"

# 6. Push and create PR
git push origin ticket/KL-DS-001-camera-capture
```

## Important Concepts

### Document Encryption (KL-SEC-001)
- **At Rest:** AES-256-GCM encryption
- **In Transit:** TLS 1.3+
- **Key:** 32-byte key stored in environment, rotated annually
- **When:** Before storing extracted data in database

### Dialect Support (KL-LOC-001)
- **Tagalog (fil)** - Primary, auto-detected
- **Bisaya (bis)** - Secondary, common in Visayas
- **Ilocano (ilo)** - Tertiary, spoken in north
- **Implementation:** LLM templates + dialect detection model

### Medical Data Handling (HIPAA-like)
- **Consent:** "Accept History" checkbox for data retention
- **Audit Trail:** All PHI access logged with timestamp/IP
- **Retention:** 90-day default, user can delete anytime
- **Backup:** Daily automated, 30-day retention

### Payment Flow (KL-PAY-001)
1. User selects doctor & time
2. System calculates total (doctor rate + 10% platform fee)
3. Stripe PaymentIntent created
4. User enters card details in iframe
5. Webhook confirms payment
6. Booking status changed to "confirmed"
7. Doctor notified, appointment locked

## Common Patterns

### Creating a New API Endpoint
```typescript
// Step 1: Define schema in packages/validators
export const scanDocumentSchema = z.object({
  file: z.instanceof(File),
  documentType: z.enum(['lab_result', 'prescription'])
});

// Step 2: Create router procedure in packages/api
export const documentsRouter = router({
  scan: publicProcedure
    .input(scanDocumentSchema)
    .mutation(async ({ input }) => {
      // Process...
      return result;
    })
});

// Step 3: Call from web/mobile in trpc client
const result = await trpc.documents.scan.mutate({
  file: selectedFile,
  documentType: 'lab_result'
});
```

### Adding Environment Variable
1. Add to `ENV_CONFIG.md` template
2. Add to `.env.local` locally
3. Add to platform (Vercel/Railway) secrets
4. Access in code: `process.env.VARIABLE_NAME`

### Running Tests Locally
```bash
npm run test                    # Run all unit tests
npm run test:watch            # Watch mode for development
npm run test:coverage         # Check coverage (target: 80%)
npm run test:integration      # Integration tests (requires DB)
npm run test:e2e              # End-to-end tests (requires running server)
```

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Secrets rotated
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Monitoring alerts set
- [ ] Backup strategy verified
- [ ] Security scan passed
- [ ] Performance under benchmark

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed steps.

## Support & Questions

### Resources
- **Code samples:** Check implementation guides (MOBILE_DEV_GUIDE.md, etc)
- **Endpoints:** See API_REFERENCE.md
- **Issues:** Start with TROUBLESHOOTING.md
- **Architecture:** See IMPLEMENTATION_GUIDE.md

### Getting Help
1. Search documentation (Ctrl+F)
2. Check TROUBLESHOOTING.md for your error
3. Review relevant implementation guide
4. Ask in #engineering channel on Slack
5. Open issue with logs and error message

## Contributing

### Documentation
- Add new guide to this directory
- Update this README with entry
- Include table of contents
- Use 2-3 code examples per section

### Code
- Follow patterns in implementation guides
- Include tests (TESTING_GUIDE.md)
- Use plain commit messages (no feat/chore prefixes)
- Reference KL-* ticket in branch name

## License
See LICENSE file in repository root

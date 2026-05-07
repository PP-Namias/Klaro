# Klaro

Klaro is an AI-assisted Filipino health companion application that helps users understand medical documents, ask follow-up questions in local dialects, find nearby care facilities, and book free consultations with licensed healthcare providers.

## Overview

Klaro addresses healthcare accessibility challenges by providing:
- Intelligent document analysis for medical records
- Multilingual conversational support in Filipino dialects
- Proximity-based care facility discovery
- Integrated provider network with free consultation booking
- Direct connection with healthcare professionals at no cost

## Core Features

### Document Scan and Analysis

- Multiple upload methods: photo, document scanner, or PDF
- Comprehensive analysis of lab results, prescriptions, and discharge summaries
- Simplified patient-friendly explanations of medical data
- Automatic severity assessment for flagged laboratory values
- Generated talking points for doctor consultations

### AI Health Chatbot

- Context-aware conversations about scanned medical documents
- Extended dialogue with natural follow-up questions
- General health information beyond document scope
- Support for Filipino dialects: Filipino (Tagalog), Bisaya, Ilocano
- On-demand complexity adjustment for explanations
- Responsive language matching to user input

### Healthcare Facility Discovery

- Geolocation-based clinic and hospital search
- Multi-criteria filtering: PhilHealth accreditation status, operating hours, specialty type
- Integrated data from DOH public facility database and Google Maps API
- Real-time availability information

### Doctor Consultation Platform

- Directory of licensed Filipino medical professionals
- Free consultation booking with healthcare providers
- Multiple session formats: chat consultations, video consultations, asynchronous document reviews
- Automatic document sharing with assigned healthcare provider
- Post-consultation services: digital prescriptions and referrals
- PRC license verification during provider onboarding

### User Accounts

| Account Type | Features |
|---|---|
| Guest | Document analysis and scanning, shareable private link (30-day expiry), no persistent history |
| Registered | Full guest features plus document history, saved analyses, personalized AI context, free consultation booking |

## Planned Enhancements

Future considerations include:
- Health trend tracking across multiple analyses
- Family and caregiver management with sub-profiles
- Simplified output modes for elderly users
- Technical versus simplified information toggle
- Medication tracking and reminder system
- PhilHealth coverage verification
- Push notification system
- Second opinion consultation mode
- Provider ratings and review system

## Architecture

Klaro is built as a full-stack monorepo using pnpm and Turborepo:

```
apps/
  expo/              Mobile application for iOS and Android
  nextjs/            Web application and API gateway
  tanstack-start/    Alternative web application framework

packages/
  api/               tRPC router definitions
  auth/              Authentication system (Better Auth)
  db/                Database schema and ORM (Drizzle)
  ui/                Shared component library
  validators/        Shared validation schemas
```

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- pnpm package manager
- Database instance (configured via environment variables)

### Installation

Install all dependencies:

```bash
pnpm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values for database, authentication, and third-party services.

### Database Setup

Generate authentication schema:

```bash
pnpm auth:generate
```

Push database schema to your database instance:

```bash
pnpm db:push
```

### Development

Start all development servers:

```bash
pnpm dev
```

This will start:
- Web application at http://localhost:3000
- Mobile app development server
- API server with live reloading
- Additional services as configured

### Build for Production

Build all applications and packages:

```bash
pnpm build
```

## Project Scope

Klaro is designed as a comprehensive 5-day development sprint. Each feature includes clear demonstration moments and avoids speculative implementation.

## Documentation

Comprehensive documentation is available in the `docs/` directory:
- `API_REFERENCE.md` - API endpoint documentation
- `BACKEND_DEV_GUIDE.md` - Backend development guidelines
- `MOBILE_DEV_GUIDE.md` - Mobile application development
- `WEB_DEV_GUIDE.md` - Web application development
- `DATABASE_GUIDE.md` - Database schema and ORM usage
- `SECURITY_GUIDE.md` - Security best practices
- `DEPLOYMENT_GUIDE.md` - Production deployment steps

## Contributing

Development workflow:
1. Create a feature branch from main
2. Make changes following the project conventions
3. Ensure all tests pass: `pnpm test`
4. Submit pull request with clear description

## Technology Stack

- Frontend: Next.js, React, Expo, TailwindCSS, NativeWind
- Backend: Node.js, tRPC, Better Auth
- Database: PostgreSQL with Drizzle ORM
- Mobile: Expo and React Native
- Validation: Zod schemas
- Build Tools: Turborepo, Vite

## Support and Resources

For questions or issues:
- Review the documentation in the `docs/` directory
- Check existing issues on GitHub
- Consult the `TROUBLESHOOTING.md` guide

## License

This project is licensed under the terms specified in the LICENSE file.

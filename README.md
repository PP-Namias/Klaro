<div align="center">
  <a href="https://www.klaro-scans.tech/">
    <img src="./apps/nextjs/public/klaro-showcase.png" alt="Klaro" />
  </a>

  <h1>Klaro</h1>

  <p>Instant plain-language medical document understanding for the Philippines.<br/>Upload lab results, prescriptions, or discharge summaries — get clear explanations in your dialect.</p>

  <p>
    <a href="https://www.klaro-scans.tech/"><strong>Get Started</strong></a>
    ·
    <a href="https://github.com/PP-Namias/klaro"><strong>Source Code</strong></a>
    ·
    <a href="./docs"><strong>Documentation</strong></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build Status" />
    <img src="https://img.shields.io/badge/tests-283%20passed-brightgreen?style=flat-square&logo=vitest&logoColor=white" alt="Unit Tests" />
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=github" alt="License" />
    <img src="https://img.shields.io/badge/sprint-5%20days-orange?style=flat-square" alt="Sprint Duration" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/pnpm-monorepo-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  </p>
</div>

---

Klaro makes healthcare accessible by turning complex medical documents into plain language that anyone can understand. Built for the Philippines, it supports local dialects and connects patients with licensed healthcare providers — all in one app.

Whether you're a patient trying to understand your lab results, a caregiver helping an elderly family member, or someone in a rural area without easy access to a doctor, Klaro bridges the gap between medical jargon and real understanding.

## Features

**Document Analysis**

- Upload lab results, prescriptions, discharge summaries, or any medical document
- AI-powered extraction using Google Gemini for accurate data parsing
- Automatic severity scoring with medical context
- Plain language explanations in Filipino, Bisaya, Ilocano, or English

**Clara AI Chatbot**

- Context-aware conversations about your scanned documents
- Multilingual support — responds in your preferred dialect
- Built-in safety filtering for medical advice
- Natural follow-up questions with extended dialogue

**Healthcare Discovery**

- Geolocation-based clinic and hospital search
- PhilHealth accreditation status filtering
- Real-time operating hours and availability
- Integrated DOH database + Google Maps data

**Doctor Consultations**

- Free consultations with PRC-verified licensed doctors
- Chat, video, or asynchronous document review
- Automatic document sharing with your provider
- Digital prescriptions and referrals

## Quick Start

The quickest way to run Klaro locally:

```bash
# Clone the repository
git clone https://github.com/PP-Namias/klaro.git
cd klaro

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
pnpm auth:generate
pnpm db:push

# Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

For detailed setup instructions, see the [documentation](./docs).

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 15 (React 19) |
| Mobile | Expo (React Native) |
| Language | TypeScript 5.8 |
| API | tRPC (Type-safe RPC) |
| Auth | Better Auth |
| Database | PostgreSQL with Drizzle ORM |
| AI | Google Gemini, Tesseract.js, Google Vision |
| Styling | Tailwind CSS, NativeWind |
| Build | Turborepo, pnpm |
| Testing | Vitest (283 tests) |

---

## Testing

Klaro has **283 unit tests** across 19 test files, built using Test-Driven Development.

```bash
cd packages/api
npx vitest run
```

| Module | Tests | Description |
| --- | --- | --- |
| Upload | 56 | File validation, document service, progress tracking |
| OCR | 85 | Preprocessing, cloud fallback, result normalization |
| Gemini AI | 55 | Extraction, prompts, fallback handling, pipeline |
| Plain Language | 60 | Terminology, severity scoring, Tanong Mo Sa Doktor |
| Clara Chat | 27 | Chat service, context assembly, dialect detection |

## Documentation

Comprehensive guides are available in the [`docs/`](./docs/) directory:

| Guide | Description |
| --- | --- |
| [API Reference](./docs/API_REFERENCE.md) | API endpoint documentation |
| [Backend Guide](./docs/BACKEND_DEV_GUIDE.md) | Backend development guidelines |
| [Mobile Guide](./docs/MOBILE_DEV_GUIDE.md) | Mobile application development |
| [Web Guide](./docs/WEB_DEV_GUIDE.md) | Web application development |
| [Database Guide](./docs/DATABASE_GUIDE.md) | Database schema and ORM usage |
| [Security Guide](./docs/SECURITY_GUIDE.md) | Security best practices |
| [Deployment](./docs/DEPLOYMENT_GUIDE.md) | Production deployment steps |

## Contributing

Contributions make open-source thrive. Whether fixing a typo or adding a feature, all contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contributors

<p>
  <a href="https://github.com/PP-Namias">
    <img src="https://github.com/PP-Namias.png" width="60" style="border-radius: 50%;" alt="Jhon Keneth Namias" />
  </a>
  <a href="https://github.com/aikhe">
    <img src="https://github.com/aikhe.png" width="60" style="border-radius: 50%;" alt="aikhe" />
  </a>
  <a href="https://github.com/frtzhahn">
    <img src="https://github.com/frtzhahn.png" width="60" style="border-radius: 50%;" alt="aldrin" />
  </a>
</p>

| Name | GitHub |
| --- | --- |
| **Jhon Keneth Namias** | [@PP-Namias](https://github.com/PP-Namias) |
| **aikhe** | [@aikhe](https://github.com/aikhe) |
| **aldrin** | [@frtzhahn](https://github.com/frtzhahn) |

## License

[MIT](./LICENSE) — do whatever you want with it.

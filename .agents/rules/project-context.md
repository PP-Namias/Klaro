---
trigger: always_on
---

# Project Context

## The Why

**Klaro** is a premium health-tech platform designed for medical document processing and lab result extraction. It focuses on providing clarity and technical precision to health data through an integrated web and mobile experience. The project emphasizes visual excellence, data integrity, and a professional, high-fidelity user interface.

## The System

- **Apps**:
  - `/apps/nextjs`: The main Next.js web application for result management and document processing.
  - `/apps/expo`: The mobile application built with Expo for on-the-go health tracking.
  - `/apps/tanstack-start`: Experimental web implementation using TanStack Start.
- **Packages**:
  - `packages/api`: Shared API logic and tRPC routers.
  - `packages/auth`: Centralized authentication handling with Better-Auth.
  - `packages/db`: Drizzle ORM schemas and database client.
  - `packages/ui`: Shared UI component library using Tailwind CSS and Radix UI.
  - `packages/validators`: Shared Zod validation schemas.
- **Infrastructure**: Powered by Turborepo and pnpm for fast, efficient monorepo management.

## Decision Making Context

Technical decisions should prioritize reliability, performance, and the professional nature of medical data management. Every UI change must maintain high visual fidelity and a clean, technical aesthetic. Security and data privacy are paramount.

## Awareness Rules

- MUST be aware that changes in `packages/` affect multiple applications (Web, Mobile).
- MUST keep database schemas in sync with API and UI requirements.
- MUST maintain a clean, professional aesthetic across all new UI components.

---
trigger: always_on
---

# Architecture

## Intent

Maintain a scalable and predictable monorepo structure using Turborepo and feature-based isolation.

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Frontend (Web)**: Next.js (App Router)
- **Frontend (Mobile)**: Expo / React Native
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth
- **Styling**: Tailwind CSS + CSS Modules
- **Tooling**: ESLint, Prettier, TypeScript, tRPC

## Project Tree

```text
.
├── apps/
│   ├── nextjs/          # Next.js web application
│   ├── expo/            # Expo mobile application
│   └── tanstack-start/  # Experimental web application
├── packages/
│   ├── api/             # Shared API routers & logic
│   ├── auth/            # Better-Auth configuration
│   ├── db/              # Drizzle schemas & connection
│   ├── ui/              # Shared UI components (Tailwind + Radix)
│   └── validators/      # Shared Zod schemas
├── .agent/              # Agent skills, rules, and workflows
├── turbo.json           # Turborepo pipeline config
└── package.json         # Root dependencies and workspace scripts
```

## Rules

- MUST follow the monorepo structure above.
- MUST use feature-based isolation (e.g., in `apps/nextjs/src/app/_components`).
- MUST NOT import across features directly; use public APIs or shared packages.
- MUST isolate business logic/state from UI components.

## Guidelines

- Keep shared logic in `packages/` if used by multiple apps.
- Use `packages/db` for all database interactions to ensure consistency.
- Prefer modular and composable design for UI components in `packages/ui`.

## Checks

- No circular dependencies between packages.
- Clear separation between UI and Data Fetching logic (e.g., tRPC/Server Actions).

## Anti-patterns

- Shared global state without boundaries.
- Hardcoding sensitive environment variables (use the env validation system).
- Duplicating business logic across apps instead of using `packages/`.

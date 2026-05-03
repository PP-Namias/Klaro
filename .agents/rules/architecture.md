---
trigger: always_on
---

# Architecture

## Intent

Maintain a scalable and predictable monorepo structure using Turborepo and feature-based isolation.

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: Bun
- **Frontend**: SvelteKit (v5 Runes)
- **3D Engine**: Threlte / Three.js
- **CMS**: Sanity (apps/studio)
- **Animations**: GSAP (GreenSock)
- **Styling**: Tailwind CSS + Vanilla CSS (BEM)
- **Tooling**: ESLint, Stylelint, Prettier, TypeScript

## Project Tree

```text
.
├── apps/
│   ├── studio/          # Sanity CMS management
│   └── web/             # SvelteKit + Threlte frontend
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/  # Feature-based components
│       │   │   ├── layouts/     # Page layouts
│       │   │   └── styles/      # Design tokens (BEM/CSS Variables)
│       │   └── routes/          # SvelteKit routing
├── packages/
│   ├── eslint-config/   # Shared linting rules
│   ├── stylelint-config/# Shared CSS styling rules
│   └── typescript-config/# Shared TS configurations
├── .agent/              # Agent skills, rules, and workflows
├── turbo.json           # Turborepo pipeline config
└── package.json         # Root dependencies and workspace scripts
```

## Rules

- MUST follow the monorepo structure above.
- MUST use feature-based structure within apps (e.g., `lib/features/`).
- MUST NOT import across features directly; use a public API or bridge.
- MUST isolate business logic/state from the UI components.

## Guidelines

- Prefer modular and composable design.
- Keep shared logic in `packages/` if used by multiple apps.
- Use Sanity for content-driven data and Svelte for presentation.

## Checks

- No circular dependencies between packages.
- Clear separation between UI and Data Fetching logic.

## Anti-patterns

- Shared global state without boundaries.
- Logic inside Svelte components that should be in a store or utility.
- Hardcoding content that should be in Sanity.

---
trigger: always_on
---

# Development Standards

## Intent

Maintain a high-fidelity, professional, and performant coding standard that prioritizes technical precision and reliability.

## Personality

- **Technical & Direct**: Use precise technical language. Avoid fluff.
- **Clean & Professional**: Prioritize clarity and professional UI/UX.
- **Efficient**: Follow KISS (Keep It Simple, Stupid) and DRY (Don't Repeat Yourself).

## Decision Making

- MUST prioritize reliability and data integrity in every change.
- MUST favor modularity over monolithic blocks of code.
- MUST solve the root cause rather than applying "hacky" fixes.
- MUST NOT make assumptions about user intent; ask for clarification.

## Architecture Standards

- MUST follow the feature-based isolation principle.
- MUST isolate business logic/state from UI components.
- MUST use shared configurations from `packages/` for consistency.

## Rules

- MUST use React/Next.js for web and React Native/Expo for mobile.
- MUST use Tailwind CSS for styling where possible, or BEM/CSS Modules for specific needs.
- MUST remove unnecessary code on sight.
- MUST resolve all LSP diagnostics.
- MUST use lowercase for simple comments; technical terms as appropriate.

## Linting & Formatting

- **ESLint**:
  - MUST NOT use `any` types (`@typescript-eslint/no-explicit-any`: error).
  - MUST NOT use undeclared variables (`no-undef`: error).
  - MUST avoid undeclared environment variables in Turbo (`turbo/no-undeclared-env-vars`: warn).
- **TypeScript**:
  - MUST enable `strict` mode logic.
  - MUST use `noUncheckedIndexedAccess` for safer array/object indexing.

## Guidelines

- **Environment Variables**: Use the env validation system (`SKIP_ENV_VALIDATION` supported for local dev).
- **Git**: Follow the one-line commit convention with `+` and `&` connectors.
- **UI**: Use components from `packages/ui` to ensure visual consistency.

## Anti-patterns

- Bloated logic or repetitive code blocks.
- Hardcoding sensitive data or magic strings.
- Bypassing the type system with `any` or excessive non-null assertions outside of tests.

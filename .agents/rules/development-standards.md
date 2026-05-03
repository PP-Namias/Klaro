---
trigger: always_on
---

# Development Standards

## Intent

Maintain a high-fidelity, premium, and performant coding standard that prioritizes visual excellence and technical precision.

## Personality

- **Technical & Direct**: Use precise technical language. Avoid fluff.
- **Organic & Premium**: Prioritize fluid animations and high-fidelity UI.
- **Efficient**: Follow KISS (Keep It Simple, Stupid) and DRY (Don't Repeat Yourself).

## Decision Making

- MUST prioritize "User Experience" (UX) and "Visual Fidelity" in every UI change.
- MUST favor modularity over monolithic blocks of code.
- MUST solve the root cause rather than applying "hacky" fixes.
- MUST NOT make assumptions about user intent; ask for clarification.

## Architecture Standards

- MUST follow the feature-based isolation principle.
- MUST isolate business logic/state from UI components.
- MUST use shared configurations from `packages/` for consistency.

## Rules

- MUST use Svelte v5 (Runes) and Threlte/Three.js for 3D interactions.
- MUST use BEM naming convention for all CSS.
- MUST remove unnecessary code on sight.
- MUST ensure all `each` blocks have a unique key.
- MUST resolve all LSP diagnostics.
- MUST use lowercase for comments

## Linting & Formatting

- **ESLint**:
  - MUST NOT use `any` types (`@typescript-eslint/no-explicit-any`: error).
  - MUST NOT use undeclared variables (`no-undef`: error).
  - MUST avoid navigation links without `resolve()` in Svelte (`svelte/no-navigation-without-resolve`: error).
  - MUST avoid undeclared environment variables in Turbo (`turbo/no-undeclared-env-vars`: warn).
- **Stylelint**:
  - MUST follow BEM for class and ID patterns.
  - MUST maintain alphabetical order for CSS properties (`order/properties-alphabetical-order`: true).
  - MUST use string notation for imports.
- **TypeScript**:
  - MUST enable `strict` mode logic.
  - MUST use `noUncheckedIndexedAccess` for safer array/object indexing.

## Guidelines

- Font: Geist (Thin weights, tight letter-spacing).
- Animation: GSAP for all state transitions (no instant snaps).
- Colors: Use variables from `_colors.css` only.

## Anti-patterns

- Bloated logic or repetitive code blocks.
- Shared global state without clear boundaries.
- Hardcoding hex colors or pixel values that should be variables.

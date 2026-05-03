---
trigger: always_on
---

# Project Context

## The Why

**Ego Ipse** is a premium, high-fidelity personal portfolio and identity platform designed to showcase projects through an organic and interactive web experience. The project emphasizes visual excellence, fluid motion, and a deeply technical design language, moving away from generic web aesthetics toward a more sophisticated, curated digital presence.

## The System

- **Apps**:
  - `/apps/web`: A SvelteKit + Threlte (Three.js) frontend for the main interactive experience.
  - `/apps/studio`: A Sanity Studio instance for content management.
- **Packages**:
  - Centralized configurations for ESLint, Stylelint, and TypeScript to ensure monorepo consistency.
- **Infrastructure**: Powered by Turborepo and Bun for fast, efficient build pipelines.

## Decision Making Context

Every technical decision should support the "Premium" nature of the project. If a change compromises the visual fidelity or the "organic" feel of the interactions, it must be reconsidered. Performance is critical, but never at the expense of necessary high-fidelity animations (leveraging GSAP and Threlte).

## Awareness Rules

- MUST be aware that changes in `packages/` affect the entire monorepo.
- MUST keep Sanity schemas in sync with SvelteKit data fetching.
- MUST maintain the "Thin Geist" aesthetic (200 weight, 0.34% tracking) across all new UI.

---
name: sync
description: Synchronizes Sanity CMS schemas with SvelteKit data fetching. Use when modifying content models or updating frontend data queries.
---

# Sync Skill

This skill ensures that the data layer (Sanity) and the presentation layer (SvelteKit) remain in perfect synchronization.

## When to use this skill

- Use this when adding or modifying Sanity schemas in `apps/studio`.
- Use this when updating GROQ queries or data fetching logic in `apps/web`.
- Use this to verify that content-driven pages have access to the correct data fields.

## How to use it

### 1. Schema Updates

- When modifying a schema, check all references in the frontend.
- Proactively suggest updates to TypeScript types if the data structure changes.

### 2. Data Validation

- Ensure that for every new Sanity field, there is a corresponding UI element or state update.
- Use the `studio` app to verify that sample content matches the frontend requirements.

## Troubleshooting

- If a query returns `null`, verify the field name in the Sanity schema.
- Ensure that the Sanity dataset (e.g., `production`) matches the one configured in the SvelteKit environment variables.

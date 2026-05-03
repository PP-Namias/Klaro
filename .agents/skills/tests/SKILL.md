---
name: tests
description: Generates and manages unit and end-to-end tests. Use when ensuring code quality or verifying user flows in Svelte components.
---

# Tests Skill

This skill ensures that the application remains robust through consistent testing patterns.

## When to use this skill

- Use this when creating new features that require verification.
- Use this when debugging complex component interactions.
- Use this to generate mock data for testing UI states.

## How to use it

### 1. Component Testing

- Use Vitest and Svelte Testing Library for unit tests.
- Focus on user interactions (clicks, inputs) and state transitions.

### 2. End-to-End Testing

- Use Playwright for critical user flows (e.g., project navigation, theme toggling).
- Ensure tests run across multiple screen sizes to verify responsiveness.

### 3. Standards

- Follow the project's lowercase comment style within test files.
- Ensure all tests are kept simple and direct (DRY/KISS).

## Example Command

```sh
bun run test
```

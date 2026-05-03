---
name: git
description: Manages the project's technical git workflow. Use when creating commits or formatting pull requests according to the project policy.
---

# Git Skill

This skill ensures that the commit history and PR documentation remain technical, clean, and descriptive.

## When to use this skill

- Use this before committing code to ensure the message follows the one-line format.
- Use this when generating PR summaries and descriptions.
- Use this to ensure the `.agent` and `.agents` directories are not accidentally committed.

## How to use it

### 1. Commit Formatting

- Use the one-line format: `feat(scope): descriptions & details + second feature`.
- Connect distinct features with `+`.
- Connect correlated details with `&`.
- Wrap long messages immediately after a `+` or `&` (Max 120 chars).
- **Automated Validation**: Commit messages are enforced in CI by **Commitlint**.

### 2. Pull Request Style

- PR Titles must follow the commit style (one-line, technical).
- Descriptions MUST include:
  - `### Summary`: High-level overview.
  - `### Features`: Bulleted list of new functionality.
  - `### Changes`: Technical breakdown of modified files with [clickable links].
- **Automated Validation**: PR titles are enforced by **GitHub Actions**.
- **CI Enforcement**: Merging is only allowed if the **CI Pipeline** (build/lint) is green ✅.

### 3. Guidelines

- Use PowerShell for all Git operations.
- Prefer technical and descriptive language (`feat(threlte):`, `fix(svelte):`).
- Use lowercase for simple, direct descriptions.

## Anti-patterns

- Committing without explicit "go ahead" from the USER.
- Using multi-line commit messages with summaries.
- Staging the `.agent` or `.agents` folder.

## Samples

- `feat(threlte): scene interactions & perspective + load gltf model init`
- `fix(svelte): resolve each_key_duplicate error & refine dark mode overlay colors`

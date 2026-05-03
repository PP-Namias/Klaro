name: orchestrator
description: >
  Multi-tool coordination agent. Automates pre-flight checks, generates clickable file lists, runs workflows, and prepares PR-ready markdown.

# Orchestrator Skill

## Intent

Centralize repetitive pre-PR tasks so human reviewers can focus on intent and QA. Orchestrator coordinates formatting, linting, typechecks, file-link generation, and invokes review agents.

## Capabilities

- Run repo-level commands: format, lint, typecheck, tests.
- Enumerate changed files and produce workspace-relative clickable links for PRs.
- Run `done-criteria` and emit pass/fail checklist.
- Invoke `content-review` agent and aggregate its findings into PR notes.

## Invocation

- Example prompt: "orchestrator: run preflight, list changed files, produce PR changes section, call content-review"

## Output format

- JSON with keys: `status`, `files` (array of {path, link, summary}), `doneCriteria` (array), `contentReview` (summary), `prDraft` (markdown string).

## Safety

- Must not commit or push without explicit user approval. Presents `git commit` command for user to approve.

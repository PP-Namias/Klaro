---
description: Optional autocommit workflow for deterministic agent outputs and reports. Disabled by default.
---

# Autocommit Workflow (opt-in)

This workflow documents how to safely enable automated commits of generated agent artifacts (reports, DESIGN.md, audit outputs). Autocommit is strictly opt-in and requires explicit configuration in `.agents/autocommit.json`.

## Design goals

- Keep team informed with periodic deterministic reports (impeccable audits, content-review summaries).
- Respect `git-policy` requirement: do not commit without explicit user opt-in.
- Provide both local script and a manual GitHub Action trigger for convenience.

## Files involved

- `.agents/autocommit.json` — opt-in config (default: `enabled: false`).
- `.agents/scripts/auto_commit.ps1` — PowerShell helper to stage and commit files, interactive by default.
- `.github/workflows/autocommit.yml` — optional workflow (manual trigger) that runs audits and commits when explicitly triggered.

## How it works (local)

1. Run deterministic checks (e.g., `npx impeccable detect src/ --json > .reports/impeccable.json`).
2. Run `.agents/scripts/auto_commit.ps1` to stage curated files and create commit message from template in `.agents/autocommit.json`.
3. Script prompts for confirmation unless `AUTOCOMMIT_ALLOW=true` is set (explicit non-interactive consent).

## Safety rules

- Autocommit will not run if `.agents/autocommit.json` sets `enabled:false`.
- Non-interactive commits require `AUTOCOMMIT_ALLOW=true` in environment (explicit consent).
- Script will never commit files under `.agents/` unless `allow_agents` is set to true in config.
- GitHub Action is manual (`workflow_dispatch`) and will respect the same config file.

## Recommended use

- Use autocommit for generated reports and DESIGN.md snapshots only. Do not enable for automatic code changes.

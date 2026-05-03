---
description: Structured sequence to prepare and finalize Pull Request documentation, including summaries, feature lists, and clickable file changes.
---

# PR Workflow

**Description**: Structured sequence to prepare and finalize Pull Request documentation, including summaries, feature lists, and clickable file changes.

## Steps
## Steps

1. **Pre-flight Check (local)**: Run formatting, linting and typechecks; fix all errors.

    - Commands (run from repo root):

       ```powershell
       pnpm -w run format:fix
       pnpm -w run lint:fix || pnpm -w run lint
       pnpm -w run typecheck
       ```

    - Outcome: zero lint errors, zero TypeScript errors, and Prettier-unchanged files are staged.

2. **Run Done Criteria**: Execute checklist in `.agents/workflows/done-criteria.md` and record pass/fail for each item.

3. **Draft PR Metadata**: Use this template and fill fields precisely.

    - **Title**: One-line technical message following commit convention (e.g., `feat(threlte): scene interactions & load gltf model`).
    - **Summary**: 1–2 sentences. State intent and user-visible effect.
    - **Changes**: Bulleted technical list of modified areas and rationale. Include clickable file links for each changed file.
    - **Features**: Short bullets for new capabilities or fixes.
    - **Tests**: What tests were added/updated and how to run them locally.
    - **How to QA**: Step-by-step manual verification instructions (screenshots, routes, test accounts).
    - **CI**: Note expected CI jobs (build, lint, typecheck, tests) and required status.
    - **Configuration**: If applicable, include env var names and example values.

4. **Generate clickable file links**: Use the `orchestrator` agent to enumerate changed files and produce workspace-relative clickable links for the `Changes` section.

5. **Content & Privacy Review**: Run `content-review` agent to validate copy, PHI/PII handling, and dialect messaging (Filipino/Bisaya/Ilocano).

6. **Final Review & Snapshot**: Ensure `pnpm -w run lint` clean, snapshot any visual changes, and attach screenshots (if UI change).

7. **Finalize & Commit**: Present proposed `git commit` shell command for user approval according to `.agents/workflows/commit-convention.md`. Do not commit until user says go.

8. **Post-merge checks**: Add smoke-test steps and rollout notes in PR description if release affects production services.

---

## Templates

- **PR Title**: `feat(scope): short-description & correlated-detail`

- **PR Summary**:

   > One-sentence goal. One-sentence outcome.

- **Changes**:

   - [file path](path/to/file#L1-L20): brief technical note about change.

- **How to QA**:

   1. Start dev server: `pnpm -w dev`
   2. Visit route `/example`
   3. Run test: `pnpm -w run test -- -u`

---

## Notes

- Use `orchestrator` to automate repetitive steps (format, lint, links, checklist).
- Use `content-review` to flag any wording that could mishandle PHI, or misrepresent dialect translations.
- Keep PR descriptions technical and copy-paste ready for GitHub.


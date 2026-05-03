---
description: Standardizes technical one-line commit messages using project-specific connection logic (+ and &) for a clean repository history.
---

# Commit Convention Workflow

**Description**: Standardizes technical one-line commit messages using project-specific connection logic (+ and &) for a clean repository history.

**Brief Description**: A streamlined protocol for crafting concise, consistent, and descriptive commit messages that maintain repository readability.

## Steps

1. **Verify Task Completion**: Before drafting a message, ensure requested changes are fully implemented and verified according to the project's /done-criteria.
2. **Review Logic**: Confirm code follows KISS and DRY. Remove any bloated logic or unnecessary edge cases.
3. **Construct Message**:
   - Use the technical one-line format.
   - Start with `feat(scope):` or `fix(scope):` in lowercase.
   - Use `+` to connect distinct features.
   - Use `&` to connect correlated details.
4. **Validation (Automated)**:
   - Attempt to commit with `git commit -m "..."`.
   - **Commitlint** will validate the message in CI.
   - If it fails, fix the message according to the terminal output.
5. **Final Confirmation**: Present the proposed `git commit -m` command and wait for the user's "go ahead" before execution.

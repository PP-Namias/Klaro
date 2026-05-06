2026-05-06 - Agent updates

- Added `packages/api/src/middleware/auth.ts` to enforce authentication on protected procedures.
- Ran unit & OpenAPI validation tests from `packages/db`: 33/33 passing.
- Committed middleware: feat(middleware): add auth protection & BearerAuth scheme (KL-FE-001-auth)

This change is limited to middleware and does not modify `.agents` or any secrets.

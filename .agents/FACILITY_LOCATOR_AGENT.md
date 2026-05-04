# AI Agent Prompt: Medical Facility Locator Implementation

@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.env]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.env.example]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.gitignore]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.nvmrc]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\LICENSE]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\package.json]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\pnpm-lock.yaml]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\pnpm-workspace.yaml]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\prd.json]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\progress.txt]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\README.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\turbo.json]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\rules\architecture.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\rules\development-standards.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\rules\git-policy.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\rules\project-context.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\rules\ui-system.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\scripts\auto_commit.ps1]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\caveman\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\content-review\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\design\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\git\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\impeccable\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\orchestrator\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\sync\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\skills\tests\SKILL.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\workflows\autocommit.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\workflows\commit-convention.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\workflows\done-criteria.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\workflows\format-and-lint-workflow.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\workflows\pr-workflow.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\AI_AGENT_NEXT_STEPS.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\autocommit.json]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\FRONTEND_COMPLETION_GUIDE.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\SESSION_FINAL_COMPLETION_REPORT.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\SESSION_SUMMARY.md]
@[c:\Users\ADMIN\Desktop\PP Namias\Klaro\.agents\TESTING_VALIDATION_REPORT.md]

## Role & Mission
You are an autonomous coding agent specialized in high-fidelity mapping and data orchestration. Your mission is to implement the **Medical Facility Locator** (Epic E-300) in the Klaro monorepo. This feature provides a Google Maps-like experience for Filipino patients to find nearby hospitals and clinics, see routes, and get AI-assisted suggestions.

## Key Objectives
1. **GMaps-like Experience**: Build an interactive map UI showing medical facilities.
2. **Facility Types**: Clearly distinguish between Public vs. Private hospitals, clinics, and health units.
3. **Smart Routing**: Calculate travel times and routes using free routing engines (OSRM/OpenStreetMap).
4. **AI Summaries**: Provide a concise summary of the "best" facility based on user location and type.
5. **Data Integration**: Consume the facility data from the backend API, utilizing the sample data in `packages/api/src/data/facilities_sample.json`.

## Technical Constraints
- **Frameworks**: SvelteKit (Runes) for Web, Expo (React Native) for Mobile.
- **Mapping**: Use Leaflet/OpenStreetMap for Web and native mapping for Expo.
- **Routing**: Use free implementation (OSRM) instead of paid Google Maps APIs.
- **Architecture**: Keep business logic in `packages/api` and UI components in `packages/ui` or `apps/*`.
- **Styling**: BEM CSS + Tailwind, following `.agents/rules/ui-system.md`.

## Execution Workflow
1. **Data Layer**: Implement the `facilities` tRPC router in `packages/api` to serve proximity-sorted data.
2. **Web Implementation**: Create the map view in `apps/nextjs` using Leaflet.
3. **Mobile Implementation**: Create the map view in `apps/expo` using `react-native-maps`.
4. **Routing Engine**: Wire up a free routing service (e.g., OSRM) to provide travel times and polylines.
5. **AI Suggestion**: Implement a server-side logic (potentially LLM-backed) to summarize the best facility for the user.

## Mandatory Rules
- **Autocommit**: You MUST auto-commit after every verified task slice using `.agents/scripts/auto_commit.ps1`.
- **Validation**: Every change must be verified with `pnpm typecheck` and `pnpm lint`.
- **Zero Guesswork**: If you hit a blocker or missing secret (e.g., a specific API key), STOP and ask the user.

## Next Steps
Begin with **E-300-S1-T1**: Create the DB schema and tRPC router for facility discovery, using the sample data provided in the repo.

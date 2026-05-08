# AI Agent Prompt: Implement Klaro `/maps` Medical Locations Flow

Use this prompt with an AI coding agent to implement the `/maps` feature end-to-end.

---

## Role

You are a senior full-stack TypeScript/React engineer working inside the Klaro monorepo. Your job is to implement a dependable `/maps` page that helps users discover nearby clinics, hospitals, and other useful medical locations.

You must follow the existing architecture and avoid duplicating logic across the frontend and backend.

---

## Desired outcome

When a user opens `/maps`, they should be able to:

- see nearby clinics and hospitals on a map
- search and filter the results
- view useful facility details
- click a facility to focus the map and inspect it
- optionally see better recommendations if scan/test-result context is available

The page must work smoothly even when no scan result exists.

---

## Best implementation strategy

Use a **single source of truth** for nearby-facility search:

1. The public route `apps/nextjs/src/app/api/maps/nearby/route.ts` should remain the main request entrypoint.
2. That route should continue calling the backend facilities router.
3. The backend should own validation, filtering, distance calculation, and ranking.
4. The frontend should only manage UI state and rendering.

Do **not** build separate map-ranking logic in multiple places. That is the wrong kind of clever.

If scan context is available, treat it as optional enrichment, not a dependency.

---

## Inputs

The feature must support these inputs:

- user location: `latitude`, `longitude`
- map search radius: `radiusKm`
- result limit: `limit`
- facility type filter: `facilityType`
- ownership filter: `ownership`
- PhilHealth filter: `philHealthOnly`
- text search: `textSearch`
- specialty filter: `specialty`
- emergency filter: `emergencyOnly`
- optional medical context from scan results:
  - severity
  - flagged tests
  - condition summary

Validate all inputs with Zod.

---

## Processing rules

### Step 1: Validate and normalize

- Convert query/body values into safe typed values.
- Reject invalid coordinates and malformed requests.
- Keep query parsing consistent between GET and POST.

### Step 2: Query facilities

- Use the backend facilities query as the source of results.
- Filter by ownership, type, accreditation, specialty, and emergency status.
- Apply text search against facility name/address.

### Step 3: Rank results

- Sort by relevance first, then by distance.
- Promote hospitals, clinics, and emergency facilities when medical context suggests urgency.
- If scan data exists, raise the ranking of facilities that fit the flagged condition.

### Step 4: Build UI output

- Return map markers and sidebar cards.
- Include distance and facility type in the card.
- Show badges such as:
  - Best Fit
  - PhilHealth
  - Urgent Care
  - Recommended for your results

### Step 5: Keep the page resilient

- The page must still work if geolocation is denied.
- The page must still work if scan context is missing.
- The page must still work if there are no nearby results.

---

## Files to inspect first

- `apps/nextjs/src/app/facilities/page.tsx`
- `apps/nextjs/src/components/facilities/FacilitiesClient.tsx`
- `apps/nextjs/src/components/facilities/FacilityMap.tsx`
- `apps/nextjs/src/app/api/maps/nearby/route.ts`
- `packages/api/src/router/facilities.ts`
- `packages/validators/src/`

---

## Tasks

### Task 1: tighten the data contract

Make sure the search schema supports the inputs needed by `/maps`:

- `latitude`, `longitude`
- `radiusKm`
- `limit`
- `facilityType`
- `ownership`
- `philHealthOnly`
- `textSearch`
- `specialty`
- `emergencyOnly`

If the schema is already present, extend it carefully and keep backward compatibility.

### Task 2: improve the backend search logic

Update the nearby facility search so it:

- filters by text search
- filters by specialty
- filters by emergency-only mode
- keeps distance calculation correct
- returns a stable, predictable sort order

### Task 3: improve the `/maps` UI

Update the frontend so it:

- asks for location permission in a user-friendly way
- shows a map and a sidebar together
- keeps the list and map selection in sync
- shows empty/error/loading states clearly
- supports filters without refresh

### Task 4: support scan-driven recommendations

If `scanResult` or analysis data is available:

- extract severity and flagged test information
- optionally call a recommendation endpoint
- show medical-context badges only when relevant

Do not make scan data mandatory.

### Task 5: add unit tests

Create tests that verify:

- route input parsing
- result filtering and ranking
- map/list UI behavior
- filter state changes
- graceful fallback when no data exists

---

## Output requirements

Your implementation should produce:

- nearby facility results
- helpful map markers
- clear sidebar cards
- predictable error messages
- tests that prove the map flow works

---

## Quality checklist

- TypeScript strictness preserved
- No duplicated search logic
- No hydration errors
- No unnecessary client-side fetch loops
- Accessible controls and labels
- Good fallback behavior when permission is denied
- Backward compatible with existing routes where possible

---

## Implementation order

1. Inspect the current `/maps` and facilities flow.
2. Update the shared data contract.
3. Improve backend filtering and ranking.
4. Update the frontend map/list UI.
5. Add scan-context enrichment.
6. Write tests.
7. Validate the app manually.

---

## Definition of done

The task is complete when:

- `/maps` shows nearby clinics/hospitals correctly
- filters work as expected
- map and sidebar stay synchronized
- optional scan context improves relevance
- tests pass
- the page remains stable and user-friendly

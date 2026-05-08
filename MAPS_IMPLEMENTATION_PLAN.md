# Klaro `/maps` Medical Locations Plan

## Goal

Build a reliable `/maps` experience that shows nearby clinics, hospitals, and other helpful medical locations for the user, with clean inputs, predictable processing, and useful outputs.

## Recommended approach

Use **one source of truth** for nearby facilities:

- Keep `/api/maps/nearby` as the public HTTP entrypoint for map queries.
- Keep `facilities.searchNearby()` as the backend implementation behind it.
- Let the frontend only handle presentation, filtering state, and user interactions.
- Avoid duplicating geolocation/ranking logic in multiple places.

This is the safer way to make it work because it reduces drift between the `/maps` page, the tRPC router, and the API route.

## Inputs

The `/maps` feature should accept these inputs:

- `latitude`, `longitude` — user location from browser geolocation or fallback coordinates
- `radiusKm` — search radius
- `limit` — max number of facilities returned
- `facilityType` — hospital, clinic, diagnostic center, etc.
- `ownership` — public, private, all
- `philHealthOnly` — optional filter
- `textSearch` — facility name/address search
- `specialty` — optional medical specialty filter
- `emergencyOnly` — optional 24/7 or urgent care filter
- `medicalContext` — optional scan-derived context such as severity and flagged tests

## Process

1. Get the user location.
2. Validate all inputs with Zod.
3. Query `/api/maps/nearby` or the tRPC facilities query.
4. Filter facilities by type, ownership, accreditation, text search, specialty, and emergency status.
5. Compute distance from the user.
6. Rank results by relevance, not distance alone.
7. If medical context is available, rank urgent or condition-relevant facilities higher.
8. Render the results in both the list and the map.
9. Let the user click a facility to focus the map and open booking or details.

## Outputs

The `/maps` page should display:

- Interactive map with nearby facilities
- Marker popups with facility name, type, address, and distance
- Side list of nearby facilities
- Badges such as:
  - Best Fit
  - PhilHealth
  - Urgent Care
  - Recommended for your results
- Search/filter UI
- Loading, empty, and error states

## Implementation phases

### Phase 1: Make the map data flow solid

- Ensure `/api/maps/nearby` matches the tRPC input schema
- Add missing filters to the schema if needed
- Confirm the frontend uses one shared query path

### Phase 2: Improve search and ranking

- Add text search by facility name/address
- Add specialty filter
- Add emergency-only filter
- Improve ranking for hospitals/clinics based on user context

### Phase 3: Improve UX

- Better map markers by facility type
- Better facility cards
- Clear empty state when no matches exist
- Add booking CTA where relevant

### Phase 4: Add test coverage

- Unit test the route input parsing
- Unit test ranking/filtering logic
- Unit test UI search/filter state
- Add at least one integration test for the nearby-map flow

## Better way to implement it

The best implementation is **not** to make the frontend smart and the backend smart in different ways. Instead:

- Put the query and ranking rules on the backend.
- Keep the map page as a thin presenter.
- Use the same normalized facility data everywhere.
- Make the medical scan result optional enrichment data, not a hard dependency.

That way the `/maps` page still works even if the user has not scanned any document yet.

## Acceptance criteria

- `/maps` shows nearby medical locations correctly
- Search and filters work without hydration errors
- The map and list stay in sync
- Scan-derived context can improve recommendations, but the page still works without it
- The implementation has tests for the route and UI behavior

# KLARO MEDICAL LOCATIONS FEATURE - ARCHITECTURAL PLAN & IMPLEMENTATION GUIDE

## Executive Summary

The Klaro platform requires an intelligent, AI-driven medical facility discovery system that helps users find nearby clinics, hospitals, and diagnostic centers. This document outlines the current state, recommended enhancements, and provides a detailed AI agent prompt for complete implementation.

---

## CURRENT STATE ANALYSIS

### ✅ What's Already Implemented

1. **Frontend Components**
   - `FacilitiesClient.tsx` - Main client-side orchestrator with state management
   - `FacilityMap.tsx` - Leaflet-based interactive map with marker popups
   - Ownership filter (public/private/all)
   - Distance-based sorting
   - AI suggestion display (bestSuggested)

2. **Backend tRPC Endpoints**
   - `facilities.searchNearby()` - Geolocation-based search (Haversine formula)
   - `facilities.bestSuggested()` - AI-ready ranking with facility type prioritization
   - `facilities.searchBySpecialty()` - Filter by medical specialty
   - `facilities.list()` - General facility listing
   - `facilities.byId()` - Individual facility details
   - `facilities.getTypes()` - Available facility types
   - `facilities.getOperatingHours()` - Hours query

3. **Database Schema**
   - Facility table with: id, name, address, latitude, longitude, facilityType, ownership, isPhilHealthAccredited, acceptedSpecialties, openingHours, etc.

4. **UI/UX Features**
   - Sidebar with facility list and filters
   - Interactive map with dynamic zoom/pan
   - Facility cards with distance, type, and accreditation badges
   - "Best Fit" badge highlighting
   - Location reset button (Quezon City default)

---

## IDENTIFIED GAPS & ENHANCEMENT OPPORTUNITIES

### 🔴 Critical Gaps

1. **AI-Generated Recommendations**
   - Current `bestSuggested` summary uses string templates, not LLM-generated explanations
   - No context awareness (medical condition, test results) when suggesting facilities
   - No ability to ingest user's extracted test data to make smarter suggestions

2. **Facility Filtering & Search**
   - No text search by facility name
   - No specialty filtering UI (only query capability)
   - No emergency/urgent care priority flag
   - No ratings, reviews, or quality indicators

3. **Integration with Test Results**
   - Facilities page doesn't receive or use medical scan/analysis data
   - No logic to suggest facilities based on flagged test results
   - Missing "urgent care" routing for high-severity findings

4. **Map UX**
   - Default marker icons are generic (no facility-type-specific icons)
   - No heatmap/clustering for high-density areas
   - No route/directions integration
   - Missing "distance to facility" calculation details (walking vs driving)

5. **Data Quality & Freshness**
   - No mechanism to verify facility data accuracy
   - No integration with real-time availability (appointment slots, wait times)
   - Manual facility entry process (no scraping/sync from healthcare registries)

6. **Booking & Workflow Integration**
   - No direct link from facility to Cal.com booking (already in Sidebar, but not here)
   - No appointment availability checks
   - Missing "book now" CTA in facility card

### 🟡 Nice-to-Have Enhancements

1. **Advanced Filtering**
   - Filter by opening hours (24/7 vs business hours)
   - Filter by insurance/payment methods accepted
   - Filter by available departments/services

2. **Smart Recommendations**
   - "Facilities treating your condition" based on test analysis
   - "Nearest emergency services" for urgent cases
   - "Best hospitals for [condition]" rankings

3. **Enhanced Map Features**
   - Cluster markers in high-density areas
   - Street view integration
   - Traffic/routing from user location
   - Multiple transportation mode costs (walking, driving, public transit)

4. **Social Proof**
   - User reviews & ratings
   - Doctor ratings
   - Patient testimonials
   - Wait time estimates

5. **Analytics & Logging**
   - Track facility clicks, bookings, routing
   - User journey analytics
   - Popular facility trends

---

## RECOMMENDED ARCHITECTURE

### **Data Flow with AI Integration**

```
User's Test Results (from /scan)
    ↓
Extract flagged values & severity
    ↓
LLM: Suggest relevant facility types
    ↓
tRPC: searchNearby(facilityType, urgent=severity=='HIGH')
    ↓
Rank by: type priority → distance → accreditation
    ↓
LLM: Generate facility recommendation explanation
    ↓
Display in sidebar with "Best Fit" badge + reasoning
    ↓
User clicks → Map focus + Cal.com booking modal
```

### **API Enhancements Needed**

1. **New tRPC Endpoint: `facilities.recommendByTestResults()`**
   - Input: extracted test data, flagged values, severity
   - Output: ranked list of recommended facilities + LLM explanation

2. **Enhanced `bestSuggested()` with Context**
   - Accept optional medicalContext parameter
   - Use LLM to generate contextual recommendation summary

3. **Search Enhancement**
   - Add full-text search by facility name
   - Add specialty filter to UI

4. **Availability Check Endpoint**
   - Query real-time appointment availability (placeholder for future integration)

---

## IMPLEMENTATION ROADMAP

### **Phase 1: Core Enhancements (Week 1)**
- [ ] Add LLM-generated recommendations to `bestSuggested()`
- [ ] Implement `facilities.recommendByTestResults()` endpoint
- [ ] Add text search functionality
- [ ] Add specialty filter UI
- [ ] Connect "Book Now" CTA to Cal.com modal

### **Phase 2: UX & Visual Improvements (Week 2)**
- [ ] Custom map markers by facility type (hospital icon, clinic icon, etc.)
- [ ] Add facility ratings/review placeholder UI
- [ ] Implement distance display (walking vs driving estimates)
- [ ] Add "Emergency Services" filter & priority routing

### **Phase 3: Integration & Data (Week 3)**
- [ ] Integrate test results context from /scan page
- [ ] Add facility availability API integration (mock data first)
- [ ] Implement appointment slot display
- [ ] Add patient testimonials UI

### **Phase 4: Analytics & Polish (Week 4)**
- [ ] Add analytics logging for facility clicks, bookings
- [ ] Performance optimization (lazy load markers, clustering)
- [ ] Full accessibility audit
- [ ] E2E testing

---

## TECHNICAL SPECIFICATIONS

### Database Schema Additions

```typescript
// Facility table additions needed:
- reviews: json[] (id, userId, rating, comment, createdAt)
- emergencyService: boolean
- departments: string[] (pediatrics, cardiology, etc.)
- acceptedInsurance: string[]
- availableNow: boolean
- averageWaitTime: integer (minutes)
- lastUpdated: timestamp
```

### Validator Schemas

```typescript
// packages/validators/src/facilities.ts additions:
- RecommendByTestResultsInput
- FacilityRecommendationOutput
- SpecialtyFilterInput
```

### Frontend Components to Enhance/Add

```typescript
// New/Enhanced components:
- FacilitySearchBar.tsx (text search + specialty filter)
- FacilityCard.tsx (with booking CTA, ratings display)
- FacilityDetailModal.tsx (expanded facility info)
- MapMarker.tsx (custom icon by type)
- RecommendationBadge.tsx (show AI recommendation reason)
```

---

## BEST PRACTICES & CONSIDERATIONS

### Security
- ✅ All endpoints are public (suitable for guest users)
- ⚠️ When adding user reviews, implement spam/abuse filtering
- ⚠️ Validate coordinates to prevent injection attacks

### Performance
- Use Leaflet MarkerCluster for 100+ facilities
- Cache facility list (revalidate every 24 hours)
- Implement virtual scrolling for sidebar list

### Accessibility
- ARIA labels on map markers
- Keyboard navigation for map (arrows, zoom with +/-)
- High contrast mode for map
- Screen reader support for facility list

### Data Privacy
- Do NOT store user location history without consent
- Use geolocation only for search, discard afterward
- Anonymize facility click tracking

---

## DEPLOYMENT NOTES

1. **Environment Variables**
   - GEMINI_API_KEY (for recommendation LLM calls)
   - MAPBOX_TOKEN (if switching from OpenStreetMap)

2. **Database Migrations**
   - Add new columns to facility table
   - Backfill facility type icons/categories
   - Run facility geocoding (if addresses change)

3. **Testing Strategy**
   - Unit tests for ranking algorithm
   - E2E tests for map interaction
   - Load tests for concurrent facility searches

---

## NEXT STEPS

1. Review and approve this architectural plan
2. Review the AI Agent Prompt (below) for detailed implementation guidance
3. Run agent prompt through Copilot to begin implementation
4. Prioritize Phase 1 enhancements

---

# AI AGENT IMPLEMENTATION PROMPT

Use this prompt with an AI agent to guide the full implementation:

---

## AGENT PROMPT: KLARO MEDICAL FACILITY DISCOVERY - FULL IMPLEMENTATION

You are an expert full-stack TypeScript/React developer tasked with enhancing the Klaro medical facility discovery feature. Your goal is to implement AI-driven facility recommendations, improve the map interface, and integrate the facilities feature with the user's test results.

### Current State

The Klaro app already has:
- Frontend: `apps/nextjs/src/components/facilities/FacilitiesClient.tsx` and `FacilityMap.tsx`
- Backend: `packages/api/src/router/facilities.ts` with `searchNearby()`, `bestSuggested()`, and `searchBySpecialty()` endpoints
- Database: Facility table in Drizzle ORM with location, type, ownership, accreditation data
- UI: Leaflet map + sidebar with filtering, distance sorting, and AI suggestion display

### Your Tasks

#### Task 1: Enhance LLM-Driven Recommendations (Backend)
**Objective:** Replace string-template recommendations with LLM-generated explanations.

Steps:
1. Create a new function `generateFacilityRecommendation()` in `packages/api/src/services/facilities.ts`
   - Input: facility object, user location, optional medical context (severity, flagged tests)
   - Uses `callLLMAPI()` from llm.ts to generate a personalized explanation
   - Output: Recommendation summary + reasoning

2. Update `facilities.bestSuggested()` endpoint
   - Accept optional `medicalContext` parameter (severity, testSummary)
   - Call `generateFacilityRecommendation()` to generate summary
   - Return facility + LLM-generated summary

3. Create new endpoint `facilities.recommendByTestResults()`
   - Input: extractedTests (from user's scan), latitude, longitude
   - Filter high-severity flags to suggest urgent care facilities first
   - Generate 3-5 ranked facility recommendations
   - Each recommendation includes: facility, distance, reasoning, urgency level
   - Return array of recommendations sorted by relevance

#### Task 2: Add Search & Filter Enhancement (Backend)
**Objective:** Enable text search and expose specialty filtering in API.

Steps:
1. Update `searchNearbySchema` validator to include:
   - `textSearch?: string` (for facility name search)
   - `specialty?: string` (already queryable, expose in schema)
   - `emergencyOnly?: boolean` (filter for 24/7 facilities)

2. Enhance `facilities.searchNearby()` logic
   - Add text search filter (case-insensitive name/address matching)
   - Add emergency facility filter (where emergencyService = true, assuming DB field exists)
   - Maintain existing distance & type ranking

#### Task 3: Update Frontend Components (UI)
**Objective:** Add search bar, specialty filter, and "Book Now" CTA.

Steps:
1. Create `FacilitySearchBar.tsx` component
   - Input fields: text search + specialty dropdown + emergency filter checkbox
   - On change, update parent state to trigger new search
   - Show search results count

2. Update `FacilitiesClient.tsx`
   - Add state for textSearch, specialty, emergencyOnly filters
   - Pass filters to `facilities.searchNearby()` query
   - Display search/filter state in UI
   - Add "No results" state with helpful message

3. Enhance `FacilityCard.tsx` (or inline in list)
   - Add "Book an Appointment" button (opens Cal.com modal via context/callback)
   - Display facility rating placeholder (5-star UI, future data source)
   - Add "Distance: X km" with travel mode indicator (walking/driving)
   - Highlight "Best Fit" or "Recommended for your condition" badges

4. Update `FacilityMap.tsx`
   - Use different marker icons based on facility type
     - 🏥 Hospital
     - 🏥 Clinic
     - 🔬 Diagnostic Center
   - Add popup with facility summary + "Book Now" button
   - (Optional) Implement marker clustering for 50+ facilities

#### Task 4: Integrate with Test Results (Cross-Feature)
**Objective:** Pass medical context from /scan page to facilities recommendations.

Steps:
1. Check if test result data is available (sessionStorage or URL param from /scan?id=...)
2. Extract severity, flagged tests, condition summary
3. Pass to `facilities.recommendByTestResults()` when available
4. Display "Recommended for your test results" badge on matching facilities
5. Sort facilities by relevance to test findings (urgent care first for HIGH severity)

#### Task 5: Add Unit Tests
**Objective:** Test new facility endpoints and UI components.

Steps:
1. Create `packages/api/src/router/__tests__/facilities-recommendations.test.ts`
   - Test `recommendByTestResults()` with sample test data
   - Verify facilities are ranked by severity-relevance
   - Test edge cases (no results, missing data)

2. Create `apps/nextjs/src/components/facilities/__tests__/FacilitySearchBar.test.tsx`
   - Mock text input and test debounce/search trigger
   - Test specialty filter dropdown interaction
   - Test emergency-only toggle

3. Create `apps/nextjs/src/components/facilities/__tests__/FacilityCard.test.tsx`
   - Test "Book Now" button (ensure onClick prop works)
   - Test badge rendering for "Best Fit" and urgency levels

### Implementation Order

1. **Start with backend** (Task 1 + 2): Generate recommendations + add search
2. **Move to UI** (Task 3): Add search bar + enhance cards
3. **Integrate** (Task 4): Wire test results context
4. **Test** (Task 5): Write unit tests

### Code Quality Requirements

- Follow existing patterns in the codebase (use Zod validators, tRPC procedures, React hooks)
- Add JSDoc comments for new functions
- Use TypeScript strict mode
- No console.log in production code
- Handle errors gracefully (show user-friendly messages)

### Testing Strategy

- Run `pnpm test` in each package
- Manual testing: Navigate to /facilities → search → verify recommendations → click "Book Now"
- Verify Gemini LLM is called correctly (check backend logs)

### Deliverables

1. Updated backend endpoints with LLM recommendations
2. Enhanced frontend with search, filters, and booking CTA
3. Test coverage for new features
4. Documentation of new endpoints in inline comments

---

End of Implementation Prompt.


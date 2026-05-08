# AI AGENT PROMPT: IMPLEMENT KLARO MEDICAL FACILITY DISCOVERY ENHANCEMENTS

**Agent Role:** Expert full-stack TypeScript/React developer specializing in healthcare integrations and AI-driven features.

**Project Context:**
- Klaro is an AI-powered medical document assistant helping users scan test results and find nearby care
- Existing implementation: Map-based facility discovery with distance-based sorting and filtering
- Goal: Add LLM-driven recommendations, improve search/filtering, and integrate with test results

---

## PRIMARY OBJECTIVE

Enhance the medical facility discovery system to provide intelligent, context-aware facility recommendations by:
1. Integrating LLM-generated explanations for facility recommendations
2. Adding advanced search and filtering (text search, specialties, emergency services)
3. Implementing facility recommendations based on user's medical test results
4. Improving UI/UX with better facility cards, interactive maps, and booking integration
5. Adding comprehensive unit tests

---

## CODEBASE OVERVIEW

### Current Files to Enhance
- Backend: `packages/api/src/router/facilities.ts` (tRPC endpoints)
- Backend service: Create new `packages/api/src/services/facilities.ts`
- Frontend: `apps/nextjs/src/components/facilities/FacilitiesClient.tsx`
- Frontend: `apps/nextjs/src/components/facilities/FacilityMap.tsx`
- Validators: `packages/validators/src/` (add facility schemas)

### Key Technologies
- tRPC for backend API
- React + Next.js for frontend
- Leaflet for maps
- Drizzle ORM for database
- Gemini API via `callLLMAPI()` (already integrated in `packages/api/src/services/llm.ts`)

---

## DETAILED REQUIREMENTS

### 1. Backend Enhancement: LLM-Driven Recommendations

**Create:** `packages/api/src/services/facilities.ts`

```typescript
// New function to generate facility recommendation explanations
export async function generateFacilityRecommendation(
  facility: FacilityData,
  userLat: number,
  userLon: number,
  medicalContext?: {
    severity: 'LOW' | 'MODERATE' | 'HIGH',
    testSummary: string,
    flaggedConditions: string[]
  }
): Promise<string> {
  // Call Gemini via callLLMAPI to generate personalized recommendation
  // Prompt should explain why this facility is good for user's location & condition
  // Return: "Based on your location and test results showing [condition], 
  //          [Facility Name] is the closest [type] with PhilHealth accreditation 
  //          ([distance] km away). Recommended for: [specialties]."
}
```

**Update:** `packages/api/src/router/facilities.ts`

1. Modify `bestSuggested()` endpoint:
   ```typescript
   bestSuggested: publicProcedure
     .input(z.object({
       latitude: z.number(),
       longitude: z.number(),
       facilityType: z.string().optional(),
       medicalContext: z.object({  // NEW
         severity: z.enum(['LOW', 'MODERATE', 'HIGH']),
         testSummary: z.string(),
         flaggedConditions: z.array(z.string())
       }).optional()
     }))
   ```
   - Generate recommendation summary using `generateFacilityRecommendation()`
   - Return with LLM-generated summary instead of template string

2. Create new `recommendByTestResults()` endpoint:
   ```typescript
   recommendByTestResults: publicProcedure
     .input(z.object({
       extractedTests: z.array(z.object({
         name: z.string(),
         value: z.string(),
         flagged: z.boolean()
       })),
       latitude: z.number(),
       longitude: z.number(),
       radiusKm: z.number().default(15)
     }))
     .mutation(async ({ ctx, input }) => {
       // 1. Parse extractedTests to determine severity
       // 2. Suggest facility types based on conditions
       // 3. Call searchNearby with suggested types
       // 4. For each result, generate recommendation explanation
       // 5. Return ranked array of facilities with LLM explanations
     })
   ```

### 2. Search & Filter Enhancement

**Update:** `packages/validators/src/` (add new schema file or update existing)

```typescript
export const facilitySearchSchema = z.object({
  textSearch: z.string().optional(), // facility name search
  specialty: z.string().optional(),   // medical specialty
  emergencyOnly: z.boolean().default(false), // 24/7 services
  facilityType: z.string().optional(),
  ownership: z.enum(['public', 'private']).optional(),
  latitude: z.number(),
  longitude: z.number(),
  radiusKm: z.number().default(15)
});
```

**Update:** `facilities.searchNearby()` logic:
- Add text search: filter facilities by name (case-insensitive substring match)
- Add emergency filter: filter where `emergencyService === true`
- Maintain existing distance and type ranking

### 3. Frontend: Search Bar Component

**Create:** `apps/nextjs/src/components/facilities/FacilitySearchBar.tsx`

```typescript
interface FacilitySearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  specialties: string[]; // from facilities.getSpecialties() endpoint
}

export function FacilitySearchBar({ onSearch, specialties }: FacilitySearchBarProps) {
  const [textSearch, setTextSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const handleChange = (filters: SearchFilters) => {
    // Debounce search (300ms) and call onSearch
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search facility name..."
        value={textSearch}
        onChange={(e) => handleChange({ textSearch: e.target.value, ... })}
      />
      <select 
        value={selectedSpecialty}
        onChange={(e) => handleChange({ specialty: e.target.value, ... })}
      >
        <option value="">All Specialties</option>
        {specialties.map(s => <option key={s}>{s}</option>)}
      </select>
      <label>
        <input 
          type="checkbox"
          checked={emergencyOnly}
          onChange={(e) => handleChange({ emergencyOnly: e.target.checked, ... })}
        />
        24/7 Emergency Services
      </label>
    </div>
  );
}
```

### 4. Frontend: Enhanced Facility Card

**Update:** `apps/nextjs/src/components/facilities/FacilitiesClient.tsx` facility card rendering

Add to each facility card:
- "📞 Book an Appointment" button → opens Cal.com modal (via callback to parent)
- Distance display: "X km away (5 min drive)"
- Star rating placeholder: "⭐⭐⭐⭐⭐ (Coming soon)"
- Badge: "✅ Recommended for your results" if from recommendByTestResults()
- Badge: "🚨 Urgent Care" if severity === 'HIGH'

### 5. Frontend: Map Marker Icons

**Update:** `apps/nextjs/src/components/facilities/FacilityMap.tsx`

```typescript
// Custom marker icons by facility type
const facilityIcons: Record<string, L.Icon> = {
  hospital: L.icon({ iconUrl: '/icons/hospital.png', ... }),
  clinic: L.icon({ iconUrl: '/icons/clinic.png', ... }),
  diagnostic_center: L.icon({ iconUrl: '/icons/diagnostic.png', ... }),
  // ...
};

// In marker rendering:
<Marker 
  position={[lat, lon]}
  icon={facilityIcons[facility.facilityType] || DefaultIcon}
>
  <Popup>
    <div>
      <h3>{facility.name}</h3>
      <button onClick={() => handleBooking(facility)}>
        📞 Book Now
      </button>
    </div>
  </Popup>
</Marker>
```

### 6. Integration: Test Results Context

**Update:** `apps/nextjs/src/components/facilities/FacilitiesClient.tsx`

```typescript
// On mount, check for test results from /scan page
useEffect(() => {
  const scanResult = sessionStorage.getItem('scanResult');
  if (scanResult) {
    const data = JSON.parse(scanResult);
    // Call facilities.recommendByTestResults() with extracted data
    const recommendations = await trpc.facilities.recommendByTestResults.mutate({
      extractedTests: data.extractedFields,
      latitude: coords[0],
      longitude: coords[1]
    });
    // Display recommendations prominently
  }
}, []);
```

### 7. Unit Tests

**Create:** `packages/api/src/router/__tests__/facilities-recommendations.test.ts`
- Test `recommendByTestResults()` with sample extracted test data
- Verify HIGH severity → urgent care prioritized
- Verify facility ranking by relevance

**Create:** `apps/nextjs/src/components/facilities/__tests__/FacilitySearchBar.test.tsx`
- Test text input triggers search
- Test specialty dropdown changes
- Test emergency toggle

**Create:** `apps/nextjs/src/components/facilities/__tests__/FacilityCard.test.tsx`
- Test "Book Now" button presence and click handler
- Test badge rendering (Recommended, Urgent Care)

---

## IMPLEMENTATION CHECKLIST

### Backend
- [ ] Create `packages/api/src/services/facilities.ts` with `generateFacilityRecommendation()`
- [ ] Update `packages/api/src/router/facilities.ts`:
  - [ ] Enhance `bestSuggested()` with medicalContext parameter
  - [ ] Add `recommendByTestResults()` endpoint
  - [ ] Update `searchNearby()` for text search & emergency filter
- [ ] Add facility validators to `packages/validators/src/`
- [ ] Add unit tests for new endpoints

### Frontend
- [ ] Create `FacilitySearchBar.tsx` component
- [ ] Update `FacilitiesClient.tsx` to use search bar and integrate test results
- [ ] Update facility card rendering with "Book Now" button and badges
- [ ] Update `FacilityMap.tsx` with custom icons and improved popups
- [ ] Add unit tests for new components
- [ ] Manual test: /facilities page → search → verify recommendations → book appointment

### Database (if needed)
- [ ] Add `emergencyService: boolean` column to facility table (if missing)
- [ ] Backfill data for existing facilities

---

## ARCHITECTURE PRINCIPLES

1. **LLM Integration:** All facility recommendation text should be generated by Gemini, not hardcoded
2. **Type Safety:** All inputs validated with Zod, outputs typed with TypeScript
3. **Performance:** Cache facility list, lazy-load map markers for 100+ results
4. **Accessibility:** ARIA labels on interactive elements, keyboard navigation on map
5. **Error Handling:** Graceful fallbacks if LLM fails (show template-based recommendation)
6. **Testing:** Unit tests for ranking logic, integration tests for full flow

---

## TESTING STRATEGY

1. **Unit Tests:** Test recommendation ranking algorithm, search filtering logic
2. **Component Tests:** Mock tRPC calls, verify UI interactions
3. **Manual Testing:**
   - Start Next.js: `pnpm run dev`
   - Navigate to `/facilities`
   - Search by text → verify results
   - Filter by specialty → verify results
   - Click facility → verify map focus + booking modal opens
   - From `/scan` page with test results → verify recommendations appear in /facilities

---

## SUCCESS CRITERIA

✅ LLM-generated facility recommendations appear on the map
✅ Text search and specialty filter work smoothly
✅ "Book Now" button opens Cal.com modal
✅ Facilities recommended based on test results when available
✅ Unit tests pass: `pnpm test` in packages/api and apps/nextjs
✅ No hydration errors or console warnings
✅ Map renders correctly with custom icons
✅ Performance: <500ms for facility search query

---

## RESOURCES & REFERENCES

- Facility router: `packages/api/src/router/facilities.ts`
- LLM service: `packages/api/src/services/llm.ts` (use `callLLMAPI()`)
- Existing validators: `packages/validators/src/`
- Frontend tRPC setup: `apps/nextjs/src/trpc/react.tsx`
- Map component: `apps/nextjs/src/components/facilities/FacilityMap.tsx`
- Database schema: `packages/db/src/schema.ts` (facility table)

---

## NEXT STEPS

1. **Implement backend first:** Services → endpoints → validators
2. **Test endpoints:** Use Postman or curl to verify responses
3. **Implement frontend:** Components → wire state → test interactions
4. **Integration test:** Full user flow from test results → facility booking
5. **Performance audit:** Check query times, map load times
6. **Accessibility audit:** Keyboard navigation, screen reader support

---

**Total Estimated Time:** 6-8 hours for complete implementation (Phase 1)
**Start Date:** [User's decision]
**Target Completion:** [User's target date]


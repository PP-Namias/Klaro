# Klaro Scan Analysis AI Agent Prompt

## Goal

Provide a focused AI agent prompt system that processes medical scan results (extracted test data), generates actionable clinical summaries, and produces patient-facing plain-language output suitable for display in the UI sidebar.

## System Architecture

### Logic Flow

```
1. Input Validation
   └─→ Check test data exists and is properly formatted

2. Context Building
   └─→ Gather patient context (age, sex, facility)
   └─→ Format test results with flagging information

3. Prompt Construction
   ├─→ System Prompt (clinical guidelines)
   └─→ User Prompt (patient-specific data)

4. LLM Processing
   ├─→ Call LLM API (OpenAI/Claude/Gemini)
   ├─→ Handle API failures gracefully
   └─→ Fall back to rule-based generation

5. Response Validation
   ├─→ Extract JSON from response
   ├─→ Validate schema compliance
   ├─→ Verify urgency levels
   └─→ Confirm recommendation count

6. Output Delivery
   ├─→ Return validated analysis
   ├─→ Include processing source (llm vs fallback)
   └─→ Timestamp for audit trail
```

## Usage

This prompt system is used server-side via the `analyzeScan()` service function:

```typescript
import { analyzeScan } from "@klaro/api/services/scan-analysis";

const result = await analyzeScan({
  extractedTests: [
    { name: "Hemoglobin A1c", value: "9.2", unit: "%", flagged: true },
    { name: "Fasting glucose", value: "210", unit: "mg/dL", flagged: true }
  ],
  patientAge: 45,
  patientSex: "female"
});

// Returns:
// {
//   success: true,
//   analysis: {
//     summary: "...",
//     urgency: "HIGH",
//     recommendations: ["...", "...", "..."]
//   },
//   source: "llm",
//   timestamp: "2026-05-08T..."
// }
```

## System Prompt

The system prompt guides the LLM to:

1. **Understand Role**: Clinical assistant for consumer health app
2. **Parse Input**: Lab test results with flagging metadata
3. **Generate Outputs**: Three structured JSON fields
4. **Follow Format**: Return ONLY valid JSON, no commentary

```
You are a clinical assistant for a consumer-facing health app. Your job is to interpret 
lab/extracted test results and produce JSON output.

You must return ONLY valid JSON with these exact keys:
- summary: plain-language summary (≤120 words)
- urgency: one of "LOW", "MODERATE", or "HIGH"
- recommendations: array of 1–3 action items (≤20 words each)

Guidelines:
1. SUMMARY: Explain in plain language, avoid jargon
2. URGENCY: Assess risk based on flagged results
3. RECOMMENDATIONS: Include specialties and timeline

Return ONLY JSON, no extra text.
```

## Input Schema

```typescript
interface ScanAnalysisInput {
  extractedTests: {
    name: string;          // Test name (e.g., "Hemoglobin A1c")
    value?: string;        // Test value (e.g., "9.2")
    unit?: string;         // Unit (e.g., "%")
    flagged?: boolean;     // Whether result is abnormal
  }[];
  patientAge?: number;     // Age in years (0-150)
  patientSex?: "male" | "female" | "other";
  facilityName?: string;   // Optional: facility context
}
```

## Output Schema

```typescript
interface AIScanAnalysis {
  summary: string;              // ≤500 chars, plain-language
  urgency: "LOW" | "MODERATE" | "HIGH";
  recommendations: string[];    // 1-3 items, ≤500 chars each
}

interface ScanAnalysisResult {
  success: boolean;
  analysis?: AIScanAnalysis;    // Present if success=true
  error?: string;               // Present if success=false
  source?: "llm" | "fallback";  // Processing source
  timestamp: string;            // ISO 8601
}
```

## Example Flow

### Input
```json
{
  "extractedTests": [
    { "name": "Hemoglobin A1c", "value": "9.2", "unit": "%", "flagged": true },
    { "name": "Fasting glucose", "value": "210", "unit": "mg/dL", "flagged": true },
    { "name": "Triglycerides", "value": "280", "unit": "mg/dL", "flagged": true }
  ],
  "patientAge": 45,
  "patientSex": "female"
}
```

### User Prompt (constructed from input)
```
Patient Context:
Age: 45 years old, Sex: Female

Test Results:
- Hemoglobin A1c: 9.2 % [FLAGGED]
- Fasting glucose: 210 mg/dL [FLAGGED]
- Triglycerides: 280 mg/dL [FLAGGED]

Please analyze these results and return ONLY the JSON response.
```

### LLM Response
```json
{
  "summary": "Your blood sugar readings are elevated, suggesting possible uncontrolled diabetes. Your triglycerides are also high, which increases cardiovascular risk. This combination warrants prompt medical evaluation. Please seek professional care within 2-3 days to discuss medication adjustments.",
  "urgency": "HIGH",
  "recommendations": [
    "Schedule appointment with Endocrinology within 2-3 days for medication review",
    "Seek immediate emergency care if experiencing chest pain, dizziness, or shortness of breath",
    "Avoid high-sugar and high-fat foods; monitor blood sugar at home if possible"
  ]
}
```

## Urgency Levels

| Level | Criteria | Examples |
|-------|----------|----------|
| **LOW** | No abnormal results or mild findings | Normal A1c, normal cholesterol |
| **MODERATE** | 1-2 abnormal results, manageable risk | Elevated glucose, high triglycerides |
| **HIGH** | 2+ abnormal results or acute risk indicators | Multiple critical values, signs of metabolic crisis |

## Fallback Strategy

When LLM API is unavailable or fails:

1. **No API Key**: Generate rule-based analysis from test flags
2. **API Error**: Log error, use fallback logic
3. **Invalid Response**: Validate JSON, use fallback if invalid
4. **Empty Response**: Switch to fallback mode

Fallback logic:
- Count flagged tests
- Determine urgency (0 flags = LOW, 1 flag = MODERATE, 2+ = HIGH)
- Generate safe, generic recommendations
- Include disclaimer about consulting provider

## Integration Points

### Frontend Consumer

```typescript
// In NextJS/SvelteKit app
const response = await trpc.documents.analyzeScanWithAI.mutate({
  extractedTests: testData,
  patientAge: 45,
  patientSex: "female"
});

if (response.success) {
  // Display analysis in sidebar
  sessionStorage.setItem("scanAnalysis", JSON.stringify(response.analysis));
  displaySummary(response.analysis.summary);
  displayUrgencyBadge(response.analysis.urgency);
  displayRecommendations(response.analysis.recommendations);
}
```

### UI Components

- **Summary Display**: Plain text, wrapped to 4-5 lines
- **Urgency Badge**: Color-coded (Green/Yellow/Red)
- **Recommendations**: Ordered list, clickable for details

## Service Implementation

File: `packages/api/src/services/scan-analysis.ts`

Key functions:
- `analyzeScan(input)`: Main orchestration function
- `buildSystemPrompt()`: Constructs system guidelines
- `buildUserPrompt(input)`: Formats patient data
- `validateAnalysis(data)`: Schema validation
- `generateFallbackAnalysis(input)`: Rule-based fallback
- `analyzeScanBatch(inputs)`: Process multiple batches

## Error Handling

| Scenario | Handling | Source |
|----------|----------|--------|
| No tests provided | Return error | Input validation |
| LLM API key missing | Use fallback | LLM service |
| API timeout | Use fallback | LLM service |
| Invalid JSON response | Use fallback | Response parsing |
| Schema validation fails | Use fallback | Output validation |

## Performance Considerations

- **Latency**: LLM calls typically 2-5 seconds
- **Fallback**: <500ms for rule-based generation
- **Caching**: Consider caching for repeated test patterns
- **Batch Processing**: Use `analyzeScanBatch()` for multiple patients

## Security & Privacy

- Prompts contain only de-identified test data
- No patient names or IDs in system prompt
- All processing occurs server-side
- Results validated before UI display
- Session storage for frontend caching

## Testing

See `packages/api/src/services/__tests__/scan-analysis.test.ts` for:

- Input validation tests
- Prompt construction tests
- JSON parsing tests
- Fallback behavior tests
- Schema validation tests
- Error handling tests

## Configuration

Environment variables (`.env`):

```bash
# LLM Provider Selection
LLM_PROVIDER=gemini              # gemini | openai | claude
LLM_API_KEY=your_api_key         # API key for chosen provider
LLM_MODEL=gemini-1.5-pro         # Model selection (optional)

# Fine-tuning
LLM_TEMPERATURE=0.7              # Response creativity (0-1)
LLM_MAX_TOKENS=1000              # Max output length
```

## Future Enhancements

1. **Multi-language Support**: Adapt prompts for Filipino, Bisaya, Ilocano
2. **Specialty-Specific Prompts**: Tailored for cardiology, endocrinology, etc.
3. **Confidence Scoring**: Return confidence level with analysis
4. **Explanation Generation**: Detailed explanation for each test
5. **Follow-up Recommendations**: Schedule next check-up dates
6. **Risk Scoring**: Quantified risk assessment
7. **Historical Trending**: Compare with patient's previous results

## References

- **API Endpoint**: `POST /api/trpc/documents.analyzeScanWithAI`
- **Service**: `packages/api/src/services/scan-analysis.ts`
- **Router**: `packages/api/src/router/documents.ts`
- **Validators**: `packages/validators/src/scan-analysis.ts`
- **LLM Service**: `packages/api/src/services/llm.ts`

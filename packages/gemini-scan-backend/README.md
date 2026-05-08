# Gemini Scan Backend (sample)

Simple Node/Express backend that accepts image uploads, calls a Gemini client (stubbed), and stores JSON results.

## Environment

- `GEMINI_API_KEY`: required for real Gemini calls.
- `GEMINI_MODEL`: defaults to `gemini-2.0-flash`.
- `MOCK_GEMINI=true`: forces local mock mode for tests.

Run:

```
cd packages/gemini-scan-backend
npm install
npm test
npm run postman:generate
npm run postman:test
npm start
```

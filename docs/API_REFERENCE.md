# API Endpoints Reference

## Document Management

### POST /api/documents/scan
Upload a document and trigger OCR + extraction pipeline.

**Request:**
```json
{
  "file": "multipart/form-data",
  "documentType": "lab_result|prescription|discharge_summary",
  "userId": "string (optional for guest)",
  "metadata": {
    "facility": "string",
    "dateCollected": "ISO8601"
  }
}
```

**Response:**
```json
{
  "documentId": "doc_xxx",
  "status": "processing|completed",
  "extractedData": {
    "tests": [
      {
        "name": "Hemoglobin",
        "value": 14.2,
        "unit": "g/dL",
        "referenceRange": { "low": 12, "high": 17.5 },
        "flag": "normal|high|low"
      }
    ],
    "summary": "Plain language explanation",
    "severity": "low|moderate|high",
    "tanongCard": ["Question 1", "Question 2", "Question 3"]
  }
}
```

**Related Tickets:** KL-DS-001, KL-DS-002, KL-OCR-001, KL-EX-001

---

### GET /api/documents/{documentId}
Retrieve a specific document and its analysis.

**Query Params:**
- `includeHistory`: boolean
- `dialect`: fil|bis|ilo

**Response:**
```json
{
  "documentId": "doc_xxx",
  "documentType": "lab_result",
  "uploadedAt": "ISO8601",
  "extractedData": { ... },
  "analysis": { ... },
  "shareLink": { "token": "...", "expiresAt": "ISO8601" }
}
```

---

### GET /api/documents/share/{shareToken}
Access a document via share link (no authentication required).

**Related Tickets:** KL-AUTH-001

---

## Chat & AI

### POST /api/chat
Send a message and get LLM-powered response with context.

**Request:**
```json
{
  "documentId": "doc_xxx",
  "message": "Can you explain this result?",
  "dialect": "fil|bis|ilo",
  "conversationId": "string (optional)"
}
```

**Response:**
```json
{
  "conversationId": "conv_xxx",
  "response": "Plain language response in requested dialect",
  "followUps": ["Suggested question 1", "Suggested question 2"],
  "severity": "low|moderate|high",
  "bookingCTA": "Doctor booking link (if high severity)"
}
```

**Related Tickets:** KL-CHAT-001, KL-LOC-001, KL-LLM-001

---

## Facilities & Locations

### GET /api/facilities/nearby
Find nearby clinics and hospitals based on coordinates or specialty.

**Query Params:**
```
latitude: number
longitude: number
radiusKm: number (default 5)
specialty: string (optional)
philHealth: boolean (optional, default false)
openNow: boolean (optional)
limit: number (default 20)
```

**Response:**
```json
{
  "facilities": [
    {
      "id": "fac_xxx",
      "name": "St. Luke's Medical Center",
      "type": "hospital|clinic",
      "latitude": 14.6349,
      "longitude": 121.0382,
      "distance": 2.3,
      "specialties": ["General Medicine", "Cardiology"],
      "philHealthAccredited": true,
      "operatingHours": { "mon": "08:00-20:00" },
      "phone": "+63-2-1234-5678",
      "address": "..."
    }
  ]
}
```

**Related Tickets:** KL-MAP-001, KL-MAP-002

---

## Doctor Management

### GET /api/doctors
List available doctors with filtering.

**Query Params:**
```
specialty: string
priceRange: "budget|standard|premium"
availabilityDate: ISO8601
limit: number
```

**Response:**
```json
{
  "doctors": [
    {
      "id": "dr_xxx",
      "name": "Dr. Maria Santos",
      "specialty": "Internal Medicine",
      "prcVerified": true,
      "prcLicense": "123456",
      "rating": 4.8,
      "sessionPrice": 500,
      "sessionTypes": ["chat", "video", "async_review"],
      "availability": [
        {
          "date": "2026-05-04",
          "slots": ["10:00", "14:00", "16:30"]
        }
      ],
      "profileImage": "https://..."
    }
  ]
}
```

**Related Tickets:** KL-DR-001

---

### POST /api/bookings
Create a booking appointment with a doctor.

**Request:**
```json
{
  "doctorId": "dr_xxx",
  "documentId": "doc_xxx",
  "sessionType": "chat|video|async_review",
  "proposedDateTime": "ISO8601",
  "userId": "user_xxx (optional for guest)"
}
```

**Response:**
```json
{
  "bookingId": "bk_xxx",
  "status": "pending|paid|confirmed|completed",
  "doctor": { ... },
  "sessionType": "chat",
  "scheduledAt": "ISO8601",
  "totalAmount": 500,
  "platformFee": 50,
  "paymentRequired": true
}
```

**Related Tickets:** KL-BK-001

---

## Payments

### POST /api/payments/intent
Create a Stripe PaymentIntent for booking confirmation.

**Request:**
```json
{
  "bookingId": "bk_xxx",
  "amount": 550,
  "currency": "PHP"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "status": "requires_payment_method"
}
```

**Related Tickets:** KL-PAY-001

---

### POST /api/payments/webhook
Stripe webhook to confirm payment and update booking.

**Header:** `stripe-signature`

**Payload:** Stripe Event
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Related Tickets:** KL-PAY-001

---

## Authentication & User Accounts

### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "acceptHistory": true|false
}
```

**Related Tickets:** KL-AUTH-002

---

### POST /api/auth/share-link
Generate a shareable link for guest uploads.

**Request:**
```json
{
  "documentId": "doc_xxx",
  "expiryDays": 30
}
```

**Response:**
```json
{
  "shareLink": "https://klaro.app/share/token_xxx",
  "token": "token_xxx",
  "expiresAt": "ISO8601"
}
```

**Related Tickets:** KL-AUTH-001

---

## Observability

### POST /api/telemetry/events
Emit events for analytics and monitoring.

**Request:**
```json
{
  "eventType": "ocr_complete|chat_message|booking_confirmed",
  "documentId": "doc_xxx (optional)",
  "userId": "user_xxx (optional)",
  "metadata": { "ocrConfidence": 0.95, "processingTimeMs": 1250 }
}
```

**Related Tickets:** KL-OBS-001

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 422  | Validation Error |
| 429  | Rate Limited |
| 500  | Server Error |
| 503  | Service Unavailable |

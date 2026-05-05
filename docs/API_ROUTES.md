# Klaro API Routes

This document summarizes the backend contracts for the three frontend routes that now have working backend support.

## `GET /api/auth/signin`

Starts OAuth for the selected provider.

### Query parameters

- `provider`: `discord` or `google`

### OAuth responses

- `302`: Redirects to the OAuth provider
- `400`: Invalid provider

### Example request

`GET /api/auth/signin?provider=discord`

## `POST /api/auth/logout`

Clears the current session.

### Logout security

- `BearerAuth`

### Responses

- `200`: Session cleared
- `401`: Not authenticated

### Logout example response

```json
{
  "success": true,
  "message": "Session cleared. You have been logged out."
}
```

## `GET /api/auth/session`

Returns the current authenticated user.

### Session security

- `BearerAuth`

### Response fields

- `id`: UUID
- `email`: email address
- `name`: display name
- `emailVerified`: boolean

### Example response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true
}
```

## `POST /api/documents/scan`

Uploads a medical document, validates it, stores it, and queues analysis.

### Security

- `BearerAuth`

### Request

- `multipart/form-data`
- `file` required
- `dialect` optional: `Filipino`, `Bisaya`, `Ilocano`

### Accepted files

- JPEG
- PNG
- WebP
- PDF
- Max size: 50MB

### Scan responses

- `201`: Document uploaded and queued
- `400`: Missing file or invalid file type
- `401`: Not authenticated
- `413`: File too large

### Scan example response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "analysisId": "4b2670d5-3b7f-4a7a-8f27-9e5b9f40d25a",
  "status": "uploaded",
  "message": "Document received. Processing will begin shortly.",
  "fileName": "scan.jpg",
  "fileSize": 1024
}
```

## `POST /api/trpc/facilities.searchNearby`

Searches nearby facilities from a user location.

### Input

- `latitude` required, range `-90` to `90`
- `longitude` required, range `-180` to `180`
- `radiusKm` optional, default `10`, range `0.1` to `50`
- `limit` optional, default `20`, range `1` to `100`
- `facilityType` optional
- `ownership` optional
- `philHealthOnly` optional, default `false`

### Facilities responses

- `200`: Array of nearby facilities sorted by distance
- `400`: Invalid coordinates

### Facilities example request

```json
{
  "latitude": 14.5995,
  "longitude": 120.9842,
  "radiusKm": 10,
  "limit": 20,
  "philHealthOnly": true
}
```

### Example response item

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Philippine General Hospital",
  "facilityType": "hospital",
  "address": "Taft Ave, Manila",
  "latitude": 14.5809,
  "longitude": 120.9821,
  "distance": 2.1,
  "phoneNumber": "+63 2 8554 8400",
  "isPhilHealthAccredited": true,
  "acceptedSpecialties": ["Internal Medicine", "Cardiology"],
  "openingHours": {
    "monday": "08:00-17:00"
  }
}
```

## Swagger notes

- Protected routes use `BearerAuth`
- The OpenAPI spec lives at `apps/nextjs/public/openapi.yaml`
- The spec now includes auth, upload, and facility route contracts with error responses and examples

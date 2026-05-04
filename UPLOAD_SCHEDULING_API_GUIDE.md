# Klaro Uploads & Scheduling API - Deployment & Testing Guide

## Overview

This document provides step-by-step instructions for testing and deploying the Cloudinary upload and Cal.com scheduling integration endpoints.

## Endpoints

### 1. **Cloudinary Signing Endpoint**
- **Route**: `GET /api/uploads/sign`
- **Purpose**: Returns signed Cloudinary parameters for client-side direct upload
- **Response**:
  ```json
  {
    "apiKey": "YOUR_CLOUD_ID",
    "cloudName": "YOUR_CLOUD_NAME",
    "timestamp": 1618884477,
    "signature": "signed_hash",
    "uploadPreset": null
  }
  ```
- **Test via Swagger**: Visit `/api/docs` → Click "Cloudinary Signing Endpoint" → Try it out

### 2. **Server-Side Upload Endpoint**
- **Route**: `POST /api/uploads/server`
- **Purpose**: Upload file directly to Cloudinary and persist to DB
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` (required): Binary file (JPEG, PNG, WebP, PDF; max 50MB)
  - `userId` (optional): User ID for attribution
- **Response**:
  ```json
  {
    "id": "uuid",
    "userId": "user_id or guest",
    "fileName": "document.pdf",
    "url": "https://res.cloudinary.com/...",
    "mimeType": "application/pdf",
    "size": 12345,
    "createdAt": "2026-05-05T10:00:00Z"
  }
  ```
- **Test via Swagger**: Visit `/api/docs` → Click "Server Upload" → Fill file field → Execute

### 3. **Get Upload Metadata**
- **Route**: `GET /api/uploads/:id`
- **Purpose**: Retrieve stored document metadata
- **Response**: Same as server upload response
- **Test via Swagger**: Provide ID from server upload response

### 4. **Cal.com Scheduling Link Creation**
- **Route**: `POST /api/scheduling/create`
- **Purpose**: Generate a Cal.com booking link
- **Request Body**:
  ```json
  {
    "eventTypeId": "cal_event_id",
    "userName": "doctor_name"
  }
  ```
- **Response**:
  ```json
  {
    "url": "https://cal.com/doctor_name/event_id",
    "bookingPage": "https://api.cal.com/api/v2/event-types/event_id?apiKey=..."
  }
  ```

### 5. **Cal.com Webhook Receiver**
- **Route**: `POST /api/scheduling/webhook`
- **Purpose**: Receive booking confirmation events from Cal.com
- **Expected Payload**:
  ```json
  {
    "eventId": "cal_event_id",
    "eventTitle": "Doctor Consultation",
    "startTime": "2026-05-10T14:00:00Z",
    "endTime": "2026-05-10T15:00:00Z",
    "attendees": [...]
  }
  ```

## Environment Configuration

### Local Development

1. **Copy `.env.example` to `.env`**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in Cloudinary credentials**:
   ```
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   CLOUDINARY_UPLOAD_PRESET=""  # Leave empty for signed uploads
   ```

3. **Fill in Cal.com credentials**:
   ```
   CAL_COM_API_KEY="your-cal-com-api-key"
   CAL_COM_BASE_URL="https://api.cal.com"
   ```

4. **Get Cloudinary Credentials**:
   - Visit [Cloudinary Console](https://cloudinary.com/console)
   - Navigate to Account Settings → API Keys
   - Copy Cloud Name, API Key, and API Secret

5. **Get Cal.com Credentials**:
   - Visit [Cal.com](https://cal.com)
   - Go to Settings → API Keys
   - Create a new API key

### Vercel Deployment

1. **Set Environment Variables**:
   ```bash
   vercel env add CLOUDINARY_CLOUD_NAME
   vercel env add CLOUDINARY_API_KEY
   vercel env add CLOUDINARY_API_SECRET
   vercel env add CLOUDINARY_UPLOAD_PRESET
   vercel env add CAL_COM_API_KEY
   vercel env add CAL_COM_BASE_URL
   vercel env add POSTGRES_URL
   vercel env add AUTH_SECRET
   ```

2. **Deploy**:
   ```bash
   vercel deploy --prod
   ```

3. **Verify Deployment**:
   ```bash
   curl https://<your-domain>.vercel.app/api/uploads/sign
   curl https://<your-domain>.vercel.app/api/docs
   ```

## Testing Workflow

### Via Swagger UI (Recommended)

1. **Start Dev Server**:
   ```bash
   cd apps/nextjs
   pnpm dev
   ```

2. **Open Swagger UI**:
   - Navigate to `http://localhost:3000/api/docs`

3. **Test Sign Endpoint**:
   - Click "Cloudinary Signing Endpoint"
   - Click "Try it out"
   - Click "Execute"
   - Verify response contains apiKey, cloudName, timestamp, signature

4. **Test Server Upload**:
   - Click "Server Upload"
   - Click "Try it out"
   - Attach a test file (JPEG/PNG/WebP/PDF)
   - Optionally provide userId
   - Click "Execute"
   - Verify response contains id, url (Cloudinary secure_url), etc.

5. **Test Get Metadata**:
   - Click "Get Upload Metadata"
   - Paste the ID from the previous response
   - Click "Execute"
   - Verify response matches the upload

### Via cURL

```bash
# Test sign endpoint
curl http://localhost:3000/api/uploads/sign

# Test server upload
curl -X POST http://localhost:3000/api/uploads/server \
  -F "file=@/path/to/file.pdf" \
  -F "userId=test-user"

# Test get metadata
curl http://localhost:3000/api/uploads/{id-from-previous-response}

# Test Cal.com create
curl -X POST http://localhost:3000/api/scheduling/create \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": "test-event",
    "userName": "doctor"
  }'
```

## Troubleshooting

### Cloudinary Upload Fails
- **Issue**: "CLOUDINARY_CLOUD_NAME not configured"
- **Solution**: Ensure `.env` file contains all Cloudinary variables
- **Check**: `echo $CLOUDINARY_CLOUD_NAME` in terminal

### File Validation Errors
- **Error**: "Invalid file type"
- **Solution**: Ensure file is JPEG, PNG, WebP, or PDF
- **Check**: `file /path/to/file` to verify MIME type

### Database Persistence Fails
- **Issue**: "Internal server error" on upload
- **Solution**: Verify `POSTGRES_URL` is set in `.env`
- **Check**: `pnpm -F @klaro/db push` to ensure schema is migrated

### CORS Errors
- **Issue**: "Access denied" from browser
- **Solution**: All endpoints include `Access-Control-Allow-Origin: *`
- **Check**: Browser DevTools → Network tab → Response headers

## Performance & Security Considerations

1. **File Size**: Limited to 50MB per request
2. **File Types**: Only JPEG, PNG, WebP, PDF allowed
3. **API Secrets**: Stored server-side only, never exposed in frontend
4. **Database**: Uses parametrized queries to prevent SQL injection
5. **CORS**: Enabled for all endpoints (configure as needed for production)

## Next Steps

1. **Integration Testing**: Add Vitest + Supertest tests for all endpoints
2. **Monitoring**: Set up error logging and analytics
3. **Rate Limiting**: Implement rate limiting for production
4. **Webhook Validation**: Validate Cal.com webhook signatures
5. **Database Tracking**: Enhance webhook handler to persist booking events

## Deployment Checklist

- [ ] All env vars set in `.env` and verified locally
- [ ] `pnpm -w run typecheck` passes
- [ ] `pnpm -w run lint` passes
- [ ] Swagger UI visible at `/api/docs`
- [ ] All endpoints respond with correct status codes
- [ ] Cloudinary test upload succeeds
- [ ] File size and type validation works
- [ ] Database persistence confirmed
- [ ] Environment vars configured in Vercel
- [ ] Deployed to Vercel and tested
- [ ] Monitoring/alerting configured

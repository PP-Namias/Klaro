# Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### API Not Responding
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:**
```bash
# 1. Check if backend is running
lsof -i :3001

# 2. Start backend if not running
cd packages/api
npm run dev

# 3. Verify database connection
DATABASE_URL="postgresql://..." npm run db:validate

# 4. Check environment variables
echo $DATABASE_URL
echo $OPENAI_API_KEY
```

#### Database Connection Failed
```
Error: connect ECONNREFUSED localhost:5432
```

**Solution:**
```bash
# 1. Check PostgreSQL status
psql -U postgres -c "SELECT 1"

# 2. If using Neon, verify connection string
DATABASE_URL="postgresql://user:pass@host:5432/klaro" npm run db:validate

# 3. Reset connection pool
redis-cli flushall

# 4. Recreate local database
dropdb klaro_dev
createdb klaro_dev
npx prisma migrate reset
```

#### OCR Returning Low Confidence
```
OCR Confidence: 0.45 (threshold 0.70)
```

**Debugging:**
```typescript
// Add to OCR service temporarily
console.log('Image analysis:');
console.log('- Format:', file.type);
console.log('- Size:', file.size);
console.log('- Dimensions:', image.width, 'x', image.height);

// Test with known-good image
const testResult = await processImage(goodTestImage);
console.log('Test OCR confidence:', testResult.confidence);
```

**Solutions:**
1. **Blurry image:** Ensure lighting is adequate, camera is steady
2. **Rotated document:** Implement auto-rotation before OCR
3. **Wrong language:** Check language pack detection
4. **Try Google Vision fallback:**
   ```bash
   FALLBACK_TO_GOOGLE_VISION=true npm run dev
   ```

#### LLM Timeouts (API calls taking >10s)
```
Error: OpenAI API timeout after 10000ms
```

**Solutions:**
```bash
# 1. Check API key validity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# 2. Reduce context size
# In LLM service, trim document to first 2000 tokens instead of all

# 3. Use faster model
# Change from gpt-4-turbo to gpt-3.5-turbo for testing

# 4. Add timeout retry logic
MAX_LLM_RETRIES=3 npm run dev
```

### Web Frontend Issues

#### Build Errors
```
error TS2345: Argument of type 'string | undefined' is not assignable
```

**Solution:**
```bash
# 1. Clear build cache
rm -rf .next
npm run build

# 2. Check TypeScript configuration
npx tsc --noEmit

# 3. Update types if using new packages
npm install --save-dev @types/react@latest
```

#### API Calls Failing with 404
```
TypeError: Failed to fetch http://localhost:3001/api/trpc/documents.scan
```

**Solutions:**
```bash
# 1. Verify backend is running on correct port
curl http://localhost:3001/api/health

# 2. Check NEXT_PUBLIC_API_URL in .env.local
cat .env.local | grep API_URL

# 3. CORS issue? Check backend CORS config
# Should allow: http://localhost:3000

# 4. Network tab in DevTools
# Check if request is being made and what error is returned
```

#### Chat Messages Not Displaying
```
Chat component renders but no messages appear
```

**Debug steps:**
```typescript
// Add to ChatComponent temporarily
useEffect(() => {
  console.log('Messages state:', messages);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);
}, [messages, isLoading, error]);

// Check TanStack Query cache
const { data, isPending, error } = useQuery({
  queryKey: ['chat', conversationId],
  queryFn: () => getChatHistory(conversationId)
});

if (error) console.error('Chat fetch error:', error.message);
```

### Mobile Issues

#### Camera Not Working on iOS
```
Error: Camera permissions not granted
```

**Solution:**
```typescript
// Check Info.plist permissions
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan medical documents</string>

// Request permission explicitly
import { Camera } from 'expo-camera';
const { status } = await Camera.requestCameraPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Camera permission required');
}
```

#### Build Failing on Android
```
error: task ':app:compileDebugJavaWithJavac' failed
```

**Solution:**
```bash
# 1. Clean build cache
cd android
./gradlew clean
cd ..

# 2. Clear Expo cache
npx expo prebuild --clean

# 3. Update Android SDK
# Use Android Studio SDK Manager

# 4. Try build again
eas build --platform android
```

#### Image Upload Slow/Fails
```
Upload stuck at 50%, then fails with timeout
```

**Solutions:**
1. **Enable resumable uploads:**
   ```typescript
   const result = await uploadWithResume(file, {
     chunkSize: 1024 * 1024, // 1MB chunks
     maxRetries: 3
   });
   ```

2. **Compress image before upload:**
   ```typescript
   const compressed = await compressImage(image, {
     maxWidth: 1200,
     maxHeight: 1200,
     quality: 0.85
   });
   ```

3. **Check network connection:**
   ```typescript
   import NetInfo from '@react-native-community/netinfo';
   const state = await NetInfo.fetch();
   if (!state.isConnected) {
     Alert.alert('No internet connection');
   }
   ```

## Performance Issues

### Slow Page Load
```
First Contentful Paint: 4.2s (target: <2s)
```

**Optimization:**
```bash
# 1. Analyze bundle size
npm run build:analyze

# 2. Check Core Web Vitals
npm run lighthouse

# 3. Enable code splitting
// pages/documents/[id].tsx
export const getServerSideProps = async () => {
  // Lazy load heavy components
};

# 4. Implement image optimization
<Image
  src={imagePath}
  alt="analysis"
  width={1024}
  height={768}
  placeholder="blur"
  priority={false}
/>
```

### Chat Response Slow
```
User types question -> 5 second delay before response
```

**Debug:**
```bash
# 1. Check LLM call duration in Datadog
datadog metrics | grep llm_latency

# 2. Check database query performance
SLOW_QUERY_LOG=true npm run dev

# 3. Cache frequently used queries
redis.set('doc:' + docId, documentData, 'EX', 3600);

# 4. Reduce context size sent to LLM
// From 4000 tokens to 1000 tokens
const contextLength = Math.min(extraction.length, 1000);
```

## Authentication Issues

### Session Expired, User Logged Out Unexpectedly
```
Redirect to login page: session expired
```

**Solutions:**
```bash
# 1. Check JWT token expiration
# Should be 24 hours for web, 30 days for mobile

# 2. Verify refresh token logic
# Refresh token endpoint should return new JWT

# 3. Check browser cookies
# Dev Tools > Application > Cookies
# Look for: next-auth.session-token

# 4. Clear session and retry
// In browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### Cannot Login - "Invalid Credentials"
```
Error: Email not found in database
```

**Solutions:**
```bash
# 1. Check user exists in database
psql $DATABASE_URL -c "SELECT * FROM \"User\" WHERE email='test@example.com'"

# 2. Verify password hashing
# Password should be bcrypt, not plaintext

# 3. Check auth provider configuration
# Google OAuth? Ensure redirect URI matches

# 4. Reset user password
UPDATE "User" SET password = '$2b$10$...' WHERE email = 'test@example.com';
```

## Data Issues

### Missing Documents After Upload
```
Document uploaded, but doesn't appear in list
```

**Debugging:**
```bash
# 1. Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Document\""

# 2. Check if userId matches
SELECT * FROM "Document" WHERE "userId" = 'current-user-id'

# 3. Verify encryption/decryption works
// Test encrypt/decrypt roundtrip

# 4. Check upload logs
tail -f /var/log/klaro-upload.log
```

### Corrupted Encrypted Data
```
Error: Decryption failed - tag verification failed
```

**Solutions:**
```bash
# 1. Don't try to decrypt manually
# Use only official decrypt function with proper IV and tag

# 2. Re-encrypt document with fresh IV
UPDATE "Document" 
SET "encryptedData" = encrypt_aes256(raw_data, new_key),
    "encryptionIV" = new_iv
WHERE id = 'doc-id'

# 3. Verify key hasn't changed
echo $AES_256_KEY | base64 -d | wc -c  # Should be 32 bytes
```

## Monitoring & Alerting

### Setting Up Alerts

**Email alert for errors:**
```bash
# Configure in Datadog/Sentry
- Error rate > 1% -> Email ops team
- API latency p95 > 500ms -> Slack notification
- Database connection pool exhausted -> PagerDuty alert
```

### Log Aggregation

```bash
# View recent errors
axiom dataset query klaro-errors --sort timestamp desc --limit 100

# Filter by severity
axiom dataset query klaro-logs --where level='ERROR' --limit 50

# Search for specific error
axiom dataset query klaro-logs --where message contains 'timeout'
```

## Getting Help

1. **Check documentation first:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
2. **Search error message:** Copy error and search GitHub issues
3. **Run diagnostics:**
   ```bash
   npm run diagnose
   # Outputs: Node version, DB connection, API status, etc.
   ```
4. **Ask in team Slack:** #engineering-support
5. **File issue with logs:**
   ```bash
   npm run export:logs > logs.txt
   # Attach to GitHub issue
   ```

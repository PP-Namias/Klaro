# Development Workflow & Standards

## Branch Naming Convention

Use ticket-based branches for traceability:

```
ticket/KL-DS-001-mobile-camera-capture
ticket/KL-OCR-001-tesseract-integration
ticket/KL-PAY-001-stripe-implementation
```

**Format:** `ticket/[TICKET-ID]-[feature-description]`

## Commit Message Standards

**Use plain, descriptive messages (no `feat:`, `chore:`, `fix:` prefixes)**

### Good Examples
```
Implement mobile camera capture with edge detection

- Add Expo camera integration
- Implement edge detection using OpenCV.js
- Add auto-crop with 90% accuracy target
- Connect to /api/documents/scan endpoint
- Add resumable upload support for large files
```

```
Extract and normalize medical test values

- Parse OCR text using regex patterns
- Map test names to canonical forms
- Validate against reference ranges
- Flag abnormal values with severity levels
```

```
Add Stripe payment webhook handler

- Create webhook endpoint at /api/webhooks/stripe
- Verify webhook signature
- Update booking status on payment_intent.succeeded
- Emit accounting telemetry events
```

### Bad Examples (DON'T DO THESE)
```
feat: add camera                    ❌ Too vague
chore: update dependencies          ❌ Use prefix
fix: bug                           ❌ Not descriptive
WIP: camera work                   ❌ Incomplete
Updated file                       ❌ No context
```

## Commit Organization

**One ticket = Multiple related commits**

Example workflow for KL-DS-001 (Mobile camera capture):
```
Commit 1: Add Expo camera integration and permissions
Commit 2: Implement edge detection and auto-crop preprocessing
Commit 3: Add local image compression and format detection
Commit 4: Connect camera output to upload service
Commit 5: Add resumable upload with retry logic
```

**Guidelines:**
- Each commit should be "atomic" - one logical change
- Commits should compile and tests should pass individually
- Group related changes (not one giant commit per ticket)
- Each commit message clearly describes what and why

## Pull Request Process

### 1. Create PR with template

```markdown
## Ticket
Closes #KL-DS-001

## Description
Implement mobile camera capture with edge detection and auto-crop preprocessing.

## Changes
- Added Expo Camera integration with permission handling
- Implemented edge detection using computer vision
- Auto-crops document to 4 edges with >=90% accuracy
- Connects to /api/documents/scan endpoint
- Includes resumable upload for reliability

## Testing
- [x] Camera capture works on iOS/Android
- [x] Edge detection accuracy >=90% on real documents
- [x] Upload succeeds with 5MB+ files
- [x] Retry works when network drops

## Screenshots/Demo
[Video showing camera capture -> upload flow]

## Deployment Notes
- Requires expo-camera package upgrade
- No database migrations needed
```

### 2. Code Review Checklist

Reviewer should verify:
- [ ] Code follows patterns in implementation guide
- [ ] Tests are included and passing
- [ ] No console.log or debug code left
- [ ] Environment variables are documented
- [ ] Security: no secrets in code, SQL injection protected
- [ ] Performance: no N+1 queries, large bundle increases
- [ ] Accessibility: WCAG AA on web, text sizes on mobile
- [ ] Error handling: proper error messages and logging

### 3. Approval & Merge

- Minimum 1 approval from maintainer
- All tests passing in CI/CD
- No merge conflicts
- Deployment instructions clear
- PR squashed to single commit before merge (optional based on team preference)

## Code Style

### TypeScript

Use `tsconfig.json` strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

Example:
```typescript
// ✅ GOOD: Types are explicit
function processDocument(file: File, options: ProcessOptions): Promise<Result> {
  // ...
}

// ❌ BAD: Any types, missing types
function processDocument(file: any, options?: any) {
  // ...
}
```

### React Components

```typescript
// ✅ GOOD: Proper typing and exports
interface CameraViewProps {
  onCapture: (image: Image) => Promise<void>;
  maxSize?: number;
  enabled?: boolean;
}

export function CameraView({
  onCapture,
  maxSize = 10,
  enabled = true
}: CameraViewProps) {
  // ...
}

// ❌ BAD: No prop typing
export function CameraView(props) {
  // ...
}
```

### API Endpoints (tRPC)

```typescript
// ✅ GOOD: Input validation, explicit return type
export const documentsRouter = router({
  scan: publicProcedure
    .input(scanInputSchema)
    .mutation(async ({ input }): Promise<ScanResult> => {
      // ...
    })
});

// ❌ BAD: No input validation
export const documentsRouter = router({
  scan: publicProcedure
    .mutation(async ({ input }) => {
      // ...
    })
});
```

## Testing Requirements

### Unit Tests
- All utility functions must have unit tests
- Target: 80%+ code coverage
- Test both success and error paths

### Integration Tests
- API endpoints must have integration tests
- Database operations tested with fixtures
- External service mocks in place

### E2E Tests
- Critical user flows (signup, upload, booking)
- Run after deployment to staging
- Test data cleaned up after each run

### Run Tests Before Commit
```bash
npm run test              # Unit tests
npm run test:coverage    # Check coverage
npm run lint            # TypeScript + ESLint
npm run build           # Build verification
```

## Performance Considerations

### Bundle Size
- Don't add new dependencies without discussion
- Check bundle impact: `npm run build:analyze`
- Target: Main bundle <200KB

### Database Queries
- Use `.select()` to avoid fetching unused fields
- Implement pagination for large result sets
- Add indexes for frequently queried fields
- Use `include` judiciously (can cause N+1 queries)

### API Calls
- Implement request caching with 5-60 minute TTL
- Batch similar requests
- Add timeout defaults (5-10 seconds)
- Retry failed requests with exponential backoff

### Images
- Compress before upload (target: <500KB)
- Use WebP for web, JPEG for mobile
- Lazy load images below the fold
- Responsive images with srcset

## Documentation Requirements

For each feature/ticket:
1. Update relevant implementation guide
2. Add code examples in docstrings
3. Document environment variables if needed
4. Add to API reference if new endpoint
5. Update QUICK_REFERENCE.md AI prompts section

## Deployment Pipeline

### Pre-Deployment
```bash
# 1. Ensure all tests pass
npm run test && npm run test:coverage

# 2. Build locally to verify
npm run build

# 3. Check for any secrets
git diff HEAD~1 | grep -iE "secret|password|key|token"

# 4. Verify environment variables
echo $DATABASE_URL $STRIPE_SECRET_KEY
```

### Staging Deployment
```bash
git checkout main
git pull origin main

# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:e2e:staging

# Check logs
axiom dataset query klaro-staging-logs --limit 50
```

### Production Deployment
```bash
# Tag release
git tag v1.0.1
git push origin v1.0.1

# Deploy to production
npm run deploy:prod

# Verify critical endpoints
curl https://api.klaro.ph/api/health/ready
curl https://klaro.ph

# Monitor for errors
# Set up alerts in Datadog
# Check on-call status page
```

## Troubleshooting Workflow

**When you see an error:**

1. **Reproduce locally**
   ```bash
   # Use production environment if possible
   ENVIRONMENT=prod npm run dev
   ```

2. **Check logs**
   ```bash
   # For local
   npm run dev 2>&1 | grep ERROR
   
   # For production
   axiom dataset query klaro-logs --where level='ERROR'
   ```

3. **Search codebase**
   ```bash
   # Find where error is thrown
   grep -r "Error message" --include="*.ts" --include="*.tsx"
   ```

4. **Check recent changes**
   ```bash
   # See what changed
   git log --oneline -10
   git diff HEAD~1
   ```

5. **Isolate the issue**
   - Add console.log or debugger statements
   - Create minimal reproduction
   - Test in isolation

6. **Fix and test**
   ```bash
   npm run test
   npm run test:integration
   npm run test:e2e
   ```

7. **Document the lesson**
   - Add to TROUBLESHOOTING.md if common
   - Update this guide if workflow insight
   - Share with team in #incidents channel

## Tools & Commands Quick Reference

```bash
# Development
npm run dev                    # Start all services
npm run dev:mobile            # Mobile only
npm run dev:web              # Web only
npm run dev:backend          # Backend only

# Testing
npm run test                  # Unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests

# Code Quality
npm run lint                # Check TypeScript + ESLint
npm run format              # Auto-fix formatting
npm run build              # Build all packages
npm run build:analyze      # Bundle size analysis

# Database
npm run db:migrate          # Apply migrations
npm run db:reset           # Drop and recreate (dev only)
npm run db:seed            # Seed test data
npm run db:studio          # Open Prisma Studio

# Deployment
npm run deploy:staging      # Deploy to staging
npm run deploy:prod        # Deploy to production
npm run deploy:mobile      # Build mobile app

# Diagnostics
npm run diagnose            # System health check
npm run logs:export        # Export logs for analysis
npm run perf:analyze        # Analyze performance
```

## Key Principles

1. **Consistency** - Follow patterns established in codebase
2. **Clarity** - Code should be readable without comments
3. **Testability** - Design for easy unit testing
4. **Security** - No secrets in code, validate all inputs
5. **Performance** - Measure before optimizing, avoid premature optimization
6. **Documentation** - Document why, not just what
7. **Communication** - Clear commit messages and PR descriptions

## Getting Unstuck

If you're stuck:
1. Check TROUBLESHOOTING.md
2. Review implementation guide for your role
3. Look at similar working code in codebase
4. Ask in #engineering-help Slack channel
5. Pair program with team member
6. Create minimal reproduction and share

Remember: **It's better to ask early than to burn hours debugging!**

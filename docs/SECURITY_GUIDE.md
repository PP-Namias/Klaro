# Security Implementation Guide

## Overview
Klaro handles PHI (Protected Health Information) and requires enterprise-grade security. All data in transit uses TLS 1.3; sensitive data at rest uses AES-256-GCM encryption.

## Encryption at Rest (KL-SEC-001)

### AES-256-GCM Implementation

All encrypted fields use the same pattern:

```typescript
// utils/crypto.ts
import crypto from 'crypto';

export const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keySize: 32, // 256 bits
  ivSize: 16,  // 128 bits
  tagSize: 16  // 128 bits
};

export async function encryptData(plaintext: string): Promise<{ iv: string; data: string; tag: string }> {
  const key = Buffer.from(process.env.AES_256_KEY!, 'base64');
  const iv = crypto.randomBytes(encryptionConfig.ivSize);
  
  const cipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('base64'),
    data: encrypted,
    tag: authTag.toString('base64')
  };
}

export async function decryptData(
  encrypted: string,
  iv: string,
  tag: string
): Promise<string> {
  const key = Buffer.from(process.env.AES_256_KEY!, 'base64');
  const decipher = crypto.createDecipheriv(
    encryptionConfig.algorithm,
    key,
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Encrypted Fields:**
- Document.encryptedData (extracted OCR results)
- User passwords (hashed via bcrypt, never stored plaintext)
- API keys in environment (never committed to repo)

### Key Management

```bash
# Generate AES-256 key (32 bytes = 256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Output: lkj2klj3lkj2lk3jlk2j3lk2j3lkj2l3k2jlk3j2lk3j2lk=

# Add to .env
echo "AES_256_KEY=lkj2klj3lkj2lk3jlk2j3lk2j3lkj2l3k2jlk3j2lk3j2lk=" >> .env.local
```

**Key Rotation (annual):**
1. Generate new key
2. Re-encrypt all existing documents with new key
3. Update AES_256_KEY environment variable
4. Retire old key after 30-day transition period

## Authentication & Authorization

### NextAuth.js Configuration (KL-AUTH-002)

```typescript
// packages/auth/src/index.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    CredentialsProvider({
      async authorize(credentials) {
        // Validate email/password
        const user = await db.user.findUnique({
          where: { email: credentials?.email }
        });
        
        if (user && await bcrypt.compare(credentials?.password, user.password)) {
          return { id: user.id, email: user.email, name: user.name };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.acceptedHistory = user.acceptHistory;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.acceptedHistory = token.acceptedHistory;
      return session;
    }
  },
  pages: {
    signIn: '/auth/login'
  }
};
```

### Guest Mode (KL-AUTH-001)

```typescript
// Share documents via temporary token
export const shareRouter = router({
  generateShareLink: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const doc = await db.document.findUnique({
        where: { id: input.documentId }
      });
      
      if (doc?.userId !== ctx.user.id) {
        throw new Error('Not authorized');
      }
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      await db.shareLink.create({
        data: {
          documentId: input.documentId,
          token,
          expiresAt
        }
      });
      
      return {
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`,
        expiresAt
      };
    }),

  // Guest access
  getSharedDocument: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const link = await db.shareLink.findUnique({
        where: { token: input.token }
      });
      
      if (!link || link.expiresAt < new Date()) {
        throw new Error('Link expired');
      }
      
      // Update access tracking
      await db.shareLink.update({
        where: { id: link.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date()
        }
      });
      
      return await db.document.findUnique({
        where: { id: link.documentId }
      });
    })
});
```

## API Security

### Rate Limiting (per IP, per user)

```typescript
// middleware/rateLimit.ts
import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});

export const rateLimitMiddleware = async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const key = `rate:${ip}`;
  const limit = 100; // requests
  const window = 60; // seconds
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  if (count > limit) {
    return new Response('Too many requests', { status: 429 });
  }
};
```

### CORS Configuration

```typescript
// apps/nextjs/next.config.js
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_API_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600'
};
```

### Webhook Signature Verification (KL-PAY-001)

```typescript
// routers/payments.ts
export async function verifyStripeWebhook(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    throw new Error('Invalid webhook signature');
  }
}
```

## Secrets Management

### Environment Variables (Never Committed)

```bash
# .env.local (add to .gitignore)
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/klaro
REDIS_URL=redis://localhost:6379
AES_256_KEY=base64-encoded-key

# Auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# APIs
OPENAI_API_KEY=sk-...
GOOGLE_VISION_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### GitHub Secrets (for CI/CD)

```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Security Checklist

### Development
- [ ] Never commit .env files
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Validate all user inputs (Zod schemas)
- [ ] Use parameterized queries (Prisma)
- [ ] Hash passwords with bcrypt (min 10 rounds)

### Data Protection
- [ ] Encrypt PHI at rest (AES-256-GCM)
- [ ] Encrypt in transit (TLS 1.3+)
- [ ] Implement field-level encryption for sensitive data
- [ ] Regular key rotation (annual)
- [ ] Secure key backup to HSM or managed service

### API Security
- [ ] Enable rate limiting
- [ ] Validate CORS headers
- [ ] Verify webhook signatures
- [ ] Use short-lived JWT tokens (15 min)
- [ ] Implement refresh token rotation
- [ ] Add request logging/audit trail

### Deployment
- [ ] Use managed database (Neon) with encryption
- [ ] Enable VPC isolation
- [ ] Use Web Application Firewall (WAF)
- [ ] Enable DDoS protection
- [ ] Regular security audits (quarterly)
- [ ] Penetration testing (annual)

## Compliance

### PHI Requirements
- HIPAA-like data protection
- Patient consent tracking
- Audit logging (who accessed what, when)
- 90-day data retention policy

### Implementation
```typescript
// Log all PHI access
export async function logAudit(action: string, userId: string, documentId: string) {
  await db.auditLog.create({
    data: {
      action,
      userId,
      documentId,
      timestamp: new Date(),
      ip: getClientIp(),
      userAgent: getUserAgent()
    }
  });
}
```

## Incident Response

**If security breach occurs:**
1. Immediately revoke all active sessions
2. Force password reset for affected users
3. Rotate all API keys
4. Notify users within 24 hours
5. File incident report
6. Post-mortem within 7 days

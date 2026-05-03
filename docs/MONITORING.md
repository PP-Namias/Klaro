# Observability & Monitoring Guide

## Overview
Klaro collects metrics, logs, and traces to monitor health, debug issues, and optimize performance.

## Logging Strategy

### Log Levels

| Level | When | Example |
|-------|------|---------|
| DEBUG | Development, detailed flow | "OCR confidence: 0.92" |
| INFO | Important events | "Document uploaded: doc-123" |
| WARN | Unexpected but recoverable | "API timeout, using cached result" |
| ERROR | Request failed, retry needed | "OCR failed with confidence 0.3" |
| FATAL | Service broken, immediate action | "Database connection lost" |

### Structured Logging

```typescript
// middleware/logging.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: '/var/log/klaro.log',
      mkdir: true
    }
  }
});

export function logRequest(req: Request, context: any) {
  logger.info({
    method: req.method,
    path: req.url,
    userId: context.user?.id,
    timestamp: new Date().toISOString(),
    duration: context.duration,
    status: context.status
  }, 'API Request');
}

export function logError(error: Error, context: any) {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  }, 'Application Error');
}
```

### Log Aggregation (Axiom)

```bash
# Query logs
axiom dataset query klaro-logs --where status='ERROR' --limit 100

# Export logs
axiom dataset export klaro-logs --format json > export.json

# Set up alerts
axiom alert create --dataset klaro-logs --condition "count > 10" --notify slack
```

## Metrics & Observability

### Key Metrics (KL-OBS-001)

```typescript
// services/telemetry.ts
import { StatsD } from 'node-statsd';

const statsd = new StatsD({
  host: process.env.STATSD_HOST,
  port: 8125
});

export const telemetry = {
  // Document processing
  recordOCRLatency: (ms: number) => statsd.timing('ocr.latency', ms),
  recordOCRConfidence: (score: number) => statsd.gauge('ocr.confidence', score * 100),
  recordExtractionAccuracy: (pct: number) => statsd.gauge('extraction.accuracy', pct),
  
  // Chat
  recordChatLatency: (ms: number) => statsd.timing('chat.latency', ms),
  recordDialectDetected: (dialect: string) => statsd.increment(`chat.dialect.${dialect}`),
  
  // Booking
  recordBookingCreated: () => statsd.increment('bookings.created'),
  recordPaymentProcessed: (amount: number) => statsd.gauge('payments.amount', amount),
  
  // API
  recordAPICall: (route: string, status: number, duration: number) => {
    statsd.timing(`api.${route}.latency`, duration);
    statsd.increment(`api.${route}.${status}`);
  },
  
  // Database
  recordDBQuery: (query: string, duration: number) => {
    statsd.timing(`db.query.latency`, duration);
    statsd.increment(`db.query.${query}`);
  }
};
```

### Dashboards

**Datadog Dashboard:**

```yaml
# dashboard.yaml
title: Klaro Platform Monitor
widgets:
  - type: timeseries
    title: API Latency (p95)
    metrics:
      - query: avg:api.latency{*}
  
  - type: number
    title: Error Rate (%)
    metrics:
      - query: (sum:api.status.5xx{*} / sum:api.status.all{*}) * 100
  
  - type: heatmap
    title: OCR Confidence Distribution
    metrics:
      - query: histogram:ocr.confidence{*}
  
  - type: timeseries
    title: Active Users
    metrics:
      - query: avg:users.active{*}
  
  - type: timeseries
    title: Database Query Performance
    metrics:
      - query: avg:db.query.latency{*}
        label: "Avg Latency"
      - query: max:db.query.latency{*}
        label: "Max Latency"
```

## Distributed Tracing

### OpenTelemetry Configuration

```typescript
// instrumentation.ts
import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-trace-jaeger';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT
});

const tracerProvider = new NodeTracerProvider();
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));

registerInstrumentations({
  tracerProvider
});

tracerProvider.register();
```

### Trace Example

```typescript
// services/documents.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('documents-service');

export async function processDocument(file: File) {
  const span = tracer.startSpan('processDocument');
  
  try {
    span.addEvent('ocrStart');
    const ocrResult = await processOCR(file);
    span.addEvent('ocrComplete', { confidence: ocrResult.confidence });
    
    span.addEvent('extractionStart');
    const extracted = await extractData(ocrResult);
    span.addEvent('extractionComplete');
    
    span.addEvent('llmStart');
    const summary = await generateSummary(extracted);
    span.addEvent('llmComplete');
    
    return { ocrResult, extracted, summary };
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

## Alerts & Thresholds

### Critical Alerts

```yaml
# alerts.yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    threshold_duration: 5m
    action: page_oncall
    
  - name: API Latency High
    condition: p95_latency > 500ms
    threshold_duration: 10m
    action: notify_slack
    
  - name: Database Connection Pool Exhausted
    condition: db_connections > 95%
    threshold_duration: 1m
    action: page_oncall
    
  - name: OCR Quality Degradation
    condition: ocr_confidence < 0.75
    threshold_duration: 30m
    action: notify_engineering
    
  - name: Payment Processing Failure
    condition: payment_error_rate > 2%
    threshold_duration: 5m
    action: page_oncall
    
  - name: Authentication Service Down
    condition: auth_latency > 2000ms
    threshold_duration: 2m
    action: page_oncall
```

## SLA & Performance Targets

| Service | SLA | p99 Latency | Error Rate |
|---------|-----|-------------|-----------|
| Document Upload | 99.5% | <5s | <0.5% |
| OCR Processing | 99.0% | <10s | <1% |
| Chat Response | 99.0% | <3s | <0.5% |
| Doctor Booking | 99.5% | <500ms | <0.2% |
| Payments | 99.9% | <200ms | <0.1% |
| Authentication | 99.9% | <200ms | <0.1% |

## Health Checks

### Liveness Endpoint
```typescript
// routers/health.ts
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});
```

### Readiness Endpoint
```typescript
// routers/health.ts
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    services: await checkExternalServices()
  };
  
  const ready = Object.values(checks).every(c => c === true);
  res.status(ready ? 200 : 503).json(checks);
});
```

### Monitoring Endpoint
```bash
# Check service health
curl http://localhost:3001/health/live
# Response: { "status": "ok" }

curl http://localhost:3001/health/ready
# Response: { "database": true, "redis": true, "services": true }
```

## Incident Response

### On-Call Runbook

**When alert fires:**
1. Check dashboard for context
2. Query recent logs for errors
3. Check traces for failure point
4. Is it infrastructure or code issue?
5. Escalate if unclear

**Example Response:**
```bash
# Alert: High Error Rate
# 1. Check dashboard
axiom dashboard klaro-platform

# 2. Query errors
axiom dataset query klaro-logs --where level='ERROR' --limit 50

# 3. Check recent deployments
git log --oneline -10

# 4. Check metrics
# API latency? Database? Third-party service?

# 5. Remediate
# If new deployment caused it, rollback
# If database issue, check connections
# If third-party, check their status page
```

## Capacity Planning

### Growth Projections

**Year 1:**
- Users: 1K → 10K
- Documents: 5K → 50K
- Daily API calls: 50K → 500K

**Infrastructure needs:**
- Current: Single DB instance, 1GB RAM backend
- Month 3: Read replicas for database
- Month 6: Multiple backend instances
- Month 12: Kubernetes cluster

### Scaling Triggers

When to scale:
- [ ] CPU > 80% for 30 minutes
- [ ] Memory > 85% for 30 minutes
- [ ] Database connections > 90%
- [ ] Request latency p95 > 500ms
- [ ] Error rate > 1%

**Auto-scaling rules:**
```yaml
# kubernetes
deployment:
  replicas: 2-10
  autoscaling:
    targetCPUUtilization: 75%
    targetMemoryUtilization: 80%
```

## Compliance & Audit Logs

### PHI Access Logging

```typescript
// Audit trail for all document access
export async function logAudit(action: string, userId: string, resourceId: string) {
  await db.auditLog.create({
    data: {
      action,           // read, write, delete, share
      userId,           // Who performed action
      resourceId,       // Document ID, User ID, etc
      resourceType,     // document, user, booking
      timestamp: new Date(),
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      result: 'success', // success, failure
      metadata: {}      // Additional context
    }
  });
}
```

### Audit Reports

```bash
# Export audit logs for compliance review
axiom dataset export audit-logs --format csv > audit_2024_q1.csv

# Search for specific user activity
axiom dataset query audit-logs --where userId='user-123' --sort timestamp

# Find all access to sensitive documents
axiom dataset query audit-logs --where resourceType='document' AND resourceId='doc-456'
```

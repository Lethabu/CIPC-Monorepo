# Phase 3: Transaction-Ready Workflow Deployment

## Overview

Phase 3 implements the complete automated annual returns filing workflow with payment integration, Temporal orchestration, and CIPC automation.

## Architecture

```
Typebot Lead Capture
    ↓
Payment Processing (Ozow/PayFast)
    ↓
Cloudflare Worker (Payment Webhook)
    ↓
Temporal Workflow Trigger
    ↓
CIPC Runner (Docker + Playwright)
    ├── CAPTCHA Solving (2Captcha)
    ├── Form Automation
    └── Status Updates (AISensy)
```

## Prerequisites

### Services Required
- **Cloudflare Workers**: Already deployed in Phase 2
- **Temporal Server**: For workflow orchestration
- **2Captcha Account**: For CAPTCHA solving
- **Ozow/PayFast**: For payment processing
- **AISensy**: For WhatsApp messaging (already configured)

### API Keys Needed
```bash
# 2Captcha for CAPTCHA solving
TWOCAPTCHA_API_KEY=your-2captcha-key

# Ozow/PayFast for payments
OZOW_API_KEY=your-ozow-key
PAYFAST_MERCHANT_ID=your-merchant-id

# Temporal (if self-hosted)
TEMPORAL_ADDRESS=your-temporal-server:7233
```

## 1. Deploy CIPC Runner Service

### Build and Push Docker Image

```bash
cd apps/cipc-runner

# Build the image
docker build -t cipc-runner:latest .

# Tag for your registry
docker tag cipc-runner:latest your-registry/cipc-runner:latest

# Push to registry
docker push your-registry/cipc-runner:latest
```

### Deploy to Cloud Run (Google)

```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: cipc-runner
spec:
  template:
    spec:
      containers:
      - image: your-registry/cipc-runner:latest
        env:
        - name: TEMPORAL_ADDRESS
          value: "temporal-server:7233"
        - name: TWOCAPTCHA_API_KEY
          valueFrom:
            secretKeyRef:
              name: cipc-secrets
              key: twocaptcha-api-key
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
        startupProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Deploy to Railway/Fly.io

```bash
# Using Fly.io
fly launch --dockerfile Dockerfile --env TEMPORAL_ADDRESS=temporal.fly.dev:7233
```

## 2. Set Up Temporal Server

### Option A: Temporal Cloud (Recommended)

```bash
# Sign up at https://temporal.io/cloud
# Get your namespace and credentials

export TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
export TEMPORAL_NAMESPACE=your-namespace
export TEMPORAL_CERT_PATH=/path/to/cert.pem
export TEMPORAL_KEY_PATH=/path/to/key.pem
```

### Option B: Self-Hosted Temporal

```yaml
# docker-compose.yml
version: '3.8'
services:
  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"
      - "8233:8233"
    environment:
      - DB=postgresql
      - POSTGRES_USER=temporal
      - POSTGRES_PASSWORD=temporal
      - POSTGRES_DB=temporal
    depends_on:
      - postgresql

  postgresql:
    image: postgres:13
    environment:
      - POSTGRES_USER=temporal
      - POSTGRES_PASSWORD=temporal
      - POSTGRES_DB=temporal
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## 3. Configure Payment Integration

### Ozow Setup

```bash
# Create payment link generator
# Add to your Cloudflare Worker

async function generatePaymentLink(amount, reference, customerInfo) {
  const ozowConfig = {
    siteCode: process.env.OZOW_SITE_CODE,
    privateKey: process.env.OZOW_PRIVATE_KEY,
    apiKey: process.env.OZOW_API_KEY,
    bankRef: reference,
    amount: amount,
    currency: 'ZAR',
    customer: customerInfo
  };

  // Generate Ozow payment URL
  const paymentUrl = await generateOzowUrl(ozowConfig);
  return paymentUrl;
}
```

### PayFast Setup

```bash
# PayFast integration
const payfastConfig = {
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,
  return_url: `${process.env.APP_URL}/payment/success`,
  cancel_url: `${process.env.APP_URL}/payment/cancel`,
  notify_url: `${process.env.WORKER_URL}/api/webhooks/payment`
};
```

## 4. Update Typebot Flow

### Add Payment Step

1. **After lead capture**, add a payment presentation step
2. **Show pricing**: "Annual Returns Filing - R199"
3. **Generate payment link** dynamically
4. **Redirect to payment** or show QR code
5. **Webhook triggers** on payment completion

### Typebot Configuration

```json
{
  "blocks": [
    {
      "type": "text",
      "content": "Great! Your annual returns filing fee is R199. Click below to complete payment:"
    },
    {
      "type": "button",
      "content": "Pay R199 Now",
      "url": "https://pay.ozow.com/ABC123-{{resultId}}"
    }
  ],
  "webhooks": [
    {
      "url": "https://cipc-dashboard.workers.dev/api/webhooks/typebot",
      "method": "POST",
      "triggers": ["form_submission"]
    }
  ]
}
```

## 5. Connect Payment to Workflow

### Update Cloudflare Worker

```typescript
// In payment webhook handler
if (paymentData.status === 'completed') {
  // Trigger Temporal workflow
  await triggerFilingWorkflow({
    companyNumber: leadData.company_number,
    companyName: leadData.company_name,
    financialYearEnd: leadData.financial_year_end,
    contactEmail: leadData.email,
    contactPhone: leadData.phone,
    paymentReference: paymentData.transaction_id
  });
}
```

### Temporal Workflow Integration

```python
# In Cloudflare Worker (pseudo-code)
async def triggerFilingWorkflow(filingData):
    from temporalio.client import Client

    client = await Client.connect(os.getenv('TEMPORAL_ADDRESS'))
    await client.start_workflow(
        'AnnualReturnsWorkflow',
        filingData,
        id=f"filing-{filingData['paymentReference']}",
        task_queue='cipc-filing-queue'
    )
```

## 6. Test End-to-End Flow

### Test Checklist

- [ ] **Lead Capture**: Typebot collects all required information
- [ ] **Payment Link**: Generates correct Ozow/PayFast URL
- [ ] **Payment Processing**: Webhook receives payment confirmation
- [ ] **Workflow Trigger**: Temporal workflow starts
- [ ] **CIPC Automation**: Browser automation navigates to CIPC
- [ ] **CAPTCHA Solving**: 2Captcha successfully solves challenges
- [ ] **Form Submission**: All fields filled and submitted
- [ ] **Status Updates**: WhatsApp messages sent at each step
- [ ] **Completion**: Success confirmation with reference numbers

### Manual Testing

```bash
# Test CIPC Runner API
curl -X POST http://localhost:8000/api/filing/start \
  -H "Content-Type: application/json" \
  -d '{
    "company_registration_number": "2021/123456/07",
    "company_name": "Test Company Pty Ltd",
    "financial_year_end": "2024-02-28",
    "contact_email": "test@example.com",
    "contact_phone": "+27821234567",
    "payment_reference": "TEST-123"
  }'

# Check status
curl http://localhost:8000/api/filing/filing_123/status
```

## 7. Monitoring and Scaling

### Health Checks

```bash
# CIPC Runner health
curl https://cipc-runner.your-domain.com/health

# Temporal UI
open https://your-temporal-server:8233

# Cloudflare Worker logs
wrangler tail
```

### Scaling Considerations

#### Horizontal Scaling
- Deploy multiple CIPC Runner instances
- Use Temporal's built-in load balancing
- Implement queue-based processing

#### Resource Limits
```yaml
# Kubernetes resource limits
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "4Gi"
```

#### Rate Limiting
- Implement CAPTCHA API rate limiting
- Add delays between filings to avoid detection
- Monitor 2Captcha usage and costs

## 8. Security and Compliance

### Data Protection
- Encrypt sensitive filing data at rest
- Use HTTPS for all communications
- Implement proper access controls

### Audit Trail
- Log all filing attempts and outcomes
- Store screenshots securely for compliance
- Maintain payment-filing correlation

### Error Handling
- Implement retry logic for failed filings
- Alert on CAPTCHA solving failures
- Manual intervention workflows for edge cases

## 9. Go-Live Checklist

- [ ] **Domain Setup**: Configure custom domain
- [ ] **SSL Certificates**: Ensure HTTPS everywhere
- [ ] **Monitoring**: Set up alerts and dashboards
- [ ] **Backup**: Configure database backups
- [ ] **Documentation**: Update user guides
- [ ] **Support**: Train support team on processes
- [ ] **Legal Review**: Confirm compliance requirements
- [ ] **Load Testing**: Test with realistic traffic
- [ ] **Rollback Plan**: Prepare emergency procedures

## Cost Optimization

### Free Tiers Utilized
- **Cloudflare Workers**: 100K requests/day
- **Temporal Cloud**: Generous free tier
- **2Captcha**: Pay-per-solve pricing

### Paid Services Budget
- **2Captcha**: ~$1-2 per 1000 CAPTCHAs
- **AISensy**: Volume-based WhatsApp pricing
- **Ozow/PayFast**: Transaction-based fees
- **Temporal Cloud**: Predictable scaling costs

## Troubleshooting

### Common Issues

1. **Workflow Timeouts**
   - Increase Temporal activity timeouts
   - Check network connectivity to CIPC

2. **CAPTCHA Failures**
   - Monitor 2Captcha balance
   - Implement fallback manual solving

3. **Browser Crashes**
   - Increase Docker memory limits
   - Monitor system resources

4. **Payment Webhooks**
   - Verify webhook signatures
   - Implement idempotency checks

## Success Metrics

- **Conversion Rate**: Leads to completed filings
- **Success Rate**: Successful CIPC submissions
- **Processing Time**: Average filing completion time
- **Customer Satisfaction**: WhatsApp response ratings
- **System Reliability**: Uptime and error rates

---

**Phase 3 Complete**: The CIPC Agent now has a fully automated, transaction-ready annual returns filing system with payment processing, workflow orchestration, and comprehensive automation.

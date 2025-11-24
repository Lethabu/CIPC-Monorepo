# CIPC Agent Phase 3 Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete CIPC Agent Phase 3 system, including automated annual returns filing with payment processing.

## Architecture

```
Typebot Lead Capture → Cloudflare Worker → Ozow Payment → CIPC Runner → WhatsApp Updates
```

## Prerequisites

### Required Accounts & Services
- **Cloudflare Account**: For Workers and Pages
- **Typebot Account**: For lead capture forms
- **Ozow Account**: For payment processing
- **AISensy Account**: For WhatsApp messaging
- **2Captcha Account**: For CAPTCHA solving
- **Docker Registry**: Docker Hub, Google Container Registry, etc.
- **Cloud Platform**: Google Cloud Run, AWS ECS, Fly.io, etc.

### Required API Keys
```bash
# Ozow Payment Processing
OZOW_SITE_CODE=your_ozow_site_code
OZOW_PRIVATE_KEY=your_ozow_private_key
OZOW_API_KEY=your_ozow_api_key

# WhatsApp Messaging
AISENSY_API_KEY=your_aisensy_api_key
AISENSY_BASE_URL=https://api.aisensy.com

# CAPTCHA Solving
TWOCAPTCHA_API_KEY=your_2captcha_api_key

# Temporal Workflow (if using self-hosted)
TEMPORAL_ADDRESS=your_temporal_server:7233
```

## 1. Environment Setup

### Clone and Setup Repository
```bash
git clone https://github.com/Lethabu/CIPC-Monorepo.git
cd CIPC-Monorepo
pnpm install
```

### Configure Environment Variables
```bash
# Copy environment templates
cp .env.example .env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/cipc-runner/.env.example apps/cipc-runner/.env

# Edit with your actual values
nano .env
```

## 2. Deploy Cloudflare Infrastructure

### Deploy Dashboard Backend (Cloudflare Workers)
```bash
cd apps/dashboard

# Set secrets
npx wrangler secret put OZOW_SITE_CODE
npx wrangler secret put OZOW_PRIVATE_KEY
npx wrangler secret put OZOW_API_KEY
npx wrangler secret put AISENSY_API_KEY

# Deploy
npx wrangler deploy
```

### Deploy Frontend (Cloudflare Pages)
```bash
cd apps/cipc-mfe

# Set Typebot ID
npx wrangler pages deployment tail
npx wrangler pages secrets put NEXT_PUBLIC_TYPEBOT_ID

# Deploy
npm run deploy
```

## 3. Deploy CIPC Runner Service

### Option A: Google Cloud Run (Recommended)
```bash
cd apps/cipc-runner

# Set environment variables
export GCP_PROJECT=your-project-id
export GCR_REGION=us-central1

# Authenticate
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/$GCP_PROJECT/cipc-runner:latest .
docker push gcr.io/$GCP_PROJECT/cipc-runner:latest

# Deploy
gcloud run deploy cipc-runner \
  --image gcr.io/$GCP_PROJECT/cipc-runner:latest \
  --platform managed \
  --region $GCR_REGION \
  --cpu 2 \
  --memory 4Gi \
  --min-instances 1 \
  --max-instances 10 \
  --port 8000 \
  --allow-unauthenticated \
  --set-env-vars "ENV=production" \
  --set-env-vars "HEADLESS=true" \
  --set-secrets "TWOCAPTCHA_API_KEY=twocaptcha-key:latest" \
  --set-secrets "TEMPORAL_ADDRESS=temporal-address:latest" \
  --timeout 900 \
  --concurrency 1
```

### Option B: AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker build -t cipc-runner .
docker tag cipc-runner:latest your-account.dkr.ecr.us-east-1.amazonaws.com/cipc-runner:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/cipc-runner:latest

# Deploy using AWS Copilot or ECS CLI
# (Detailed AWS deployment instructions in deploy-aws.sh)
```

### Option C: Fly.io
```bash
cd apps/cipc-runner

# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch --dockerfile Dockerfile --env ENV=production
```

## 4. Set up Temporal Server (Optional)

If not using Temporal Cloud, set up a self-hosted Temporal server:

```bash
# Using Docker Compose
cd apps/cipc-runner
docker-compose up -d temporal

# Or use Temporal Helm chart on Kubernetes
helm install temporal temporal/temporal \
  --namespace temporal \
  --create-namespace
```

## 5. Configure Typebot Integration

1. **Create Typebot Flow**:
   - Go to [typebot.io](https://typebot.io)
   - Create variables: `name`, `email`, `phone`, `company`, `service`
   - Add webhook to: `https://your-worker.workers.dev/api/webhooks/typebot`

2. **Update Payment Links**:
   - The system now generates dynamic Ozow payment links
   - No manual configuration needed

## 6. Configure Payment Processing

### Ozow Setup
1. **Get API Credentials** from Ozow dashboard
2. **Set Webhook URL** in Ozow to: `https://your-worker.workers.dev/api/webhooks/payment`
3. **Test Payment Flow** with small amounts

### Payment Flow
```
Lead → Typebot → Ozow Payment Link → Payment → Webhook → Filing → WhatsApp Updates
```

## 7. Testing & Validation

### Run End-to-End Tests
```bash
# Test the complete system
./test-phase3.sh

# Test individual components
curl https://your-cipc-runner.com/health
curl https://your-worker.workers.dev/api/health
```

### Manual Testing Checklist
- [ ] Typebot form submission works
- [ ] Payment link generation works
- [ ] Ozow payment processing works
- [ ] Webhook triggers filing process
- [ ] WhatsApp messages are sent
- [ ] Filing status can be checked
- [ ] Screenshots are captured

## 8. Monitoring & Maintenance

### Set up Monitoring
```bash
# Prometheus metrics
curl https://your-cipc-runner.com/metrics

# Cloudflare Analytics
# Check Workers and Pages dashboards

# Logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=cipc-runner"
```

### Health Checks
- **CIPC Runner**: `/health` endpoint
- **Cloudflare Worker**: `/api/health` endpoint
- **Database**: Connection checks
- **External APIs**: Ozow, AISensy, 2Captcha

## 9. Production Optimization

### Performance Tuning
```yaml
# Cloud Run settings for production
cpu: 2
memory: 4Gi
min-instances: 2
max-instances: 50
concurrency: 1
timeout: 900s
```

### Cost Optimization
- Use Cloud Run's CPU allocation optimization
- Set appropriate min/max instances
- Monitor and adjust based on usage
- Use reserved instances for steady traffic

### Security Measures
- API key rotation
- IP whitelisting for webhooks
- Rate limiting
- Input validation
- Secure secret management

## 10. Troubleshooting

### Common Issues

**CIPC Runner won't start**:
```bash
# Check logs
gcloud logs read "resource.type=cloud_run_revision"

# Check environment variables
gcloud run services describe cipc-runner --region=us-central1
```

**Payment webhooks failing**:
```bash
# Verify Ozow configuration
curl -X POST https://your-worker.workers.dev/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Filing process stuck**:
```bash
# Check CIPC Runner logs
curl https://your-cipc-runner.com/api/filing/{id}/status

# Check screenshots
# Screenshots are saved in the container logs
```

### Support Contacts
- **Ozow**: support@ozow.com
- **AISensy**: support@aisensy.com
- **2Captcha**: support@2captcha.com
- **Cloudflare**: support.cloudflare.com

## 11. Backup & Recovery

### Database Backups
```bash
# For SQLite (development)
cp cipc_runner.db cipc_runner.db.backup

# For production databases, use cloud provider backup tools
```

### Configuration Backup
```bash
# Backup environment variables
env | grep -E "(OZOW|AISENSY|TWOCAPTCHA|TEMPORAL)" > secrets.backup
```

## Success Metrics

Monitor these KPIs for system health:

- **Conversion Rate**: Leads → Completed payments
- **Success Rate**: Payments → Successful filings
- **Processing Time**: Payment → Filing completion
- **Error Rate**: Failed filings / total filings
- **User Satisfaction**: WhatsApp response ratings

## Cost Breakdown

### Monthly Costs (Estimated)
- **Cloud Run**: $50-200 (based on usage)
- **Cloudflare Workers**: Free tier (100K requests)
- **Ozow**: Transaction fees (2.9% + R1.50)
- **AISensy**: R0.50-1.50 per message
- **2Captcha**: $1-2 per 1000 CAPTCHAs
- **Temporal Cloud**: $50-200 (if not self-hosted)

---

**Deployment Complete!** 🎉

Your CIPC Agent Phase 3 system is now live with automated annual returns filing, payment processing, and comprehensive workflow orchestration.

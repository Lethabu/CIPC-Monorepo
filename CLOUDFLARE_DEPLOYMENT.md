# Cloudflare Deployment Guide

## Phase 2: Minimum Viable Funnel Deployment

This guide covers deploying the CIPC Agent funnel to Cloudflare's free tier infrastructure.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Typebot Account**: Create at [typebot.io](https://typebot.io)
4. **AISensy Account**: Get API credentials from AISensy

## 1. Deploy CIPC MFE to Cloudflare Pages

### Configure Wrangler
```bash
cd apps/cipc-mfe
wrangler auth login
```

### Deploy to Cloudflare Pages
```bash
# Deploy the landing page
wrangler pages deploy .next --project-name cipc-mfe

# Or use the deployment script
npm run deploy
```

### Set Environment Variables
```bash
# Set the Typebot ID for your bot
wrangler pages deployment tail
wrangler pages secrets put NEXT_PUBLIC_TYPEBOT_ID
# Enter your Typebot ID when prompted
```

## 2. Deploy Dashboard Backend to Cloudflare Workers

### Configure Worker
```bash
cd apps/dashboard
wrangler auth login

# Set secrets
wrangler secret put AISENSY_API_KEY
# Enter your AISensy API key

wrangler secret put AISENSY_BASE_URL
# Enter: https://api.aisensy.com
```

### Deploy Worker
```bash
# Deploy the backend
wrangler deploy

# Or use the deployment script
npm run deploy:worker
```

### Get Worker URL
After deployment, note the worker URL (e.g., `https://cipc-dashboard.your-subdomain.workers.dev`)

## 3. Configure Typebot Integration

### Create Typebot Flow
1. Go to [typebot.io](https://typebot.io) and create a new bot
2. Design your lead capture flow with these variables:
   - `name` (Text input)
   - `email` (Email input)
   - `phone` (Phone input)
   - `company` (Text input)
   - `service` (Choice: Annual Returns, etc.)

### Configure Webhook
1. In Typebot, go to Settings → Webhooks
2. Add webhook URL: `https://cipc-dashboard.your-subdomain.workers.dev/api/webhooks/typebot`
3. Set method to POST
4. Configure webhook to trigger on form completion

## 4. Test the Funnel

### Test Locally First
```bash
# Test the landing page
cd apps/cipc-mfe
npm run dev

# Test the backend worker
cd apps/dashboard
npm run dev:worker
```

### Test End-to-End
1. Visit your Cloudflare Pages URL
2. Fill out the Typebot form
3. Check that you receive a WhatsApp message
4. Verify webhook logs in Cloudflare dashboard

## 5. Monitor and Scale

### Cloudflare Dashboard
- **Pages Analytics**: Monitor landing page traffic
- **Workers Analytics**: Track API usage and performance
- **Logs**: Debug webhook processing

### Free Tier Limits
- **Pages**: 500 builds/month, unlimited bandwidth
- **Workers**: 100,000 requests/day
- **D1**: 500MB database (when enabled)
- **Queues**: 1M messages/month (when enabled)

## Troubleshooting

### Common Issues

1. **Typebot not loading**: Check `NEXT_PUBLIC_TYPEBOT_ID` environment variable
2. **Webhook failures**: Verify AISensy API credentials
3. **CORS errors**: Check worker CORS configuration
4. **Build failures**: Ensure all dependencies are installed

### Debug Commands
```bash
# Check worker logs
wrangler tail

# Test webhook endpoint
curl -X POST https://your-worker.workers.dev/api/webhooks/typebot \
  -H "Content-Type: application/json" \
  -d '{"variables":[{"name":"name","value":"Test User"}],"resultId":"test"}'
```

## Cost Optimization

### Free Tier Strategy
- Use Cloudflare Pages for static frontend
- Leverage Workers for serverless backend
- Implement D1 for data storage (when needed)
- Use Queues for webhook buffering

### Scaling Considerations
- Monitor usage in Cloudflare dashboard
- Set up billing alerts before hitting limits
- Consider paid plans for high-traffic scenarios

## Security Best Practices

1. **Environment Variables**: Never commit secrets to code
2. **CORS**: Configure appropriate CORS policies
3. **Rate Limiting**: Implement rate limiting in workers
4. **Input Validation**: Validate all webhook data
5. **HTTPS Only**: All endpoints use HTTPS by default

## Next Steps

Once deployed and tested:
1. Set up custom domain
2. Configure monitoring and alerts
3. Implement payment integration (Phase 3)
4. Add analytics tracking
5. Set up CI/CD pipelines

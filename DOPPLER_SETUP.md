# Doppler Secrets Management Setup

## Overview
This guide explains how to set up Doppler for secure secrets management in the CIPC-Agent monorepo.

## Prerequisites
- Doppler CLI installed (`npm install -g @dopplerhq/cli`)
- Doppler account and project created

## Setup Steps

### 1. Install Doppler CLI
```bash
npm install -g @dopplerhq/cli
```

### 2. Authenticate with Doppler
```bash
doppler login
```

### 3. Create Doppler Project
```bash
# Create a new project for CIPC-Agent
doppler projects create cipc-agent

# Create environments
doppler environments create dev --project cipc-agent
doppler environments create staging --project cipc-agent
doppler environments create prod --project cipc-agent
```

### 4. Configure Secrets

#### Development Environment
```bash
# Set development secrets
doppler secrets set JWT_SECRET "your-dev-jwt-secret" --project cipc-agent --environment dev
doppler secrets set DATABASE_URL "postgresql://user:password@localhost:5432/cipc_agent_dev" --project cipc-agent --environment dev
doppler secrets set WHATSAPP_ACCESS_TOKEN "your-dev-whatsapp-token" --project cipc-agent --environment dev
doppler secrets set AISENSY_API_KEY "your-dev-aisensy-key" --project cipc-agent --environment dev
```

#### Production Environment
```bash
# Set production secrets
doppler secrets set JWT_SECRET "$(openssl rand -hex 32)" --project cipc-agent --environment prod
doppler secrets set DATABASE_URL "your-prod-database-url" --project cipc-agent --environment prod
doppler secrets set WHATSAPP_ACCESS_TOKEN "your-prod-whatsapp-token" --project cipc-agent --environment prod
doppler secrets set AISENSY_API_KEY "your-prod-aisensy-key" --project cipc-agent --environment prod
doppler secrets set TEMPORAL_ADDRESS "your-temporal-server:7233" --project cipc-agent --environment prod
```

### 5. Service Tokens

#### Create Service Tokens for CI/CD
```bash
# Development service token
doppler service-tokens create dev-deploy --project cipc-agent --environment dev

# Production service token
doppler service-tokens create prod-deploy --project cipc-agent --environment prod
```

### 6. Integration with Applications

#### Vercel (cipc-mfe)
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add `DOPPLER_TOKEN` with your service token
3. Update build command to use Doppler:
```bash
doppler run -- vercel build
```

#### Fly.io (dashboard)
1. Create Doppler service token for production
2. Add to Fly.io secrets:
```bash
fly secrets set DOPPLER_TOKEN=your-service-token
```
3. Update fly.toml to use Doppler:
```toml
[build]
  dockerfile = "Dockerfile"

[env]
  DOPPLER_TOKEN = "from_secret:DOPPLER_TOKEN"

[processes]
  web = "doppler run -- npm start"
```

### 7. Local Development
```bash
# Run with Doppler secrets
doppler run -- npm run dev

# Or set environment variable
export DOPPLER_TOKEN=your-personal-token
doppler run -- npm run dev
```

### 8. CI/CD Integration

#### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Doppler CLI
        run: |
          curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
      - name: Run deployment
        run: doppler run --project cipc-agent --environment prod -- vercel --prod
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

## Security Benefits

1. **No secrets in code**: All sensitive data managed centrally
2. **Environment isolation**: Different secrets per environment
3. **Audit trail**: Track who accessed secrets and when
4. **Automatic rotation**: Easy secret rotation without code changes
5. **Access control**: Granular permissions for team members

## Troubleshooting

### Common Issues

1. **Service token expired**: Regenerate token in Doppler dashboard
2. **Environment not found**: Check environment name matches exactly
3. **Permission denied**: Ensure proper access controls are set

### Verification
```bash
# Check if Doppler is working
doppler secrets --project cipc-agent --environment dev

# Test local setup
doppler run -- echo "Doppler is working!"

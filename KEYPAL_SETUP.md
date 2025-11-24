# 🔐 Keypal Setup Guide for CIPC Agent

## Overview

This guide provides step-by-step instructions for setting up **Keypal** as a secure API key management solution for the CIPC Agent project. Keypal will replace/manage your current secret management approach with a more developer-friendly CLI-first solution.

## 🚀 Quick Start

### 1. Install Keypal CLI

```bash
# Install globally via npm
npm install -g keypal

# Or using the official installer
curl -fsSL https://keypal.dev/install.sh | bash

# Verify installation
keypal --version
```

### 2. Initialize Project

```bash
# Initialize Keypal for CIPC Agent
keypal init cipc-agent

# Create environments
keypal env create dev
keypal env create staging
keypal env create prod

# Switch to development environment
keypal env dev
```

### 3. Set Up Secrets

```bash
# Core API Keys (Development)
keypal set OZOW_SITE_CODE "your_ozow_site_code"
keypal set OZOW_PRIVATE_KEY "your_ozow_private_key"
keypal set OZOW_API_KEY "your_ozow_api_key"
keypal set AISENSY_API_KEY "your_aisensy_api_key"
keypal set TWOCAPTCHA_API_KEY "your_2captcha_api_key"

# Application Secrets
keypal set JWT_SECRET "$(openssl rand -hex 32)"
keypal set API_KEY "your_app_api_key"

# Database (if using external)
keypal set DATABASE_URL "postgresql://localhost:5432/cipc_dev"

# Switch to production and set prod secrets
keypal env prod
keypal set OZOW_SITE_CODE "prod_ozow_site_code"
keypal set OZOW_PRIVATE_KEY "prod_ozow_private_key"
# ... set other prod secrets
```

## 📋 Detailed Setup Instructions

### Environment Configuration

#### Development Environment
```bash
keypal env dev

# Development-specific secrets
keypal set NODE_ENV "development"
keypal set LOG_LEVEL "DEBUG"
keypal set HEADLESS "false"  # For browser automation debugging
```

#### Staging Environment
```bash
keypal env staging

# Staging-specific configuration
keypal set NODE_ENV "staging"
keypal set LOG_LEVEL "INFO"
keypal set HEADLESS "true"
```

#### Production Environment
```bash
keypal env prod

# Production secrets (use strong, unique values)
keypal set NODE_ENV "production"
keypal set LOG_LEVEL "WARN"
keypal set HEADLESS "true"
keypal set TEMPORAL_ADDRESS "your-temporal-prod-server:7233"
```

### Service-Specific Configuration

#### Ozow Payment Integration
```bash
# Required for all environments
keypal set OZOW_SITE_CODE "your_site_code"
keypal set OZOW_PRIVATE_KEY "your_private_key"
keypal set OZOW_API_KEY "your_api_key"
keypal set OZOW_WEBHOOK_SECRET "webhook_verification_secret"
```

#### AISensy WhatsApp Integration
```bash
keypal set AISENSY_API_KEY "your_aisensy_key"
keypal set AISENSY_BASE_URL "https://api.aisensy.com"
keypal set AISENSY_WEBHOOK_SECRET "webhook_secret"
```

#### CAPTCHA Solving (2Captcha)
```bash
keypal set TWOCAPTCHA_API_KEY "your_2captcha_key"
keypal set CAPTCHA_TIMEOUT "30"
```

#### Temporal Workflow Engine
```bash
keypal set TEMPORAL_ADDRESS "localhost:7233"
keypal set TEMPORAL_NAMESPACE "cipc-agent"
keypal set TEMPORAL_TASK_QUEUE "cipc-filing-queue"
```

## 🔧 Integration with Development Workflow

### Local Development

#### Replace Doppler Commands
```bash
# Instead of: doppler run -- npm run dev
keypal run -- npm run dev

# Instead of: doppler run -- docker-compose up
keypal run -- docker-compose up

# Instead of: doppler run -- python main.py
keypal run -- python apps/cipc-runner/main.py
```

#### Environment-Specific Development
```bash
# Development with debug logging
keypal env dev
keypal run -- npm run dev

# Staging testing
keypal env staging
keypal run -- npm run build

# Production simulation
keypal env prod
keypal run -- npm run start
```

### Testing with Keypal

#### Run Test Suite
```bash
# Run tests with secrets injected
keypal run -- npm test

# Run end-to-end tests
keypal run -- ./test-phase3.sh

# Test specific environment
keypal env staging
keypal run -- npm run test:e2e
```

### Docker Development

#### Docker Compose with Keypal
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  cipc-runner:
    build: .
    environment:
      - KEYPAL_ENV=dev
    command: keypal run -- python main.py
```

#### Run Docker with Keypal
```bash
# Build and run with secrets
keypal run -- docker-compose -f docker-compose.dev.yml up

# Run specific service
keypal run -- docker-compose up cipc-runner
```

## 🚀 Deployment Integration

### Railway Deployment

#### Update Railway Configuration
```bash
# Instead of setting secrets in Railway dashboard,
# use Keypal service tokens for deployment

# Create deployment token
keypal service-token create railway-deploy --env prod

# Use token in Railway (add to environment variables)
RAILWAY_DEPLOY_TOKEN=your_service_token
```

#### Railway Build Command
```dockerfile
# Update Dockerfile to use Keypal
FROM node:18-alpine
RUN npm install -g keypal
COPY . .
RUN keypal login --token $RAILWAY_DEPLOY_TOKEN
RUN keypal env prod
RUN keypal run -- npm run build
```

### Fly.io Deployment

#### Fly.io Configuration
```toml
# fly.toml
[build]
  dockerfile = "Dockerfile"

[env]
  KEYPAL_TOKEN = "from_secret:KEYPAL_TOKEN"

[processes]
  web = "keypal run -- npm start"
```

#### Deploy to Fly.io
```bash
# Create Fly.io token
keypal service-token create fly-deploy --env prod

# Set in Fly.io
fly secrets set KEYPAL_TOKEN=your_service_token

# Deploy
fly deploy
```

### CI/CD Integration

#### GitHub Actions
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

      - name: Setup Keypal
        run: |
          npm install -g keypal
          keypal login --token ${{ secrets.KEYPAL_TOKEN }}
          keypal env prod

      - name: Install dependencies
        run: keypal run -- npm ci

      - name: Run tests
        run: keypal run -- npm test

      - name: Deploy
        run: keypal run -- ./deploy-railway.sh prod
```

## 🔒 Security Features

### Access Control

#### Team Collaboration
```bash
# Share project with team members
keypal share cipc-agent --email team@company.com

# Grant specific permissions
keypal permissions set team@company.com --read --env dev,staging

# Revoke access
keypal permissions revoke team@company.com
```

#### Audit Logging
```bash
# View access logs
keypal audit

# Filter by user or environment
keypal audit --user john@company.com
keypal audit --env prod --last 24h
```

### Backup & Recovery

#### Create Encrypted Backup
```bash
# Backup all secrets
keypal backup create cipc-backup-2024

# List backups
keypal backup list

# Restore from backup
keypal backup restore cipc-backup-2024
```

#### Export/Import
```bash
# Export specific environment
keypal export dev > dev-secrets.json

# Import to different environment
keypal import staging < dev-secrets.json
```

## 🛠️ Advanced Features

### Secret Rotation

#### Automatic Rotation
```bash
# Rotate a compromised key
keypal rotate OZOW_API_KEY

# Rotate all keys in environment
keypal rotate --all --env prod
```

#### Manual Rotation
```bash
# Update with new value
keypal set OZOW_API_KEY "new_api_key"

# Keypal will track rotation history
keypal history OZOW_API_KEY
```

### Templates & Automation

#### Use Built-in Templates
```bash
# Use Ozow template
keypal template use ozow

# Use custom template
keypal template create my-template
keypal template set my-template API_KEY
keypal template set my-template SECRET_KEY
```

#### Environment Cloning
```bash
# Clone dev to staging
keypal env clone dev staging

# Clone with overrides
keypal env clone prod staging --override DATABASE_URL=staging-db-url
```

## 📊 Monitoring & Analytics

### Usage Statistics
```bash
# View secret usage
keypal stats

# Environment-specific stats
keypal stats --env prod

# User access patterns
keypal stats --user
```

### Health Checks
```bash
# Check Keypal status
keypal health

# Validate all secrets
keypal validate

# Check for expired or weak secrets
keypal security scan
```

## 🔄 Migration from Doppler

### Step-by-Step Migration

#### 1. Export from Doppler
```bash
# Export current secrets
doppler secrets download --project cipc-agent --environment dev --format json > doppler-dev.json
doppler secrets download --project cipc-agent --environment prod --format json > doppler-prod.json
```

#### 2. Import to Keypal
```bash
# Import to Keypal
keypal import dev < doppler-dev.json
keypal import prod < doppler-prod.json
```

#### 3. Update Scripts
```bash
# Replace doppler commands with keypal
find . -name "*.sh" -o -name "*.yml" -o -name "*.yaml" | xargs sed -i 's/doppler run --/keypal run --/g'
```

#### 4. Update CI/CD
```yaml
# Update GitHub Actions
- name: Setup Keypal
  run: |
    npm install -g keypal
    keypal login --token ${{ secrets.KEYPAL_TOKEN }}
    keypal env prod
```

## 🚨 Troubleshooting

### Common Issues

#### Authentication Issues
```bash
# Re-authenticate
keypal logout
keypal login

# Check token status
keypal whoami
```

#### Environment Issues
```bash
# Check current environment
keypal env current

# List all environments
keypal env list

# Switch environment
keypal env prod
```

#### Secret Access Issues
```bash
# Check permissions
keypal permissions list

# Verify secret exists
keypal list | grep SECRET_NAME

# Check secret value
keypal get SECRET_NAME
```

## 📚 Additional Resources

### Keypal Documentation
- **Official Docs**: https://keypal.dev/docs
- **CLI Reference**: https://keypal.dev/cli
- **API Reference**: https://keypal.dev/api

### Community & Support
- **GitHub**: https://github.com/keypal/cli
- **Discord**: https://keypal.dev/discord
- **Issues**: https://github.com/keypal/cli/issues

### Integration Examples
- **Next.js**: https://keypal.dev/examples/nextjs
- **Docker**: https://keypal.dev/examples/docker
- **CI/CD**: https://keypal.dev/examples/github-actions

---

## 🎯 Quick Reference

```bash
# Core Commands
keypal init <project>          # Initialize project
keypal env <name>              # Switch environment
keypal set <key> <value>       # Set secret
keypal get <key>               # Get secret value
keypal list                    # List all secrets
keypal run -- <command>        # Run command with secrets

# Team Commands
keypal share <project>         # Share with team
keypal permissions list        # View permissions
keypal audit                   # View access logs

# Backup & Recovery
keypal backup create <name>    # Create backup
keypal backup restore <name>   # Restore backup
keypal export <env> > file     # Export secrets
keypal import <env> < file     # Import secrets
```

**Keypal is now ready to securely manage all your CIPC Agent secrets! 🔐**

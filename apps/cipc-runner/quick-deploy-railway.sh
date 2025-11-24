#!/bin/bash

# Quick Railway Deployment Script
# Simplified version for immediate deployment

set -e

echo "🚂 Quick Railway Deployment for CIPC Runner"
echo "==========================================="

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check login
if ! railway whoami &> /dev/null; then
    echo "🔐 Logging into Railway..."
    railway login
fi

# Initialize project
echo "📦 Initializing Railway project..."
railway init cipc-runner-prod --source docker

# Set essential environment variables
echo "⚙️ Setting environment variables..."
railway variables set ENV=production
railway variables set HEADLESS=true
railway variables set PORT=8000
railway variables set PYTHONUNBUFFERED=1

# Deploy
echo "🚀 Deploying to Railway..."
railway up --detach

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Set secrets in Railway dashboard:"
echo "   - TWOCAPTCHA_API_KEY"
echo "   - TEMPORAL_ADDRESS"
echo ""
echo "2. Monitor deployment:"
echo "   railway logs"
echo ""
echo "3. Get service URL:"
echo "   railway domain"
echo ""
echo "🎉 Railway deployment complete!"
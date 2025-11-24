#!/bin/bash

# CIPC Agent Production Deployment Script
# This script deploys all components to production infrastructure

set -e  # Exit on any error

echo "🚀 Starting CIPC Agent Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check for required tools
    command -v flyctl >/dev/null 2>&1 || { print_error "flyctl not found. Please install Fly.io CLI."; exit 1; }
    command -v render >/dev/null 2>&1 || { print_error "render CLI not found. Please install Render CLI."; exit 1; }
    command -v railway >/dev/null 2>&1 || { print_error "railway CLI not found. Please install Railway CLI."; exit 1; }
    command -v doppler >/dev/null 2>&1 || { print_error "doppler CLI not found. Please install Doppler CLI."; exit 1; }

    print_success "Prerequisites check passed"
}

# Deploy Typebot to Render
deploy_typebot() {
    print_status "Deploying Typebot to Render..."

    cd typebot

    # Deploy using Render CLI (if available) or provide manual instructions
    if command -v render >/dev/null 2>&1; then
        render deploy --blueprint render.yaml
        print_success "Typebot deployed to Render"
    else
        print_warning "Render CLI not available. Please deploy manually:"
        echo "1. Go to https://render.com"
        echo "2. Create new service from blueprint"
        echo "3. Upload typebot/render.yaml"
        echo "4. Set environment variables from Doppler"
        echo "5. Deploy and note the URL"
    fi

    cd ..
}

# Deploy Go Backend to Fly.io
deploy_backend() {
    print_status "Deploying Go Backend to Fly.io..."

    cd backend

    # Initialize Fly.io app if not exists
    if ! flyctl apps list | grep -q "cipc-agent-backend"; then
        print_status "Creating Fly.io app..."
        flyctl launch --name cipc-agent-backend --region jnb --no-deploy
    fi

    # Deploy the app
    print_status "Deploying to Fly.io..."
    flyctl deploy

    print_success "Go Backend deployed to Fly.io"

    cd ..
}

# Deploy Railway services (Database, Redis, Python Agent)
deploy_railway_services() {
    print_status "Deploying Railway services..."

    # Deploy PostgreSQL database
    print_status "Setting up PostgreSQL database..."
    if command -v railway >/dev/null 2>&1; then
        railway link cipc-agent-prod 2>/dev/null || railway init cipc-agent-prod
        railway add postgresql
        railway add redis
        print_success "Railway services configured"
    else
        print_warning "Railway CLI not available. Please set up manually:"
        echo "1. Go to https://railway.app"
        echo "2. Create project 'cipc-agent-prod'"
        echo "3. Add PostgreSQL and Redis services"
        echo "4. Note connection strings"
    fi
}

# Setup Doppler secrets
setup_secrets() {
    print_status "Setting up Doppler secrets management..."

    if command -v doppler >/dev/null 2>&1; then
        # Create Doppler project if not exists
        doppler projects create cipc-agent --description "CIPC Agent Production" 2>/dev/null || true
        doppler projects select cipc-agent

        # Create environments
        doppler environments create prod --project cipc-agent 2>/dev/null || true
        doppler environments create staging --project cipc-agent 2>/dev/null || true

        # Setup secrets structure (interactive setup would be needed for actual secrets)
        print_warning "Doppler project created. Please add secrets manually:"
        echo "- Database credentials"
        echo "- API keys for Ozow, PayFast, AISensy"
        echo "- CIPC filing portal credentials"
        echo "- JWT secrets"
        echo "- SMTP settings"

        print_success "Doppler project configured"
    else
        print_warning "Doppler CLI not available. Please set up at https://doppler.com"
    fi
}

# Deploy Python CIPC Runner
deploy_cipc_runner() {
    print_status "Deploying CIPC Runner to Railway..."

    if command -v railway >/dev/null 2>&1; then
        # Deploy the Python agent
        railway link cipc-agent-prod
        railway deploy --service cipc-runner
        print_success "CIPC Runner deployed"
    else
        print_warning "Railway CLI not available. Deploy Python agent manually."
    fi
}

# Configure domain and DNS
setup_domain() {
    print_status "Configuring domain and DNS..."

    print_warning "Please configure the following DNS records:"
    echo "A Records:"
    echo "  www.cipcagent.co.za → Vercel IP"
    echo "  funnel.cipcagent.co.za → Render IP"
    echo "  api.cipcagent.co.za → Fly.io IP"
    echo ""
    echo "CNAME Records:"
    echo "  cipcagent.co.za → cipcagent.co.za"
    echo ""
    echo "SSL certificates will be auto-provisioned by each platform."
}

# Run health checks
health_checks() {
    print_status "Running deployment health checks..."

    # Check if services are responding (would need actual URLs)
    print_warning "Health checks require deployed service URLs."
    print_warning "Please verify:"
    echo "- Typebot: https://[render-url]/api/health"
    echo "- Backend: https://[fly-url]/api/v1/health"
    echo "- Database connectivity"
    echo "- Payment provider webhooks"
}

# Main deployment process
main() {
    echo "🎯 CIPC Agent Production Deployment Script"
    echo "========================================"

    check_prerequisites
    setup_secrets
    deploy_railway_services
    deploy_typebot
    deploy_backend
    deploy_cipc_runner
    setup_domain
    health_checks

    print_success "🎉 Deployment script completed!"
    print_warning "Please complete manual configuration steps listed above."
    print_status "Next steps:"
    echo "1. Configure all secrets in Doppler"
    echo "2. Set up domain DNS records"
    echo "3. Test end-to-end payment flow"
    echo "4. Configure monitoring alerts"
    echo "5. Run verification checklist from specs"
}

# Run main function
main "$@"

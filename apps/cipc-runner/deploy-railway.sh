#!/bin/bash

# Enhanced Railway Deployment Script for CIPC Runner
# Supports free tier deployment with automatic configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENV=${1:-"production"}
PROJECT_NAME="cipc-runner-${ENV}"
REQUIRED_SECRETS=("TWOCAPTCHA_API_KEY" "TEMPORAL_ADDRESS")

echo -e "${BLUE}🚂 Enhanced Railway Deployment for CIPC Runner${NC}"
echo "================================================"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Project: ${YELLOW}$PROJECT_NAME${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI not found${NC}"
        echo "Install with: npm install -g @railway/cli"
        echo "Or: curl -fsSL https://railway.app/install.sh | sh"
        exit 1
    fi
    
    # Check login status
    if ! railway whoami &> /dev/null; then
        echo -e "${RED}❌ Not logged in to Railway${NC}"
        echo "Run: railway login"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not found - Railway will build from source${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to create or connect to project
setup_project() {
    echo -e "${BLUE}📦 Setting up Railway project...${NC}"
    
    # Check if project already exists
    if railway status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Already connected to a Railway project${NC}"
        read -p "Continue with current project? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        # Create new project
        railway init "$PROJECT_NAME" --source docker
        echo -e "${GREEN}✅ Project '$PROJECT_NAME' created${NC}"
    fi
}

# Function to configure environment variables
configure_environment() {
    echo -e "${BLUE}🔐 Configuring environment variables...${NC}"
    
    # Set basic environment variables
    railway variables set ENV="$ENV"
    railway variables set HEADLESS="true"
    railway variables set PORT="8000"
    railway variables set PYTHONUNBUFFERED="1"
    railway variables set LOG_LEVEL="INFO"
    
    # Set Railway-specific optimizations
    railway variables set RAILWAY_HEALTHCHECK_TIMEOUT="300"
    railway variables set RAILWAY_RESTART_POLICY="always"
    
    echo -e "${GREEN}✅ Basic environment variables set${NC}"
    
    # Check for secrets
    echo -e "${YELLOW}⚠️  Required secrets (set these in Railway dashboard):${NC}"
    for secret in "${REQUIRED_SECRETS[@]}"; do
        echo "  - $secret"
    done
    
    # Prompt for immediate secret setup
    read -p "Do you want to set secrets now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_secrets
    fi
}

# Function to setup secrets interactively
setup_secrets() {
    echo -e "${BLUE}🔑 Setting up secrets...${NC}"
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        read -p "Enter value for $secret (or press Enter to skip): " -s secret_value
        echo
        if [[ -n "$secret_value" ]]; then
            echo "$secret_value" | railway variables set "$secret"
            echo -e "${GREEN}✅ $secret set${NC}"
        else
            echo -e "${YELLOW}⚠️  $secret skipped - set manually in dashboard${NC}"
        fi
    done
}

# Function to deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying application...${NC}"
    
    # Deploy with Railway
    railway up --detach
    
    echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
    sleep 45
    
    # Check deployment status
    if railway status | grep -q "Active"; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
    else
        echo -e "${RED}❌ Deployment may have failed${NC}"
        echo "Check logs with: railway logs"
        return 1
    fi
}

# Function to get service information
get_service_info() {
    echo -e "${BLUE}📊 Getting service information...${NC}"
    
    # Get service URL
    SERVICE_URL=$(railway domain 2>/dev/null || echo "No domain assigned yet")
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo "====================="
    echo -e "Project: ${YELLOW}$PROJECT_NAME${NC}"
    echo -e "Environment: ${YELLOW}$ENV${NC}"
    echo -e "Service URL: ${YELLOW}https://$SERVICE_URL${NC}"
    echo ""
}

# Function to run post-deployment tests
run_tests() {
    echo -e "${BLUE}🧪 Running post-deployment tests...${NC}"
    
    if [[ "$SERVICE_URL" != "No domain assigned yet" ]]; then
        # Test health endpoint
        echo "Testing health endpoint..."
        if curl -f -s "https://$SERVICE_URL/health" > /dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${RED}❌ Health check failed${NC}"
        fi
        
        # Test API endpoint
        echo "Testing API endpoint..."
        response=$(curl -s -o /dev/null -w "%{http_code}" "https://$SERVICE_URL/api/filing/health" || echo "000")
        if [[ "$response" == "200" ]]; then
            echo -e "${GREEN}✅ API endpoint accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  API endpoint returned: $response${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No domain assigned - skipping tests${NC}"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}📋 Next Steps${NC}"
    echo "=============="
    echo "1. Set required secrets in Railway dashboard:"
    echo "   https://railway.app/project/$PROJECT_NAME"
    echo ""
    echo "2. Monitor deployment:"
    echo -e "   ${YELLOW}railway logs${NC}"
    echo -e "   ${YELLOW}railway status${NC}"
    echo ""
    echo "3. Test the service:"
    if [[ "$SERVICE_URL" != "No domain assigned yet" ]]; then
        echo -e "   ${YELLOW}curl https://$SERVICE_URL/health${NC}"
    else
        echo "   Wait for domain assignment, then test health endpoint"
    fi
    echo ""
    echo "4. Update Cloudflare Worker with new URL:"
    echo "   Update CIPC_RUNNER_URL in worker environment"
    echo ""
    echo -e "${GREEN}💰 Railway Free Tier Benefits:${NC}"
    echo "- 512MB RAM, 1GB disk, 1 CPU"
    echo "- 100GB bandwidth/month"
    echo "- PostgreSQL database included"
    echo "- Custom domain with SSL"
    echo "- Zero cold starts"
}

# Main execution
main() {
    check_prerequisites
    setup_project
    configure_environment
    deploy_application
    get_service_info
    run_tests
    show_next_steps
    
    echo ""
    echo -e "${GREEN}🎉 Railway deployment completed successfully!${NC}"
}

# Run main function
main

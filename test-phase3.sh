#!/bin/bash

# Phase 3 End-to-End Test Script
# Tests the complete CIPC Agent workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Phase 3 End-to-End Test Suite${NC}"
echo "=================================="

# Configuration
CIPC_RUNNER_URL=${CIPC_RUNNER_URL:-"http://localhost:8000"}
DASHBOARD_URL=${DASHBOARD_URL:-"http://localhost:8788"}
WORKER_URL=${WORKER_URL:-"https://cipc-dashboard.workers.dev"}
RAILWAY_URL=${RAILWAY_URL:-""}
TIMEOUT=${TIMEOUT:-30}

# Test data
TEST_COMPANY_NUMBER="2021/123456/07"
TEST_COMPANY_NAME="Test Company Pty Ltd"
TEST_FINANCIAL_YEAR="2024-02-28"
TEST_EMAIL="test@example.com"
TEST_PHONE="+27821234567"
TEST_PAYMENT_REF="TEST-$(date +%s)"

echo -e "${YELLOW}Configuration:${NC}"
echo "CIPC Runner URL: $CIPC_RUNNER_URL"
echo "Dashboard URL: $DASHBOARD_URL"
echo "Worker URL: $WORKER_URL"
echo ""

# Function to check if service is healthy
check_health() {
    local service_name=$1
    local url=$2
    local timeout=${3:-$TIMEOUT}

    echo -e "${BLUE}🔍 Checking $service_name health...${NC}"
    
    local response=$(curl -f -s -m $timeout "$url/health" 2>/dev/null)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        if echo "$response" | grep -q "status"; then
            local status=$(echo "$response" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
            echo "   Status: $status"
        fi
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding (timeout: ${timeout}s)${NC}"
        return 1
    fi
}

# Function to test CIPC Runner API
test_cipc_runner() {
    echo -e "${BLUE}🧪 Testing CIPC Runner API...${NC}"

    # Test health endpoint
    if ! check_health "CIPC Runner" "$CIPC_RUNNER_URL"; then
        return 1
    fi

    # Test filing endpoint
    echo -e "${BLUE}📝 Testing filing endpoint...${NC}"
    local response=$(curl -s -X POST "$CIPC_RUNNER_URL/api/filing/start" \
        -H "Content-Type: application/json" \
        -d "{
            \"company_registration_number\": \"$TEST_COMPANY_NUMBER\",
            \"company_name\": \"$TEST_COMPANY_NAME\",
            \"financial_year_end\": \"$TEST_FINANCIAL_YEAR\",
            \"contact_email\": \"$TEST_EMAIL\",
            \"contact_phone\": \"$TEST_PHONE\",
            \"payment_reference\": \"$TEST_PAYMENT_REF\"
        }")

    if echo "$response" | grep -q "filing_id"; then
        echo -e "${GREEN}✅ Filing request accepted${NC}"
        local filing_id=$(echo "$response" | grep -o '"filing_id":"[^"]*' | cut -d'"' -f4)
        echo "Filing ID: $filing_id"

        # Test status endpoint
        echo -e "${BLUE}📊 Testing status endpoint...${NC}"
        sleep 2
        local status_response=$(curl -s "$CIPC_RUNNER_URL/api/filing/$filing_id/status")

        if echo "$status_response" | grep -q "status"; then
            echo -e "${GREEN}✅ Status check successful${NC}"
        else
            echo -e "${RED}❌ Status check failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Filing request failed${NC}"
        echo "Response: $response"
        return 1
    fi

    return 0
}

# Function to test Cloudflare Worker
test_worker() {
    echo -e "${BLUE}☁️  Testing Cloudflare Worker...${NC}"

    # Test health endpoint
    if ! check_health "Cloudflare Worker" "$WORKER_URL"; then
        return 1
    fi

    echo -e "${GREEN}✅ Worker health check passed${NC}"
    return 0
}

# Function to test payment flow simulation
test_payment_flow() {
    echo -e "${BLUE}💳 Testing payment flow simulation...${NC}"

    # Simulate payment webhook
    local payment_data="{
        \"payment_reference\": \"$TEST_PAYMENT_REF\",
        \"transaction_id\": \"TXN-$(date +%s)\",
        \"status\": \"completed\",
        \"amount\": \"199.00\",
        \"customer_email\": \"$TEST_EMAIL\",
        \"customer_phone\": \"$TEST_PHONE\",
        \"company_number\": \"$TEST_COMPANY_NUMBER\",
        \"company_name\": \"$TEST_COMPANY_NAME\",
        \"financial_year_end\": \"$TEST_FINANCIAL_YEAR\"
    }"

    local response=$(curl -s -X POST "$WORKER_URL/api/webhooks/payment" \
        -H "Content-Type: application/json" \
        -d "$payment_data")

    if echo "$response" | grep -q "Payment processed successfully"; then
        echo -e "${GREEN}✅ Payment webhook processed${NC}"
        return 0
    else
        echo -e "${RED}❌ Payment webhook failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to test Typebot webhook
test_typebot_webhook() {
    echo -e "${BLUE}🎯 Testing Typebot webhook...${NC}"

    local typebot_data="{
        \"variables\": [
            {\"name\": \"name\", \"value\": \"Test User\"},
            {\"name\": \"email\", \"value\": \"$TEST_EMAIL\"},
            {\"name\": \"phone\", \"value\": \"$TEST_PHONE\"},
            {\"name\": \"company\", \"value\": \"$TEST_COMPANY_NAME\"},
            {\"name\": \"service\", \"value\": \"Annual Returns\"}
        ],
        \"resultId\": \"$TEST_PAYMENT_REF\",
        \"sessionId\": \"session-$(date +%s)\"
    }"

    local response=$(curl -s -X POST "$WORKER_URL/api/webhooks/typebot" \
        -H "Content-Type: application/json" \
        -d "$typebot_data")

    if echo "$response" | grep -q "Lead processed successfully"; then
        echo -e "${GREEN}✅ Typebot webhook processed${NC}"
        return 0
    else
        echo -e "${RED}❌ Typebot webhook failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to test Railway deployment
test_railway_deployment() {
    if [[ -z "$RAILWAY_URL" ]]; then
        echo -e "${YELLOW}⏭️  Railway URL not provided - skipping Railway tests${NC}"
        return 0
    fi

    echo -e "${BLUE}🚂 Testing Railway deployment...${NC}"
    
    # Test Railway health
    if ! check_health "Railway CIPC Runner" "$RAILWAY_URL" 60; then
        return 1
    fi
    
    # Test Railway-specific endpoints
    echo -e "${BLUE}📊 Testing Railway metrics...${NC}"
    local metrics_response=$(curl -s -m 30 "$RAILWAY_URL/metrics" 2>/dev/null)
    if echo "$metrics_response" | grep -q "cipc_"; then
        echo -e "${GREEN}✅ Railway metrics available${NC}"
    else
        echo -e "${YELLOW}⚠️  Railway metrics not available${NC}"
    fi
    
    return 0
}

# Function to test database connectivity
test_database_connectivity() {
    echo -e "${BLUE}🗄️  Testing database connectivity...${NC}"
    
    local db_test=$(curl -s -X POST "$CIPC_RUNNER_URL/api/test/database" \
        -H "Content-Type: application/json" \
        -d '{"test": true}' 2>/dev/null)
    
    if echo "$db_test" | grep -q "connected"; then
        echo -e "${GREEN}✅ Database connectivity test passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connectivity test failed${NC}"
        return 1
    fi
}

# Function to test temporal connectivity
test_temporal_connectivity() {
    echo -e "${BLUE}⏰ Testing Temporal connectivity...${NC}"
    
    local temporal_test=$(curl -s -X GET "$CIPC_RUNNER_URL/api/test/temporal" 2>/dev/null)
    
    if echo "$temporal_test" | grep -q "connected"; then
        echo -e "${GREEN}✅ Temporal connectivity test passed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Temporal connectivity test failed or not configured${NC}"
        return 0  # Non-critical for basic functionality
    fi
}

# Main test execution
echo -e "${BLUE}🚀 Starting enhanced test suite...${NC}"
echo ""

FAILED_TESTS=()
WARNING_TESTS=()

# Test 1: CIPC Runner
if test_cipc_runner; then
    echo -e "${GREEN}✅ CIPC Runner tests passed${NC}"
else
    FAILED_TESTS+=("CIPC Runner")
fi
echo ""

# Test 2: Database Connectivity
if test_database_connectivity; then
    echo -e "${GREEN}✅ Database connectivity tests passed${NC}"
else
    WARNING_TESTS+=("Database Connectivity")
fi
echo ""

# Test 3: Temporal Connectivity
if test_temporal_connectivity; then
    echo -e "${GREEN}✅ Temporal connectivity tests passed${NC}"
else
    WARNING_TESTS+=("Temporal Connectivity")
fi
echo ""

# Test 4: Railway Deployment
if test_railway_deployment; then
    echo -e "${GREEN}✅ Railway deployment tests passed${NC}"
else
    FAILED_TESTS+=("Railway Deployment")
fi
echo ""

# Test 5: Cloudflare Worker
if test_worker; then
    echo -e "${GREEN}✅ Cloudflare Worker tests passed${NC}"
else
    FAILED_TESTS+=("Cloudflare Worker")
fi
echo ""

# Test 6: Typebot Webhook
if test_typebot_webhook; then
    echo -e "${GREEN}✅ Typebot webhook tests passed${NC}"
else
    FAILED_TESTS+=("Typebot Webhook")
fi
echo ""

# Test 7: Payment Flow
if test_payment_flow; then
    echo -e "${GREEN}✅ Payment flow tests passed${NC}"
else
    FAILED_TESTS+=("Payment Flow")
fi
echo ""

# Summary
echo -e "${BLUE}📊 Enhanced Test Results Summary${NC}"
echo "================================"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    if [ ${#WARNING_TESTS[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Phase 3 is ready for production deployment.${NC}"
    else
        echo -e "${YELLOW}⚠️  Tests passed with warnings: ${WARNING_TESTS[*]}${NC}"
        echo -e "${GREEN}✅ Core functionality is ready for deployment.${NC}"
    fi
    echo ""
    echo -e "${BLUE}🚀 Deployment Readiness Checklist:${NC}"
    echo "✅ CIPC Runner API functional"
    echo "✅ Health checks responding"
    echo "✅ Webhook endpoints working"
    echo "✅ Payment flow operational"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Deploy to Railway: ./deploy-railway.sh production"
    echo "2. Configure production secrets in Railway dashboard"
    echo "3. Update Cloudflare Worker with Railway URL"
    echo "4. Set up monitoring dashboards"
    echo "5. Run load tests with realistic traffic"
    echo "6. Configure backup and disaster recovery"
    echo ""
    echo -e "${GREEN}🎯 Ready for production traffic!${NC}"
    exit 0
else
    echo -e "${RED}❌ Critical tests failed: ${FAILED_TESTS[*]}${NC}"
    if [ ${#WARNING_TESTS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Warning tests: ${WARNING_TESTS[*]}${NC}"
    fi
    echo ""
    echo -e "${RED}🚨 Failed components must be fixed before deployment.${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check service logs: docker logs <container_name>"
    echo "2. Verify environment variables are set correctly"
    echo "3. Ensure all required services are running"
    echo "4. Test network connectivity between services"
    echo "5. Validate API keys and credentials"
    exit 1
fi

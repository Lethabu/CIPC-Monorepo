#!/bin/bash

# CIPC Runner Deployment Script
# Supports multiple cloud providers

set -e

# Configuration
IMAGE_NAME="cipc-runner"
TAG=${TAG:-"latest"}
REGISTRY=${REGISTRY:-"your-registry"}
PROJECT_NAME="cipc-agent"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CIPC Runner Deployment Script${NC}"
echo "================================="

# Function to print usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --provider PROVIDER    Cloud provider (aws, gcp, azure, fly, railway)"
    echo "  -e, --env ENV             Environment (dev, staging, prod)"
    echo "  -t, --tag TAG             Docker image tag (default: latest)"
    echo "  -r, --registry REGISTRY   Docker registry URL"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --provider aws --env prod"
    echo "  $0 --provider fly --env dev"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--provider)
            PROVIDER="$2"
            shift 2
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$PROVIDER" ]; then
    echo -e "${RED}Error: Provider is required${NC}"
    usage
    exit 1
fi

ENV=${ENV:-"dev"}

echo -e "${YELLOW}Provider: ${PROVIDER}${NC}"
echo -e "${YELLOW}Environment: ${ENV}${NC}"
echo -e "${YELLOW}Image: ${REGISTRY}/${IMAGE_NAME}:${TAG}${NC}"
echo ""

# Build Docker image
echo -e "${GREEN}📦 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${TAG} .

# Tag for registry
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}

# Push to registry
echo -e "${GREEN}⬆️  Pushing to registry...${NC}"
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

# Deploy based on provider
case $PROVIDER in
    aws)
        echo -e "${GREEN}☁️  Deploying to AWS ECS...${NC}"
        ./deploy-aws.sh $ENV $REGISTRY $IMAGE_NAME $TAG
        ;;
    gcp)
        echo -e "${GREEN}☁️  Deploying to Google Cloud Run...${NC}"
        ./deploy-gcp.sh $ENV $REGISTRY $IMAGE_NAME $TAG
        ;;
    azure)
        echo -e "${GREEN}☁️  Deploying to Azure Container Instances...${NC}"
        ./deploy-azure.sh $ENV $REGISTRY $IMAGE_NAME $TAG
        ;;
    fly)
        echo -e "${GREEN}☁️  Deploying to Fly.io...${NC}"
        ./deploy-fly.sh $ENV $REGISTRY $IMAGE_NAME $TAG
        ;;
    railway)
        echo -e "${GREEN}☁️  Deploying to Railway...${NC}"
        ./deploy-railway.sh $ENV $REGISTRY $IMAGE_NAME $TAG
        ;;
    *)
        echo -e "${RED}Unsupported provider: $PROVIDER${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

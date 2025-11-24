#!/bin/bash

# Deploy CIPC Runner to Google Cloud Run

set -e

ENV=$1
REGISTRY=$2
IMAGE_NAME=$3
TAG=$4

if [ -z "$ENV" ] || [ -z "$REGISTRY" ] || [ -z "$IMAGE_NAME" ] || [ -z "$TAG" ]; then
    echo "Usage: $0 <env> <registry> <image_name> <tag>"
    exit 1
fi

# Configuration based on environment
case $ENV in
    dev)
        SERVICE_NAME="cipc-runner-dev"
        REGION="us-central1"
        CPU="1"
        MEMORY="2Gi"
        MIN_INSTANCES="0"
        MAX_INSTANCES="10"
        ;;
    staging)
        SERVICE_NAME="cipc-runner-staging"
        REGION="us-central1"
        CPU="2"
        MEMORY="4Gi"
        MIN_INSTANCES="1"
        MAX_INSTANCES="20"
        ;;
    prod)
        SERVICE_NAME="cipc-runner-prod"
        REGION="us-central1"
        CPU="2"
        MEMORY="4Gi"
        MIN_INSTANCES="2"
        MAX_INSTANCES="50"
        ;;
    *)
        echo "Unknown environment: $ENV"
        exit 1
        ;;
esac

FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🚀 Deploying CIPC Runner to Google Cloud Run"
echo "============================================"
echo "Environment: $ENV"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $FULL_IMAGE_NAME"
echo "CPU: $CPU"
echo "Memory: $MEMORY"
echo ""

# Set GCP project (you may need to change this)
PROJECT_ID=${PROJECT_ID:-"your-gcp-project-id"}

# Authenticate with GCP (if not already done)
echo "🔐 Authenticating with Google Cloud..."
gcloud auth configure-docker --quiet

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $FULL_IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --cpu $CPU \
    --memory $MEMORY \
    --min-instances $MIN_INSTANCES \
    --max-instances $MAX_INSTANCES \
    --port 8000 \
    --allow-unauthenticated \
    --set-env-vars "ENV=$ENV" \
    --set-env-vars "HEADLESS=true" \
    --set-secrets "TWOCAPTCHA_API_KEY=twocaptcha-api-key:latest" \
    --set-secrets "TEMPORAL_ADDRESS=temporal-address:latest" \
    --set-secrets "DATABASE_URL=database-url:latest" \
    --timeout 900 \
    --concurrency 1

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format "value(status.url)")

echo ""
echo "✅ Deployment completed!"
echo "Service URL: $SERVICE_URL"
echo ""
echo "🧪 Test the deployment:"
echo "curl $SERVICE_URL/health"
echo ""
echo "📊 Monitor the service:"
echo "gcloud run services logs read $SERVICE_NAME --region $REGION --project $PROJECT_ID"

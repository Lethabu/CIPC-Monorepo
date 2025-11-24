#!/bin/bash

# Deploy CIPC Runner to Fly.io (Cost-effective alternative)

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
        APP_NAME="cipc-runner-dev"
        VM_SIZE="shared-cpu-1x"
        VM_MEMORY="512mb"
        MIN_MACHINES=0
        MAX_MACHINES=1
        ;;
    staging)
        APP_NAME="cipc-runner-staging"
        VM_SIZE="shared-cpu-1x"
        VM_MEMORY="1gb"
        MIN_MACHINES=1
        MAX_MACHINES=3
        ;;
    prod)
        APP_NAME="cipc-runner-prod"
        VM_SIZE="shared-cpu-2x"
        VM_MEMORY="2gb"
        MIN_MACHINES=1
        MAX_MACHINES=5
        ;;
    *)
        echo "Unknown environment: $ENV"
        exit 1
        ;;
esac

FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🛩️  Deploying CIPC Runner to Fly.io"
echo "==================================="
echo "Environment: $ENV"
echo "App: $APP_NAME"
echo "Image: $FULL_IMAGE_NAME"
echo "VM Size: $VM_SIZE"
echo "Memory: $VM_MEMORY"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Run: fly auth login"
    exit 1
fi

# Create app if it doesn't exist
if ! fly apps list | grep -q "$APP_NAME"; then
    echo "📦 Creating Fly.io app: $APP_NAME"
    fly launch --name "$APP_NAME" --image "$FULL_IMAGE_NAME" --no-deploy --internal-port 8000
else
    echo "✅ App $APP_NAME already exists"
fi

# Set environment variables and secrets
echo "🔐 Configuring environment..."

# Set basic environment variables
fly secrets set ENV="$ENV" --app "$APP_NAME"
fly secrets set HEADLESS="true" --app "$APP_NAME"

# Set secrets (these need to be set manually or through CI/CD)
echo "⚠️  Please set these secrets manually:"
echo "fly secrets set TWOCAPTCHA_API_KEY='your_key' --app $APP_NAME"
echo "fly secrets set TEMPORAL_ADDRESS='your_temporal_server:7233' --app $APP_NAME"
echo "fly secrets set DATABASE_URL='your_database_url' --app $APP_NAME"

# Configure app
cat > fly.toml << EOF
app = "$APP_NAME"
primary_region = "jnb"

[build]
  image = "$FULL_IMAGE_NAME"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = $MIN_MACHINES
  processes = ["app"]

[[vm]]
  size = "$VM_SIZE"
  memory = "$VM_MEMORY"

[mounts]
  source = "cipc_data"
  destination = "/data"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

[services.concurrency]
  hard_limit = 25
  soft_limit = 20
  type = "connections"

[[services.http_checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"
  protocol = "http"

[[services.ports]]
  handlers = ["http"]
  port = 80

[[services.ports]]
  handlers = ["tls", "http"]
  port = 443
EOF

# Deploy
echo "🚀 Deploying to Fly.io..."
fly deploy --app "$APP_NAME"

# Get the service URL
SERVICE_URL=$(fly status --app "$APP_NAME" | grep "Hostname" | awk '{print $2}')

echo ""
echo "✅ Deployment completed!"
echo "Service URL: https://$SERVICE_URL"
echo ""
echo "🧪 Test the deployment:"
echo "curl https://$SERVICE_URL/health"
echo ""
echo "📊 Monitor the service:"
echo "fly logs --app $APP_NAME"
echo ""
echo "💰 Fly.io Pricing (as of 2024):"
echo "- Shared CPU: $0.000/hour (~$0.36/month for 1 instance)"
echo "- Dedicated CPU: $0.000/hour (~$0.72/month for 1 instance)"
echo "- Free tier: 3 shared CPUs, 3GB storage"

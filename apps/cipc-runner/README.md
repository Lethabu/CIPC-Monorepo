# CIPC Runner - Automated Annual Returns Filing

A containerized Python service that automates CIPC CoR 30.1 annual returns filing using Playwright browser automation and Temporal workflows.

## Features

- **Automated Filing**: Complete CoR 30.1 form submission
- **CAPTCHA Solving**: Integrated 2Captcha service for form validation
- **Temporal Workflows**: Reliable, resumable filing processes
- **WhatsApp Integration**: Real-time status updates via AISensy
- **Containerized**: Docker deployment with health checks
- **Database Storage**: SQLite for filing records and status tracking

## Prerequisites

- Docker and Docker Compose
- Temporal Server (for workflow orchestration)
- 2Captcha API key (for CAPTCHA solving)
- AISensy API credentials (for WhatsApp messaging)

## Quick Start

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Build and Run

```bash
# Build the container
docker build -t cipc-runner .

# Run with Temporal server
docker run -p 8000:8000 \
  -e TEMPORAL_ADDRESS=host.docker.internal:7233 \
  -e TWOCAPTCHA_API_KEY=your-key \
  cipc-runner
```

### 3. Start Temporal Server

```bash
# Using Docker
docker run -p 7233:7233 -p 8233:8233 \
  --env-file .env \
  temporalio/auto-setup:latest
```

## API Endpoints

### Start Filing
```http
POST /api/filing/start
Content-Type: application/json

{
  "company_registration_number": "2021/123456/07",
  "company_name": "Example Company Pty Ltd",
  "financial_year_end": "2024-02-28",
  "contact_email": "contact@example.com",
  "contact_phone": "+27821234567",
  "payment_reference": "PAY-12345"
}
```

### Check Status
```http
GET /api/filing/{filing_id}/status
```

### Health Check
```http
GET /health
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEMPORAL_ADDRESS` | Temporal server address | `localhost:7233` |
| `TEMPORAL_NAMESPACE` | Temporal namespace | `default` |
| `TWOCAPTCHA_API_KEY` | 2Captcha API key | Required for CAPTCHA |
| `HEADLESS` | Run browser headless | `true` |
| `PORT` | Service port | `8000` |

### AISensy Integration

Configure WhatsApp messaging:

```bash
export AISENSY_API_KEY=your-aisensy-key
export AISENSY_BASE_URL=https://api.aisensy.com
```

## Workflow Architecture

```
Lead Capture (Typebot)
    ↓
Payment Confirmation (Ozow/PayFast)
    ↓
Temporal Workflow Start
    ↓
CIPC Filing Activity
    ├── CAPTCHA Solving
    ├── Form Filling
    └── Submission
    ↓
Status Updates (WhatsApp)
```

## Development

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install

# Run Temporal worker
python temporal_worker.py

# Run API server
python main.py
```

### Testing

```bash
# Run with mock filing (no actual CIPC submission)
export MOCK_FILING=true
python main.py
```

## Security Considerations

- **Secrets Management**: Use Doppler or similar for API keys
- **Rate Limiting**: Implement request throttling
- **Input Validation**: Validate all company data
- **Error Handling**: Comprehensive error logging and recovery
- **Audit Trail**: Complete filing history and status tracking

## Monitoring

### Health Checks
- Container health checks every 30 seconds
- API endpoint response monitoring
- Temporal workflow status tracking

### Logging
- Structured JSON logging with Loguru
- Screenshot capture for debugging
- Comprehensive error reporting

## Troubleshooting

### Common Issues

1. **Browser Launch Failed**
   - Ensure Docker has sufficient resources
   - Check Playwright browser installation

2. **CAPTCHA Solving Errors**
   - Verify 2Captcha API key and balance
   - Check network connectivity

3. **Temporal Connection Issues**
   - Verify Temporal server is running
   - Check network configuration

4. **WhatsApp Message Failures**
   - Validate AISensy credentials
   - Check phone number formatting

### Debug Mode

```bash
# Run with visible browser
export HEADLESS=false

# Enable debug logging
export LOG_LEVEL=DEBUG
```

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  cipc-runner:
    build: .
    ports:
      - "8000:8000"
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
    depends_on:
      - temporal

  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"
      - "8233:8233"
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests with:
- Deployment with resource limits
- ConfigMaps for environment variables
- Secrets for API keys
- Health checks and probes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

Proprietary - CIPC Agent

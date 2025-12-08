# Production Deployment Specification

**Version:** 1.0
**Date:** November 14, 2025
**Status:** Active

## 1. Executive Summary

This specification defines the production deployment requirements for the CIPC Agent platform, ensuring reliable, secure, and scalable infrastructure across all components. The deployment must support the complete workflow from Typebot lead capture through automated CIPC filing with enterprise-grade reliability.

## 2. Infrastructure Architecture

### 2.1 Component Overview

#### Core Services
- **Typebot Funnel:** Conversational lead capture and onboarding
- **Go Backend API:** Workflow orchestration and payment processing
- **Python CIPC Runner:** Automated filing agent with Temporal
- **PostgreSQL Database:** Encrypted data storage
- **Redis Cache:** Session and workflow state management
- **Monitoring Stack:** Prometheus, Grafana, and alerting

#### Supporting Infrastructure
- **Load Balancers:** Traffic distribution and SSL termination
- **CDN:** Static asset delivery and DDoS protection
- **Backup Systems:** Automated database and file backups
- **Secret Management:** Doppler for secure credential storage

### 2.2 Deployment Environments

#### Development Environment
- **Purpose:** Feature development and testing
- **Infrastructure:** Docker Compose local development
- **Data:** Ephemeral, refreshed from production snapshots
- **Access:** Development team only

#### Staging Environment
- **Purpose:** Integration testing and QA
- **Infrastructure:** Cloud deployment with production parity
- **Data:** Anonymized production data subset
- **Access:** Development and QA teams

#### Production Environment
- **Purpose:** Live customer traffic and revenue generation
- **Infrastructure:** Multi-region, high-availability deployment
- **Data:** Live customer and business data
- **Access:** Restricted, monitored access

## 3. Service Deployment Specifications

### 3.1 Typebot Deployment (verify-DEP-01)

#### Platform Selection
- **Primary:** Render (managed hosting)
- **Backup:** Railway or Fly.io
- **Scaling:** Automatic based on traffic

#### Configuration Requirements
```yaml
# render.yaml
services:
  - type: web
    name: cipc-agent-typebot
    env: docker
    dockerfilePath: ./typebot/Dockerfile
    envVars:
      - key: DATABASE_URL
        value: ${DATABASE_URL}
      - key: NEXTAUTH_SECRET
        value: ${NEXTAUTH_SECRET}
      - key: NEXTAUTH_URL
        value: ${NEXTAUTH_URL}
    healthCheckPath: /api/health
    disk:
      name: typebot-data
      mountPath: /app/data
      sizeGB: 10
```

#### Resource Allocation
- **CPU:** 1 vCPU (scalable to 4)
- **Memory:** 2GB (scalable to 8GB)
- **Storage:** 10GB persistent disk
- **Domains:** funnel.cipcagent.co.za

#### Security Configuration
- **SSL/TLS:** Auto-managed certificates
- **Firewall:** Restrict to necessary ports
- **Secrets:** Environment variables via Doppler
- **Monitoring:** Built-in Render monitoring

### 3.2 Go Backend Deployment (verify-DEP-02)

#### Platform Selection
- **Primary:** Fly.io (global deployment)
- **Backup:** Railway or Render
- **Scaling:** Horizontal pod autoscaling

#### Configuration Requirements
```yaml
# fly.toml
app = "cipc-agent-backend"
primary_region = "jnb"

[build]
  dockerfile = "backend/Dockerfile"

[env]
  PORT = "8080"
  DATABASE_URL = "postgres://..."
  REDIS_URL = "redis://..."

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
```

#### Resource Allocation
- **CPU:** 1 vCPU (scalable to 8)
- **Memory:** 512MB (scalable to 4GB)
- **Storage:** Ephemeral (data in PostgreSQL)
- **Regions:** Johannesburg primary, Cape Town backup

#### Security Configuration
- **SSL/TLS:** Automatic certificate management
- **Firewall:** Application-level security
- **Secrets:** Doppler integration
- **Health Checks:** /api/v1/health endpoint

### 3.3 Python CIPC Runner Deployment (verify-DEP-03)

#### Platform Selection
- **Primary:** Railway (managed containers)
- **Backup:** Fly.io or GCP Cloud Run
- **Scaling:** Event-driven scaling

#### Configuration Requirements
```yaml
# railway.toml or equivalent
[build]
  builder = "dockerfile"
  dockerfile = "Dockerfile"

[deploy]
  startCommand = "python main.py"
  healthcheckPath = "/health"
  healthcheckTimeout = 300

[env]
  TEMPORAL_HOST = "${TEMPORAL_HOST}"
  DATABASE_URL = "${DATABASE_URL}"
  CIPC_USERNAME = "${CIPC_USERNAME}"
  CIPC_PASSWORD = "${CIPC_PASSWORD}"
```

#### Resource Allocation
- **CPU:** 2 vCPU (scalable to 8)
- **Memory:** 4GB (scalable to 16GB)
- **Storage:** Ephemeral with cloud storage for artifacts
- **Concurrent Workflows:** 10 simultaneous filings

#### Security Configuration
- **Container Security:** Non-root user, minimal base image
- **Secret Management:** Encrypted environment variables
- **Network Security:** Private networking where possible
- **Audit Logging:** Complete workflow execution logs

### 3.4 Database Deployment (verify-DEP-04)

#### Platform Selection
- **Primary:** Railway PostgreSQL (managed)
- **Backup:** Fly.io Postgres or Supabase
- **High Availability:** Automatic failover

#### Configuration Requirements
```sql
-- Database schema requirements
CREATE DATABASE cipc_agent WITH
    ENCODING 'UTF8'
    LC_COLLATE='en_US.UTF-8'
    LC_CTYPE='en_US.UTF-8';

-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "temporal_tables";
```

#### Resource Allocation
- **CPU:** 2 vCPU (scalable)
- **Memory:** 4GB (scalable)
- **Storage:** 50GB (auto-scaling)
- **Connections:** 100 concurrent connections

#### Security Configuration
- **Encryption:** Data at rest encryption
- **SSL:** Required for all connections
- **Access Control:** IP whitelisting + authentication
- **Backup:** Daily automated backups

### 3.5 Temporal Workflow Engine (verify-DEP-05)

#### Platform Selection
- **Primary:** Temporal Cloud
- **Backup:** Self-hosted on Railway
- **Scaling:** Managed auto-scaling

#### Configuration Requirements
```yaml
# temporal.yaml
version: "1.0"
services:
  - name: temporal
    image: temporalio/server:latest
    environment:
      - SERVICES=frontend,matching,history,worker
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PWD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "7233:7233"
```

#### Resource Allocation
- **CPU:** 2 vCPU (scalable)
- **Memory:** 4GB (scalable)
- **Storage:** 100GB for workflow history
- **Retention:** 30 days workflow history

#### Security Configuration
- **Authentication:** API key authentication
- **Encryption:** TLS for all communications
- **Access Control:** Namespace-based isolation
- **Monitoring:** Built-in Temporal metrics

## 4. Network and Security Configuration

### 4.1 Domain and DNS Setup (verify-DEP-06)

#### Domain Configuration
```
cipcagent.co.za (primary domain)
├── funnel.cipcagent.co.za → Typebot instance
├── api.cipcagent.co.za → Go backend
└── app.cipcagent.co.za → Future dashboard
```

#### DNS Records
```dns
; A Records
funnel.cipcagent.co.za. 300 IN A <render-ip>
api.cipcagent.co.za. 300 IN A <fly-ip>

; CNAME Records
cipcagent.co.za. 300 IN CNAME cipcagent.co.za.
```

#### SSL Certificates
- **Provider:** Let's Encrypt (auto-renewal)
- **Validation:** DNS-01 challenge
- **Coverage:** All subdomains
- **HSTS:** Enabled with long max-age

### 4.2 Firewall and Network Security (verify-DEP-07)

#### CloudFlare Configuration
```yaml
# CloudFlare rules
- name: "Rate Limiting"
  expression: "(http.request.uri.path matches \"^/api/\")"
  action: "block"
  action_parameters:
    response:
      status_code: 429
      content: "Rate limit exceeded"

- name: "Security Headers"
  expression: "(http.request.method == \"GET\")"
  action: "rewrite"
  action_parameters:
    headers:
      - name: "X-Frame-Options"
        value: "DENY"
      - name: "X-Content-Type-Options"
        value: "nosniff"
      - name: "Referrer-Policy"
        value: "strict-origin-when-cross-origin"
```

#### Service-Level Firewalls
- **Typebot:** Restrict to necessary ports
- **Backend:** API gateway with rate limiting
- **Database:** Private networking only
- **CIPC Runner:** Outbound internet access only

### 4.3 Secret Management (verify-DEP-08)

#### Doppler Configuration
```yaml
# Doppler project structure
cipc-agent/
├── dev/
│   ├── database/
│   ├── api-keys/
│   └── cipc-credentials/
├── staging/
│   ├── database/
│   ├── api-keys/
│   └── cipc-credentials/
└── prod/
    ├── database/
    ├── api-keys/
    └── cipc-credentials/
```

#### Secret Types
- **Database Credentials:** PostgreSQL connection strings
- **API Keys:** Payment providers, AISensy, Typebot
- **CIPC Credentials:** Filing portal access
- **JWT Secrets:** Authentication signing keys
- **Encryption Keys:** Data encryption keys

## 5. Monitoring and Observability

### 5.1 Application Monitoring (verify-DEP-09)

#### Health Check Endpoints
```go
// Backend health check
GET /api/v1/health
Response: {
  "status": "healthy",
  "timestamp": "2025-11-14T13:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "temporal": "healthy"
  }
}
```

#### Metrics Collection
- **Prometheus:** Application and infrastructure metrics
- **Custom Metrics:** Business KPIs and SLIs
- **Logging:** Structured JSON logging
- **Tracing:** Distributed request tracing

### 5.2 Infrastructure Monitoring (verify-DEP-10)

#### Platform Monitoring
- **Fly.io:** Built-in metrics and alerting
- **Railway:** Performance monitoring
- **Render:** Application monitoring
- **CloudFlare:** Traffic and security analytics

#### Alert Configuration
```yaml
# Alert rules
groups:
  - name: cipc-agent
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.service }} is down"
```

### 5.3 Business Monitoring (verify-DEP-11)

#### Key Performance Indicators
- **Revenue Metrics:** Daily/weekly revenue tracking
- **Conversion Funnel:** Lead → Payment → Filing completion
- **User Experience:** Response times and error rates
- **Operational Efficiency:** Filing success rates

#### Dashboard Configuration
- **Grafana:** Real-time dashboards
- **Custom Panels:** Business metrics visualization
- **Alert Integration:** Slack/Teams notifications
- **Reporting:** Automated daily/weekly reports

## 6. Backup and Disaster Recovery

### 6.1 Data Backup Strategy (verify-DEP-12)

#### Database Backups
- **Frequency:** Daily full backups + hourly WAL
- **Retention:** 30 days rolling retention
- **Storage:** Encrypted cloud storage (AWS S3)
- **Testing:** Monthly backup restoration tests

#### Application Backups
- **Configuration:** Git-based infrastructure as code
- **Secrets:** Doppler backup and recovery procedures
- **Artifacts:** Docker images and deployment manifests
- **Documentation:** Runbooks and procedures

### 6.2 Disaster Recovery Plan (verify-DEP-13)

#### Recovery Time Objectives (RTO)
- **Critical Services:** 4 hours (Typebot, Backend, Payments)
- **Filing Service:** 24 hours (CIPC Runner)
- **Full System:** 48 hours

#### Recovery Point Objectives (RPO)
- **Customer Data:** 1 hour maximum data loss
- **Filing Records:** 15 minutes maximum data loss
- **Configuration:** No data loss (Git-based)

#### Failover Procedures
- **Regional Failover:** Automatic DNS failover
- **Service Failover:** Load balancer redirection
- **Data Failover:** Database replication failover
- **Communication:** Automated stakeholder notification

## 7. Deployment Process

### 7.1 CI/CD Pipeline (verify-DEP-14)

#### GitHub Actions Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: make test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Fly.io
        run: fly deploy
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-runner:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: railway deploy
        env:
          RAILWAY_API_TOKEN: ${{ secrets.RAILWAY_API_TOKEN }}
```

#### Deployment Stages
1. **Code Quality:** Linting, security scanning, unit tests
2. **Integration Testing:** API tests, contract tests
3. **Staging Deployment:** Automated staging deployment
4. **Smoke Testing:** Basic functionality validation
5. **Production Deployment:** Blue-green deployment
6. **Post-Deployment:** Monitoring and rollback monitoring

### 7.2 Rollback Procedures (verify-DEP-15)

#### Automated Rollback
- **Trigger Conditions:** Error rate >5%, response time >10s
- **Rollback Time:** <5 minutes
- **Data Safety:** No data loss during rollback
- **Verification:** Automated health checks

#### Manual Rollback
- **Process:** Version selection and deployment
- **Communication:** Team notification and status updates
- **Validation:** Manual testing before full traffic
- **Documentation:** Rollback incident report

## 8. Performance and Scaling

### 8.1 Capacity Planning (verify-DEP-16)

#### Current Requirements
- **Daily Users:** 100 leads/day
- **Concurrent Filings:** 10 simultaneous
- **API Requests:** 1000/hour
- **Data Storage:** 10GB/month

#### Future Scaling
- **Year 1 Target:** 1000 leads/day, 50 concurrent filings
- **Year 2 Target:** 5000 leads/day, 200 concurrent filings
- **Infrastructure:** Auto-scaling configuration
- **Cost Optimization:** Resource usage monitoring

### 8.2 Performance Optimization (verify-DEP-17)

#### Caching Strategy
- **Redis Cache:** Session data, API responses
- **CDN:** Static assets, Typebot resources
- **Database:** Query optimization, connection pooling
- **Application:** Response compression, async processing

#### Resource Optimization
- **Container Sizing:** Right-sizing based on usage
- **Auto-scaling:** CPU/memory-based scaling rules
- **Cost Monitoring:** Monthly cost analysis and optimization
- **Efficiency Metrics:** Resource usage per transaction

## 9. Compliance and Security

### 9.1 Security Audits (verify-DEP-18)

#### Regular Assessments
- **Frequency:** Quarterly security audits
- **Scope:** Infrastructure, application, and data security
- **Standards:** ISO 27001, SOC 2 Type II
- **Remediation:** 30-day critical finding resolution

#### Penetration Testing
- **Frequency:** Bi-annual external pentests
- **Coverage:** All public-facing services
- **Methodology:** OWASP Testing Guide
- **Reporting:** Executive summary and technical details

### 9.2 Compliance Monitoring (verify-DEP-19)

#### POPIA Compliance
- **Data Processing:** Audit logging of all data access
- **Consent Management:** Consent tracking and verification
- **Breach Notification:** Automated breach detection
- **Subject Rights:** DSAR processing capabilities

#### Operational Compliance
- **Change Management:** Version-controlled infrastructure
- **Access Control:** Least privilege access principles
- **Incident Response:** 24/7 incident response capability
- **Business Continuity:** Disaster recovery testing

## 10. Cost Optimization

### 10.1 Infrastructure Costs (verify-DEP-20)

#### Monthly Cost Breakdown
- **Typebot (Render):** $25/month
- **Backend (Fly.io):** $30/month
- **CIPC Runner (Railway):** $50/month
- **Database (Railway):** $40/month
- **Temporal (Cloud):** $50/month
- **Monitoring:** $20/month
- **Total:** ~$215/month (first 6 months free credits)

#### Cost Monitoring
- **Budget Alerts:** Monthly spending limits
- **Usage Analytics:** Resource utilization tracking
- **Optimization:** Rightsizing and reserved instances
- **Reporting:** Monthly cost reports

### 10.2 Scaling Economics

#### Unit Economics
- **Customer Acquisition Cost:** <R50 (marketing spend)
- **Customer Lifetime Value:** R199 (annual filing fee)
- **Gross Margin:** >80% (after payment processing fees)
- **Payback Period:** <3 months

#### Growth Projections
- **Month 6:** 500 customers, R99,500 revenue
- **Month 12:** 2000 customers, R398,000 revenue
- **Month 24:** 10000 customers, R1,990,000 revenue

## 11. Verification Checklist

### Infrastructure Verification
- [ ] verify-DEP-01: Typebot deployed and accessible
- [ ] verify-DEP-02: Go backend deployed and healthy
- [ ] verify-DEP-03: Python CIPC Runner deployed and operational
- [ ] verify-DEP-04: Database deployed with encryption
- [ ] verify-DEP-05: Temporal workflow engine operational

### Security Verification
- [ ] verify-DEP-06: Domain and DNS configured correctly
- [ ] verify-DEP-07: Network security configured
- [ ] verify-DEP-08: Secret management operational
- [ ] verify-DEP-18: Security audit completed
- [ ] verify-DEP-19: Compliance monitoring active

### Operations Verification
- [ ] verify-DEP-09: Application monitoring operational
- [ ] verify-DEP-10: Infrastructure monitoring active
- [ ] verify-DEP-11: Business monitoring dashboards created
- [ ] verify-DEP-12: Backup strategy implemented
- [ ] verify-DEP-13: Disaster recovery tested

### Deployment Verification
- [ ] verify-DEP-14: CI/CD pipeline operational
- [ ] verify-DEP-15: Rollback procedures tested
- [ ] verify-DEP-16: Capacity planning completed
- [ ] verify-DEP-17: Performance optimization implemented
- [ ] verify-DEP-20: Cost monitoring active

---

**This specification ensures production-ready deployment with enterprise-grade reliability, security, and scalability for the CIPC Agent platform.**

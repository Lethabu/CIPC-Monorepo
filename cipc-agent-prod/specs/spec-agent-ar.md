# CIPC Runner Agent Specification

**Version:** 1.0
**Date:** November 14, 2025
**Status:** Active

## 1. Executive Summary

This specification defines the requirements for the CIPC Runner (CRA), an automated Python agent that handles annual returns filing through the CIPC online portal. The agent must be reliable, secure, and capable of handling the complete filing workflow with minimal human intervention.

## 2. Core Functionality

### 2.1 Filing Workflow

#### Primary Use Case: Annual Returns Filing
The agent must automate the complete annual returns filing process:

1. **Company Verification:** Validate company details against CIPC records
2. **Document Preparation:** Generate required filing documents
3. **Portal Navigation:** Navigate CIPC online filing system
4. **Data Entry:** Accurately enter all required information
5. **Document Upload:** Upload supporting documents
6. **Payment Processing:** Handle filing fee payments
7. **Submission:** Complete and submit the filing
8. **Confirmation:** Retrieve and store filing confirmation

#### Supported Filing Types
- **AR01:** Annual Returns for private companies
- **AR02:** Annual Returns for personal liability companies
- **AR03:** Annual Returns for state-owned companies
- **AR04:** Annual Returns for non-profit companies

### 2.2 Data Sources

#### Input Data Structure
```json
{
  "company_number": "2021/123456/07",
  "company_name": "Example Company Pty Ltd",
  "financial_year_end": "2024-02-28",
  "email": "contact@company.com",
  "phone": "+27821234567",
  "contact_name": "John Doe",
  "address": "123 Main Street, Cape Town, 8000",
  "business_activity": "Software Development Services",
  "director_name": "Jane Doe",
  "director_id": "8501011234567",
  "shareholders": [
    {
      "name": "John Doe",
      "id_number": "8501011234567",
      "shares": 100
    }
  ]
}
```

#### CIPC Portal Integration
- **Base URL:** https://www.cipc.co.za/
- **Filing Portal:** https://efile.cipc.co.za/
- **Authentication:** Secure login with provided credentials
- **Session Management:** Handle session timeouts and reconnections

## 3. Technical Requirements

### 3.1 Technology Stack

#### Core Technologies
- **Language:** Python 3.11+
- **Browser Automation:** Playwright 1.40+
- **Database:** PostgreSQL 15+ with SQLAlchemy
- **Workflow Engine:** Temporal 1.20+
- **Container:** Docker with multi-stage builds
- **Monitoring:** Prometheus + Grafana

#### Key Dependencies
```python
playwright==1.40.0
temporalio==1.4.0
sqlalchemy==2.0.0
pydantic==2.5.0
httpx==0.25.0
structlog==23.2.0
```

### 3.2 Architecture

#### Agent Components
- **Workflow Orchestrator:** Temporal workflow management
- **Browser Controller:** Playwright browser automation
- **Data Processor:** Pydantic data validation and processing
- **Document Generator:** PDF generation for filings
- **Payment Handler:** Integration with Ozow/PayFast
- **Notification Service:** WhatsApp updates via AISensy

#### Workflow States
```python
class FilingStatus(str, Enum):
    PENDING = "pending"
    VERIFICATION = "verification"
    PREPARATION = "preparation"
    FILING = "filing"
    PAYMENT = "payment"
    SUBMISSION = "submission"
    CONFIRMATION = "confirmation"
    COMPLETED = "completed"
    FAILED = "failed"
```

### 3.3 Security Requirements

#### Data Protection
- **Encryption:** All sensitive data encrypted at rest
- **Credentials:** Secure credential management (no hardcoding)
- **Session Security:** Secure browser sessions with cleanup
- **Audit Logging:** Complete audit trail of all actions

#### Compliance
- **POPIA:** Data minimization and purpose limitation
- **Access Control:** Role-based access to filing operations
- **Error Handling:** Secure error messages (no data leakage)

## 4. Filing Process Specification

### 4.1 Step-by-Step Workflow

#### Step 1: Pre-Flight Checks (verify-CRA-01)
```
Input: Lead data from Typebot
Process:
- Validate company number format
- Check filing deadline (9 months after financial year end)
- Verify required data completeness
- Check for existing filings
Output: Filing eligibility status
```

#### Step 2: Company Verification (verify-CRA-02)
```
Input: Company number
Process:
- Navigate to CIPC company search
- Enter company registration number
- Extract current company details
- Compare with provided data
- Flag discrepancies for review
Output: Verification report
```

#### Step 3: Document Preparation (verify-CRA-03)
```
Input: Verified company data
Process:
- Generate Annual Returns form (CIPC Form AR01/02/03/04)
- Populate all required fields
- Create director/shareholder schedules
- Generate PDF documents
- Validate document completeness
Output: Filing package
```

#### Step 4: Portal Login (verify-CRA-04)
```
Input: CIPC credentials
Process:
- Navigate to eFiling portal
- Enter username/password
- Handle 2FA if required
- Verify successful authentication
- Set session preferences
Output: Active session
```

#### Step 5: Filing Initiation (verify-CRA-05)
```
Input: Filing package
Process:
- Select appropriate filing type
- Enter company details
- Upload prepared documents
- Review and confirm filing information
- Proceed to payment section
Output: Draft filing
```

#### Step 6: Payment Processing (verify-CRA-06)
```
Input: Filing draft
Process:
- Calculate filing fees
- Initiate payment through Ozow/PayFast
- Handle payment confirmation
- Update filing status
- Proceed to submission
Output: Paid filing ready for submission
```

#### Step 7: Final Submission (verify-CRA-07)
```
Input: Paid filing
Process:
- Review final filing details
- Submit to CIPC
- Retrieve filing reference number
- Download confirmation documents
- Update workflow status
Output: Completed filing confirmation
```

#### Step 8: Post-Filing Actions (verify-CRA-08)
```
Input: Filing confirmation
Process:
- Send WhatsApp notification to client
- Store filing records in database
- Generate client report
- Schedule follow-up reminders
- Archive session data
Output: Completed workflow
```

## 5. Error Handling & Recovery

### 5.1 Error Categories

#### Validation Errors
- **Data Incomplete:** Missing required fields
- **Format Invalid:** Incorrect data formats
- **Deadline Passed:** Filing submitted after deadline
- **Company Invalid:** Company not found or deregistered

#### System Errors
- **Network Issues:** Connection timeouts or failures
- **Portal Changes:** CIPC website updates breaking automation
- **Session Expired:** Authentication session timeout
- **Rate Limiting:** Too many requests to CIPC portal

#### Business Logic Errors
- **Payment Failed:** Payment processing errors
- **Document Rejected:** Invalid document formats
- **Duplicate Filing:** Attempted duplicate submission

### 5.2 Recovery Strategies

#### Automatic Recovery
- **Retry Logic:** Exponential backoff for transient errors
- **Session Refresh:** Automatic re-authentication
- **Data Refresh:** Re-fetch company data if stale

#### Manual Intervention
- **Alert Generation:** Notify support team for critical errors
- **Workflow Pause:** Suspend workflow for manual review
- **Fallback Process:** Alternative filing methods

#### Error Reporting
- **Client Notification:** Clear error messages via WhatsApp
- **Support Dashboard:** Detailed error logs for debugging
- **Metrics Collection:** Error rate monitoring and alerting

## 6. Performance Requirements

### 6.1 Timing Requirements

#### Filing Duration
- **Target:** Complete filing within 15 minutes
- **Maximum:** 45 minutes before timeout
- **Average:** < 20 minutes across all filings

#### Step Timeouts
- **Verification:** 5 minutes
- **Document Prep:** 2 minutes
- **Portal Login:** 3 minutes
- **Filing Process:** 10 minutes
- **Payment:** 5 minutes
- **Submission:** 5 minutes

### 6.2 Scalability

#### Concurrent Filings
- **Target:** 10 simultaneous filings
- **Peak:** 25 filings during busy periods
- **Queue Management:** Handle 100+ queued filings

#### Resource Usage
- **Memory:** < 512MB per filing instance
- **CPU:** < 20% average utilization
- **Storage:** < 100MB per filing record

## 7. Monitoring & Observability

### 7.1 Key Metrics

#### Business Metrics
- **Success Rate:** >95% successful filings
- **Completion Time:** Average filing duration
- **Error Rate:** <5% failed filings
- **Client Satisfaction:** WhatsApp feedback scores

#### Technical Metrics
- **Uptime:** 99.9% agent availability
- **Response Time:** <30s average step completion
- **Error Recovery:** >90% automatic error recovery
- **Resource Usage:** Monitor CPU, memory, disk

### 7.2 Logging & Alerting

#### Log Levels
- **INFO:** Normal operations and milestones
- **WARN:** Recoverable errors and anomalies
- **ERROR:** Critical failures requiring attention
- **DEBUG:** Detailed troubleshooting information

#### Alert Conditions
- **Filing Failures:** >3 failed filings in 1 hour
- **Performance Degradation:** >50% increase in completion time
- **System Errors:** Any critical system failures
- **Security Events:** Unauthorized access attempts

## 8. Testing Requirements

### 8.1 Automated Testing

#### Unit Tests
- **Coverage:** >90% code coverage
- **Components:** All business logic functions
- **Mocking:** External dependencies (CIPC portal, payments)

#### Integration Tests
- **End-to-End:** Complete filing workflow
- **API Integration:** Temporal, AISensy, Ozow/PayFast
- **Browser Tests:** Playwright automation validation

#### Performance Tests
- **Load Testing:** Concurrent filing capacity
- **Stress Testing:** System limits and recovery
- **Soak Testing:** Long-duration stability

### 8.2 Manual Testing

#### User Acceptance Testing
- **Business Scenarios:** Real company filings
- **Edge Cases:** Unusual company structures
- **Error Scenarios:** Network failures, portal changes

#### Regression Testing
- **Portal Updates:** Test after CIPC website changes
- **Dependency Updates:** Test after library updates
- **Configuration Changes:** Test after environment changes

## 9. Deployment & Operations

### 9.1 Containerization

#### Docker Configuration
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

#### Multi-Stage Build
- **Builder Stage:** Compile dependencies
- **Runtime Stage:** Minimal production image
- **Security:** Non-root user, minimal attack surface

### 9.2 Environment Configuration

#### Development
- **Local Testing:** Docker Compose setup
- **Debug Mode:** Detailed logging and breakpoints
- **Mock Services:** Simulated CIPC portal for testing

#### Production
- **Railway/Fly.io:** Container deployment
- **Environment Variables:** Secure credential management
- **Health Checks:** Application and dependency monitoring

### 9.3 Backup & Recovery

#### Data Backup
- **Filing Records:** Daily database backups
- **Logs:** 30-day log retention
- **Configuration:** Version-controlled infrastructure

#### Disaster Recovery
- **Failover:** Multi-region deployment capability
- **Data Recovery:** Point-in-time database restoration
- **Business Continuity:** Manual filing fallback procedures

## 10. Verification Checklist

### Functional Verification
- [ ] verify-CRA-01: Pre-flight checks pass for valid data
- [ ] verify-CRA-02: Company verification successful
- [ ] verify-CRA-03: Document preparation completes
- [ ] verify-CRA-04: Portal login successful
- [ ] verify-CRA-05: Filing initiation works
- [ ] verify-CRA-06: Payment processing integrates
- [ ] verify-CRA-07: Final submission completes
- [ ] verify-CRA-08: Post-filing actions execute

### Performance Verification
- [ ] verify-CRA-09: Filing completes within 15 minutes
- [ ] verify-CRA-10: Handles 10 concurrent filings
- [ ] verify-CRA-11: Error recovery >90% automatic
- [ ] verify-CRA-12: Resource usage within limits

### Security Verification
- [ ] verify-CRA-13: No sensitive data in logs
- [ ] verify-CRA-14: Secure credential handling
- [ ] verify-CRA-15: Audit trail complete
- [ ] verify-CRA-16: POPIA compliance maintained

---

**This specification ensures the CIPC Runner agent provides reliable, secure, and efficient automated annual returns filing while maintaining enterprise-grade standards.**

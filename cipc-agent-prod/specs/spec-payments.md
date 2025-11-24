# Payment Processing Specification

**Version:** 1.0
**Date:** November 14, 2025
**Status:** Active

## 1. Executive Summary

This specification defines the payment processing requirements for the CIPC Agent platform, focusing on secure integration with Ozow and PayFast payment gateways. The system must handle R199 annual returns filing fees with enterprise-grade security, reliability, and compliance.

## 2. Payment Flow Overview

### 2.1 Primary Payment Flow
```
Typebot Lead Capture → Payment Link Generation → Customer Payment → Webhook Confirmation → Workflow Trigger → Filing Process
```

### 2.2 Supported Payment Methods
- **Ozow:** Instant EFT, credit cards, debit cards
- **PayFast:** Credit cards, debit cards, instant EFT
- **Fallback:** Automatic failover between providers

### 2.3 Payment Amounts
- **Annual Returns Filing:** R199.00 (including VAT)
- **Future Services:** Extensible for additional service tiers

## 3. Technical Requirements

### 3.1 Technology Stack

#### Core Technologies
- **Backend:** Go 1.21+ with Gin framework
- **Database:** PostgreSQL 15+ with encryption
- **Security:** AES-256 encryption, HMAC signatures
- **Monitoring:** Structured logging, metrics collection
- **Testing:** Comprehensive integration testing

#### Key Dependencies
```go
github.com/gin-gonic/gin v1.9.1
github.com/lib/pq v1.10.9
golang.org/x/crypto v0.14.0
github.com/golang-jwt/jwt/v5 v5.2.0
```

### 3.2 Architecture

#### Payment Components
- **Payment Service:** Core payment processing logic
- **Webhook Handler:** Secure webhook verification and processing
- **Refund Manager:** Automated refund processing
- **Audit Logger:** Complete payment transaction audit trail
- **Notification Service:** Payment status updates via WhatsApp

#### Payment States
```go
type PaymentStatus string

const (
    PaymentPending    PaymentStatus = "pending"
    PaymentInitiated  PaymentStatus = "initiated"
    PaymentCompleted  PaymentStatus = "completed"
    PaymentFailed     PaymentStatus = "failed"
    PaymentRefunded   PaymentStatus = "refunded"
    PaymentCancelled  PaymentStatus = "cancelled"
)
```

## 4. Payment Processing Specification

### 4.1 Payment Link Generation (verify-PAY-01)

#### API Endpoint
```
POST /api/v1/payments/create
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "amount": 19900,
  "currency": "ZAR",
  "reference": "AUTO",
  "description": "CIPC Annual Returns Filing",
  "customer": {
    "company_number": "2021/123456/07",
    "email": "contact@company.com",
    "phone": "+27821234567",
    "name": "John Doe"
  },
  "success_url": "https://cipcagent.co.za/payment/success",
  "cancel_url": "https://cipcagent.co.za/payment/cancel",
  "notify_url": "https://api.cipcagent.co.za/webhooks/payment"
}
```

#### Response Format
```json
{
  "payment_id": "pay_abc123def456",
  "reference": "PAY-20251114-001",
  "payment_url": "https://pay.ozow.com/secure/abc123...",
  "expires_at": "2025-11-14T14:30:00Z",
  "status": "initiated"
}
```

#### Validation Requirements
- **Amount Range:** R50 - R10,000 (configurable)
- **Currency:** ZAR only
- **Reference:** Unique, auto-generated
- **Customer Data:** Valid email and phone number
- **URLs:** HTTPS only, domain validation

### 4.2 Ozow Integration (verify-PAY-02)

#### API Configuration
- **Base URL:** https://api.ozow.com
- **Authentication:** API Key + Private Key
- **Environment:** Production and sandbox
- **Timeout:** 30 seconds per request

#### Required Fields
```json
{
  "countryCode": "ZA",
  "amount": "199.00",
  "transactionReference": "PAY-20251114-001",
  "bankReference": "CIPC-AR-2021/123456/07",
  "optional1": "cipc_filing",
  "optional2": "2021/123456/07",
  "optional3": "john@company.com",
  "optional4": "+27821234567",
  "siteCode": "CIPCA-001",
  "notifyUrl": "https://api.cipcagent.co.za/webhooks/ozow",
  "successUrl": "https://cipcagent.co.za/payment/success",
  "errorUrl": "https://cipcagent.co.za/payment/error",
  "cancelUrl": "https://cipcagent.co.za/payment/cancel"
}
```

#### Security Measures
- **HMAC Signature:** SHA512 hash of request data
- **Private Key:** RSA 2048-bit encryption
- **Certificate Validation:** SSL/TLS 1.3 required

### 4.3 PayFast Integration (verify-PAY-03)

#### API Configuration
- **Base URL:** https://api.payfast.co.za
- **Authentication:** Merchant ID + Key
- **Environment:** Production and sandbox
- **Timeout:** 30 seconds per request

#### Required Fields
```json
{
  "merchant_id": "12345678",
  "merchant_key": "abcdefghijklmnop",
  "amount": "199.00",
  "item_name": "CIPC Annual Returns Filing",
  "item_description": "Automated filing for 2021/123456/07",
  "email_address": "john@company.com",
  "cell_number": "0821234567",
  "email_confirmation": "1",
  "confirmation_address": "john@company.com",
  "payment_method": "cc",
  "return_url": "https://cipcagent.co.za/payment/success",
  "cancel_url": "https://cipcagent.co.za/payment/cancel",
  "notify_url": "https://api.cipcagent.co.za/webhooks/payfast"
}
```

#### Security Measures
- **MD5 Signature:** Hash of key payment fields
- **ITN Validation:** Instant Transaction Notification verification
- **IP Whitelisting:** PayFast server IPs only

### 4.4 Webhook Processing (verify-PAY-04)

#### Webhook Security
- **Signature Verification:** HMAC-SHA256 validation
- **IP Validation:** Whitelist of payment provider IPs
- **Idempotency:** Duplicate webhook detection
- **Timeout Handling:** 10-second processing timeout

#### Ozow Webhook Payload
```json
{
  "transactionId": "abc123def456",
  "transactionReference": "PAY-20251114-001",
  "amount": "199.00",
  "status": "Complete",
  "optional1": "cipc_filing",
  "optional2": "2021/123456/07",
  "optional3": "john@company.com",
  "optional4": "+27821234567",
  "created": "2025-11-14T13:30:00Z",
  "completed": "2025-11-14T13:31:00Z"
}
```

#### PayFast Webhook Payload
```json
{
  "m_payment_id": "abc123def456",
  "pf_payment_id": "123456789",
  "payment_status": "COMPLETE",
  "item_name": "CIPC Annual Returns Filing",
  "amount_gross": "199.00",
  "amount_fee": "5.97",
  "amount_net": "193.03",
  "email_address": "john@company.com",
  "merchant_id": "12345678",
  "signature": "a1b2c3d4e5f6..."
}
```

#### Processing Logic
1. **Verify Signature:** Validate webhook authenticity
2. **Check Status:** Confirm payment completion
3. **Update Database:** Mark payment as completed
4. **Trigger Workflow:** Initiate Temporal filing workflow
5. **Send Notification:** WhatsApp confirmation to customer
6. **Audit Log:** Record all webhook processing

### 4.5 Payment Reconciliation (verify-PAY-05)

#### Daily Reconciliation Process
- **Time:** 02:00 SAST daily
- **Scope:** Previous day's transactions
- **Method:** Compare system records with payment provider statements
- **Discrepancy Handling:** Automated alerts for mismatches

#### Reconciliation Report
```json
{
  "date": "2025-11-14",
  "total_transactions": 25,
  "total_amount": 4975.00,
  "matched_transactions": 24,
  "discrepancies": [
    {
      "reference": "PAY-20251114-015",
      "system_amount": 199.00,
      "provider_amount": 0.00,
      "status": "investigation_required"
    }
  ],
  "reconciliation_status": "partial_match"
}
```

## 5. Error Handling & Recovery

### 5.1 Payment Errors

#### Common Error Scenarios
- **Network Timeout:** Payment provider unreachable
- **Invalid Credentials:** API key/authentication failure
- **Amount Mismatch:** Payment amount doesn't match request
- **Duplicate Payment:** Same reference used twice
- **Card Declined:** Customer payment method rejected

#### Recovery Strategies
- **Automatic Retry:** Network errors with exponential backoff
- **Provider Failover:** Switch to alternative payment provider
- **Manual Intervention:** Support team handles complex cases
- **Customer Notification:** Clear error messages and next steps

### 5.2 Refund Processing (verify-PAY-06)

#### Refund Eligibility
- **Time Window:** Within 30 days of payment
- **Conditions:** Filing not yet submitted to CIPC
- **Amount:** Full refund minus payment processing fees
- **Process:** Automated approval for eligible refunds

#### Refund Workflow
```json
{
  "refund_id": "ref_abc123def456",
  "original_payment_id": "pay_abc123def456",
  "amount": 19900,
  "reason": "customer_request",
  "status": "processing",
  "processed_at": "2025-11-14T14:00:00Z"
}
```

## 6. Security Requirements

### 6.1 Data Protection

#### Payment Data Handling
- **PCI DSS Compliance:** Level 2 requirements
- **Data Minimization:** Store only essential payment data
- **Encryption:** AES-256 for all sensitive data
- **Tokenization:** Payment method tokenization

#### Secure Storage
- **Database Encryption:** Transparent data encryption
- **Key Management:** AWS KMS or equivalent
- **Access Logging:** All payment data access audited
- **Retention Policy:** 7 years for compliance records

### 6.2 API Security

#### Authentication
- **JWT Tokens:** Short-lived access tokens
- **API Keys:** Environment-specific keys
- **Rate Limiting:** 100 requests per minute per IP
- **Request Validation:** Comprehensive input sanitization

#### Monitoring
- **Security Events:** Real-time threat detection
- **Anomaly Detection:** Unusual payment patterns
- **Compliance Alerts:** Regulatory requirement monitoring
- **Incident Response:** 24/7 security team availability

## 7. Performance Requirements

### 7.1 Response Times

#### API Endpoints
- **Payment Creation:** <2 seconds average
- **Webhook Processing:** <5 seconds average
- **Status Checks:** <1 second average
- **Refund Processing:** <10 seconds average

#### Payment Providers
- **Ozow:** <30 seconds for payment completion
- **PayFast:** <60 seconds for payment completion
- **Timeout:** 5 minutes maximum payment window

### 7.2 Scalability

#### Transaction Volume
- **Daily Target:** 100 payments per day
- **Peak Capacity:** 500 payments per day
- **Concurrent Processing:** 50 simultaneous payments
- **Queue Management:** Handle traffic spikes gracefully

#### Resource Usage
- **Memory:** <256MB per payment instance
- **CPU:** <10% average utilization
- **Database:** <100ms average query time
- **Network:** <50KB per payment transaction

## 8. Monitoring & Observability

### 8.1 Key Metrics

#### Business Metrics
- **Conversion Rate:** Payment completion percentage
- **Average Order Value:** R199 (fixed for now)
- **Refund Rate:** <2% of total payments
- **Payment Method Mix:** Ozow vs PayFast distribution

#### Technical Metrics
- **API Availability:** 99.9% uptime SLA
- **Payment Success Rate:** >98% successful payments
- **Webhook Delivery:** >99.9% successful deliveries
- **Processing Time:** Average payment completion time

### 8.2 Alerting

#### Critical Alerts
- **Payment Failures:** >5 failed payments in 1 hour
- **System Downtime:** Any payment service unavailability
- **Security Incidents:** Unauthorized access attempts
- **Provider Issues:** Payment provider API failures

#### Performance Alerts
- **Slow Responses:** API response time >5 seconds
- **High Error Rates:** >2% error rate sustained
- **Queue Backlog:** >100 pending payments
- **Resource Usage:** >80% resource utilization

## 9. Testing Requirements

### 9.1 Automated Testing

#### Unit Tests
- **Coverage:** >95% code coverage
- **Mocking:** Payment provider API simulation
- **Security Testing:** Input validation and sanitization
- **Error Scenarios:** All error conditions tested

#### Integration Tests
- **Payment Flow:** End-to-end payment processing
- **Webhook Testing:** Secure webhook verification
- **Provider Failover:** Automatic provider switching
- **Database Testing:** Transaction consistency

#### Load Testing
- **Concurrent Users:** 100 simultaneous payment attempts
- **Transaction Volume:** 1000 payments per hour
- **System Limits:** Maximum capacity validation
- **Recovery Testing:** System behavior under stress

### 9.2 Manual Testing

#### User Acceptance Testing
- **Payment Flow:** Complete customer payment experience
- **Error Handling:** Customer-facing error scenarios
- **Mobile Testing:** Payment flow on mobile devices
- **Cross-Browser:** Compatibility across browsers

#### Security Testing
- **Penetration Testing:** External security assessment
- **Compliance Audit:** PCI DSS and POPIA compliance
- **Vulnerability Scanning:** Regular security scans
- **Code Review:** Security-focused code reviews

## 10. Deployment & Operations

### 10.1 Environment Configuration

#### Development
- **Sandbox Accounts:** Test payment provider accounts
- **Mock Payments:** Simulated payment processing
- **Debug Logging:** Detailed transaction logging
- **Test Data:** Safe test payment data

#### Production
- **Live Accounts:** Production payment provider credentials
- **Secure Variables:** Doppler or equivalent secret management
- **Monitoring:** Full production monitoring stack
- **Backup:** Daily database and configuration backups

### 10.2 Deployment Process

#### Blue-Green Deployment
- **Zero Downtime:** Traffic switching without interruption
- **Rollback Plan:** Immediate rollback capability
- **Testing:** Automated post-deployment testing
- **Monitoring:** Real-time deployment monitoring

#### Configuration Management
- **Version Control:** All configuration in Git
- **Environment Parity:** Consistent configurations
- **Secret Rotation:** Automated credential rotation
- **Change Tracking:** Complete audit trail

## 11. Compliance Requirements

### 11.1 Regulatory Compliance

#### POPIA Compliance
- **Data Processing:** Lawful payment data processing
- **Consent Management:** Clear payment consent
- **Data Retention:** Compliant data retention periods
- **Subject Rights:** Customer data access and deletion

#### Financial Compliance
- **FICA Requirements:** Customer identification verification
- **AML Monitoring:** Anti-money laundering checks
- **Transaction Reporting:** Regulatory transaction reporting
- **Audit Trail:** Complete financial transaction audit

### 11.2 Industry Standards

#### PCI DSS Compliance
- **Data Security:** Secure payment data handling
- **Access Control:** Restricted payment system access
- **Monitoring:** Continuous security monitoring
- **Testing:** Regular security testing and validation

#### Industry Best Practices
- **Secure Coding:** OWASP security guidelines
- **Logging Standards:** Structured security logging
- **Incident Response:** Defined security incident procedures
- **Third-Party Risk:** Payment provider risk assessment

## 12. Verification Checklist

### Functional Verification
- [ ] verify-PAY-01: Payment link generation works correctly
- [ ] verify-PAY-02: Ozow integration processes payments successfully
- [ ] verify-PAY-03: PayFast integration processes payments successfully
- [ ] verify-PAY-04: Webhook processing handles all scenarios
- [ ] verify-PAY-05: Payment reconciliation identifies discrepancies
- [ ] verify-PAY-06: Refund processing works for eligible payments

### Security Verification
- [ ] verify-PAY-07: Payment data encrypted at rest and in transit
- [ ] verify-PAY-08: Webhook signatures verified correctly
- [ ] verify-PAY-09: PCI DSS compliance requirements met
- [ ] verify-PAY-10: POPIA compliance maintained for payment data

### Performance Verification
- [ ] verify-PAY-11: Payment processing completes within SLA
- [ ] verify-PAY-12: System handles peak transaction volumes
- [ ] verify-PAY-13: Webhook processing meets timing requirements
- [ ] verify-PAY-14: Error recovery works automatically

---

**This specification ensures secure, reliable, and compliant payment processing for the CIPC Agent platform with enterprise-grade security and monitoring.**

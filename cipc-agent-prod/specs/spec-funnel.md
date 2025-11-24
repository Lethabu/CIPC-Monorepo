# Typebot Conversational Funnel Specification

**Version:** 1.0
**Date:** November 14, 2025
**Status:** Active

## 1. Executive Summary

This specification defines the conversational lead capture and onboarding flow for the CIPC Agent platform using Typebot. The funnel must collect all necessary information for automated annual returns filing while maintaining POPIA compliance and excellent user experience.

## 2. Funnel Objectives

### Primary Goals
- **Lead Capture:** Collect complete company and contact information
- **Qualification:** Verify company eligibility for annual returns filing
- **Payment Setup:** Guide users through payment process
- **Onboarding:** Seamless transition to automated filing service

### Success Metrics
- **Completion Rate:** >70% funnel completion
- **Data Quality:** >95% accurate information collection
- **Payment Conversion:** >80% payment completion
- **User Satisfaction:** >4.5/5 rating

## 3. Conversational Flow Structure

### 3.1 Welcome & Introduction (Step 1-3)

#### Step 1: Greeting & Value Proposition
```
Bot: "👋 Hi! I'm the CIPC Agent. I can help you file your company's annual returns automatically.

This saves you hours of paperwork and ensures compliance with CIPC requirements.

Ready to get started?"
```
- **Options:** "Yes, let's begin" | "Tell me more" | "Not now"
- **Verification:** verify-FUN-01 - Welcome message displays correctly

#### Step 2: Service Explanation
```
Bot: "I'll guide you through a quick process to:
✅ Collect your company details
✅ Verify filing requirements
✅ Process secure payment (R199)
✅ Handle the filing automatically
✅ Send updates via WhatsApp

Everything is POPIA compliant and secure."
```
- **Options:** "Continue" | "Privacy Info" | "Cancel"
- **Verification:** verify-FUN-02 - Service benefits clearly explained

#### Step 3: Consent & Privacy
```
Bot: "🔒 Your privacy matters. We only collect information required for CIPC filing.

By continuing, you agree to:
• Data processing for filing purposes only
• Secure storage with encryption
• Right to access/delete your data

View our Privacy Policy: [link]"
```
- **Options:** "I agree, continue" | "View Privacy Policy" | "Cancel"
- **Verification:** verify-FUN-03 - POPIA consent obtained before data collection

### 3.2 Company Information Collection (Step 4-8)

#### Step 4: Company Registration Number
```
Bot: "What's your company registration number?
(Format: YYYY/NNNNNN/NN - e.g., 2021/123456/07)"
```
- **Input Type:** Text with validation
- **Validation:** Regex pattern for CIPC format
- **Error Handling:** "That doesn't look like a valid CIPC number. Please check and try again."
- **Verification:** verify-FUN-04 - CIPC number format validated

#### Step 5: Company Name Confirmation
```
Bot: "Great! Let me verify that's correct.

Company: [Lookup from CIPC database]
Registration: [User input]

Is this your company?"
```
- **Options:** "Yes, correct" | "No, let me fix it" | "Search again"
- **API Integration:** CIPC company lookup
- **Verification:** verify-FUN-05 - Company verification successful

#### Step 6: Financial Year End
```
Bot: "What's your company's financial year end date?
(This determines your annual returns due date)"
```
- **Input Type:** Date picker
- **Default:** Previous year December 31st
- **Validation:** Past date, not future
- **Verification:** verify-FUN-06 - Financial year end captured

#### Step 7: Contact Information
```
Bot: "Who should we contact about the filing?

📧 Email address:
📱 Phone number (for WhatsApp updates):
👤 Contact person name:"
```
- **Input Types:** Email, phone, text
- **Validation:** Email format, South African phone number
- **Verification:** verify-FUN-07 - Contact details validated

#### Step 8: Additional Details
```
Bot: "Almost done! We need a few more details for the filing:

🏢 Registered office address:
📊 Business activity description:
💼 Director details (name & ID):"
```
- **Input Types:** Text areas with character limits
- **Required Fields:** All mandatory for CIPC filing
- **Verification:** verify-FUN-08 - All required filing data collected

### 3.3 Payment & Confirmation (Step 9-12)

#### Step 9: Cost Breakdown
```
Bot: "📋 Filing Summary:

Company: [Company Name]
Due Date: [Calculated due date]
Service Fee: R199 (incl. VAT)

This includes:
• Annual returns preparation
• CIPC submission
• Filing confirmation
• WhatsApp status updates

Ready to proceed with payment?"
```
- **Options:** "Pay R199 Now" | "Review Details" | "Cancel"
- **Verification:** verify-FUN-09 - Cost clearly displayed

#### Step 10: Payment Processing
```
Bot: "🔐 Secure Payment

Click below to pay R199 securely via Ozow or PayFast.
You'll be redirected to complete payment, then filing will begin automatically."
```
- **Integration:** Ozow/PayFast payment link generation
- **Webhook:** Payment confirmation triggers workflow
- **Verification:** verify-FUN-10 - Payment link generated correctly

#### Step 11: Payment Confirmation
```
Bot: "✅ Payment Received!

Reference: [PAY-12345]
Amount: R199
Time: [Timestamp]

Your filing is now being processed. You'll receive WhatsApp updates at each step."
```
- **Webhook Trigger:** Payment success → Temporal workflow
- **Verification:** verify-FUN-11 - Payment confirmation sent

#### Step 12: Next Steps & Support
```
Bot: "🚀 What's Next?

1. 📝 We'll prepare your annual returns
2. 🤖 Submit to CIPC automatically
3. 📱 Send you filing confirmation
4. 💬 Keep you updated via WhatsApp

Questions? Reply here or call 021-123-4567

Thank you for choosing CIPC Agent!"
```
- **Options:** "Track Progress" | "Contact Support" | "Done"
- **Verification:** verify-FUN-12 - Clear next steps provided

## 4. Technical Implementation

### 4.1 Typebot Configuration

#### Bot Settings
- **Name:** CIPC Agent Onboarding
- **Theme:** Professional blue (#0066CC)
- **Avatar:** CIPC Agent logo
- **Language:** English
- **Timezone:** Africa/Johannesburg

#### Variables Storage
```json
{
  "company_number": "",
  "company_name": "",
  "financial_year_end": "",
  "email": "",
  "phone": "",
  "contact_name": "",
  "address": "",
  "business_activity": "",
  "director_name": "",
  "director_id": "",
  "payment_reference": "",
  "status": "lead_captured"
}
```

### 4.2 API Integrations

#### CIPC Company Lookup
```
GET /api/v1/cipc/lookup/{company_number}
Response: { "name": "Company Name", "status": "Active" }
```

#### Payment Link Generation
```
POST /api/v1/payments/create
Body: { "amount": 19900, "reference": "AUTO", "customer": {...} }
Response: { "payment_url": "https://pay.ozow.com/..." }
```

#### Workflow Trigger
```
POST /api/v1/flows/onboard
Body: { "lead_data": {...}, "payment_ref": "PAY-123" }
Response: { "workflow_id": "wf_123", "status": "started" }
```

### 4.3 Webhook Handling

#### Payment Success Webhook
```json
{
  "event": "payment.completed",
  "payment_reference": "PAY-12345",
  "amount": 19900,
  "customer": {
    "company_number": "2021/123456/07",
    "email": "contact@company.com",
    "phone": "+27821234567"
  }
}
```

#### Typebot Completion Webhook
```json
{
  "event": "form.completed",
  "resultId": "abc123",
  "variables": {
    "company_number": "2021/123456/07",
    "company_name": "Example Company Pty Ltd",
    "financial_year_end": "2024-02-28",
    "email": "contact@company.com",
    "phone": "+27821234567",
    "contact_name": "John Doe",
    "address": "123 Main St, Cape Town",
    "business_activity": "Software Development",
    "director_name": "Jane Doe",
    "director_id": "8501011234567"
  }
}
```

## 5. Error Handling & Edge Cases

### 5.1 Validation Errors

#### Invalid CIPC Number
```
Bot: "❌ That company registration number doesn't seem valid.

Please check:
• Format: YYYY/NNNNNN/NN
• Company exists and is active
• No typos in the number

Try again or contact support."
```

#### Company Not Found
```
Bot: "🔍 We couldn't find that company in CIPC records.

This could mean:
• Company deregistered
• Number entered incorrectly
• New company not yet registered

Please verify and try again."
```

#### Payment Failed
```
Bot: "❌ Payment was not successful.

Common reasons:
• Insufficient funds
• Card declined
• Bank error

Try again or contact your bank."
```

### 5.2 Fallback Options

#### Manual Data Entry
- Allow users to enter company details manually if lookup fails
- Verification: verify-FUN-13 - Manual entry fallback works

#### Alternative Payment
- Offer PayFast if Ozow fails
- Verification: verify-FUN-14 - Payment fallback available

#### Support Escalation
- Direct to human support for complex cases
- Verification: verify-FUN-15 - Support contact provided

## 6. Analytics & Optimization

### 6.1 Key Metrics Tracking

#### Funnel Analytics
- **Drop-off Points:** Identify where users abandon
- **Completion Time:** Average time to complete funnel
- **Error Rates:** Validation and API failures
- **Conversion Rates:** Payment completion percentage

#### User Behavior
- **Common Questions:** Frequently asked questions
- **Help Requests:** Support interaction points
- **Abandonment Reasons:** Exit intent analysis

### 6.2 A/B Testing Framework

#### Test Variables
- **Messaging:** Different value propositions
- **Pricing:** R199 vs R249 testing
- **Flow Length:** Short vs detailed explanations
- **Payment Options:** Ozow vs PayFast preference

#### Success Criteria
- **Statistical Significance:** 95% confidence level
- **Minimum Improvement:** 5% uplift in conversion
- **Sample Size:** 1000+ users per variant

## 7. Compliance & Security

### 7.1 POPIA Compliance

#### Data Collection
- **Purpose Limitation:** Only collect for filing purposes
- **Consent:** Explicit consent before collection
- **Minimization:** Only required fields collected
- **Verification:** verify-FUN-16 - POPIA compliance maintained

#### Data Protection
- **Encryption:** Data encrypted in transit and at rest
- **Retention:** Data deleted after filing completion
- **Access Control:** Only authorized personnel access
- **Verification:** verify-FUN-17 - Data protection measures active

### 7.2 Security Measures

#### Input Validation
- **Sanitization:** All inputs cleaned and validated
- **Rate Limiting:** Prevent abuse and spam
- **Monitoring:** Suspicious activity flagged
- **Verification:** verify-FUN-18 - Security measures effective

## 8. Deployment & Maintenance

### 8.1 Typebot Deployment

#### Environment Setup
- **Production URL:** https://cipc-agent.typebot.io
- **Custom Domain:** funnel.cipcagent.co.za
- **SSL Certificate:** Auto-managed
- **Backup:** Automatic configuration backups

#### Monitoring
- **Uptime:** 99.9% SLA
- **Performance:** <2s response time
- **Error Tracking:** Sentry integration
- **Analytics:** Typebot built-in analytics

### 8.2 Integration Testing

#### End-to-End Tests
- **Happy Path:** Complete successful filing
- **Error Paths:** Various failure scenarios
- **Edge Cases:** Unusual company types
- **Verification:** verify-FUN-19 - All test scenarios pass

#### Performance Testing
- **Load Testing:** 100 concurrent users
- **Stress Testing:** System limits
- **Recovery Testing:** Failure recovery
- **Verification:** verify-FUN-20 - Performance requirements met

## 9. Success Criteria

### Functional Requirements
- [ ] Conversational flow collects all required data
- [ ] CIPC number validation works correctly
- [ ] Payment integration functions properly
- [ ] Webhook triggers workflow successfully
- [ ] Error handling provides helpful messages
- [ ] Mobile-responsive design
- [ ] Fast loading times (<3 seconds)
- [ ] Accessibility compliant (WCAG 2.1)

### Business Requirements
- [ ] >70% funnel completion rate
- [ ] >80% payment conversion rate
- [ ] <5% error rate in data collection
- [ ] >4.5/5 user satisfaction score
- [ ] <24 hour filing processing time
- [ ] 99.9% uptime SLA

---

**This specification ensures the Typebot funnel provides an excellent user experience while collecting all necessary data for automated CIPC filing.**

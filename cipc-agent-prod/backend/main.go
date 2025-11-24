package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type LeadData struct {
	CompanyNumber    string `json:"company_number"`
	CompanyName      string `json:"company_name"`
	FinancialYearEnd string `json:"financial_year_end"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	ContactName      string `json:"contact_name"`
	Address          string `json:"address"`
	BusinessActivity string `json:"business_activity"`
	DirectorName     string `json:"director_name"`
	DirectorID       string `json:"director_id"`
}

type OnboardRequest struct {
	LeadData   LeadData `json:"lead_data"`
	PaymentRef string   `json:"payment_ref"`
}

type OnboardResponse struct {
	WorkflowID string `json:"workflow_id"`
	Status     string `json:"status"`
	Message    string `json:"message"`
}

// Payment-related types per spec-payments.md
type PaymentRequest struct {
	Amount      int    `json:"amount"`      // Amount in cents (19900 = R199.00)
	Currency    string `json:"currency"`    // Always "ZAR"
	Reference   string `json:"reference"`   // "AUTO" for auto-generation
	Description string `json:"description"` // Description of the service
	Customer    struct {
		CompanyNumber string `json:"company_number"`
		Email         string `json:"email"`
		Phone         string `json:"phone"`
		Name          string `json:"name"`
	} `json:"customer"`
	SuccessURL string `json:"success_url,omitempty"`
	CancelURL  string `json:"cancel_url,omitempty"`
	NotifyURL  string `json:"notify_url,omitempty"`
}

type PaymentResponse struct {
	PaymentID  string    `json:"payment_id"`
	Reference  string    `json:"reference"`
	PaymentURL string    `json:"payment_url"`
	ExpiresAt  time.Time `json:"expires_at"`
	Status     string    `json:"status"`
}

type PaymentRecord struct {
	ID            string     `json:"id"`
	Reference     string     `json:"reference"`
	Amount        int        `json:"amount"`
	Currency      string     `json:"currency"`
	Status        string     `json:"status"`
	CustomerEmail string     `json:"customer_email"`
	CustomerPhone string     `json:"customer_phone"`
	CompanyNumber string     `json:"company_number"`
	PaymentURL    string     `json:"payment_url,omitempty"`
	GatewayRef    string     `json:"gateway_reference,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
}

// Ozow Webhook Payload
type OzowWebhook struct {
	TransactionID        string `json:"transactionId"`
	TransactionReference string `json:"transactionReference"`
	Amount               string `json:"amount"`
	Status               string `json:"status"`
	Optional1            string `json:"optional1"` // "cipc_filing"
	Optional2            string `json:"optional2"` // company_number
	Optional3            string `json:"optional3"` // email
	Optional4            string `json:"optional4"` // phone
	Created              string `json:"created"`
	Completed            string `json:"completed"`
	Hash                 string `json:"hash,omitempty"`
}

// PayFast ITN Payload
type PayFastITN struct {
	MerchantID    string `json:"m_payment_id"`
	PFPaymentID   string `json:"pf_payment_id"`
	PaymentStatus string `json:"payment_status"`
	ItemName      string `json:"item_name"`
	AmountGross   string `json:"amount_gross"`
	AmountFee     string `json:"amount_fee"`
	AmountNet     string `json:"amount_net"`
	EmailAddress  string `json:"email_address"`
	MerchantID2   string `json:"merchant_id"`
	Signature     string `json:"signature"`
}

// Paystack Webhook Payload
type PaystackWebhook struct {
	Event string `json:"event"`
	Data  struct {
		ID        int       `json:"id"`
		Reference string    `json:"reference"`
		Amount    int       `json:"amount"` // Amount in kobo
		Currency  string    `json:"currency"`
		Status    string    `json:"status"`
		PaidAt    time.Time `json:"paid_at"`
		CreatedAt time.Time `json:"created_at"`
		Metadata  struct {
			CompanyNumber string `json:"company_number"`
			Service       string `json:"service"`
		} `json:"metadata"`
		Customer struct {
			Email string `json:"email"`
			Phone string `json:"phone"`
		} `json:"customer"`
	} `json:"data"`
}

// Payment Processing Service
type PaymentService struct {
	OzowSiteCode          string
	OzowAPIKey            string
	OzowPrivateKey        string
	PayFastMerchantID     string
	PayFastMerchantKey    string
	PaystackSecretKey     string
	PaystackPublicKey     string
	PaystackWebhookSecret string
	BaseURL               string
}

// Global payment service instance
var paymentService *PaymentService

func init() {
	// Initialize payment service
	paymentService = &PaymentService{
		OzowSiteCode:          os.Getenv("OZOW_SITE_CODE"),
		OzowAPIKey:            os.Getenv("OZOW_API_KEY"),
		OzowPrivateKey:        os.Getenv("OZOW_PRIVATE_KEY"),
		PayFastMerchantID:     os.Getenv("PAYFAST_MERCHANT_ID"),
		PayFastMerchantKey:    os.Getenv("PAYFAST_MERCHANT_KEY"),
		PaystackSecretKey:     os.Getenv("PAYSTACK_SECRET_KEY"),
		PaystackPublicKey:     os.Getenv("PAYSTACK_PUBLIC_KEY"),
		PaystackWebhookSecret: os.Getenv("PAYSTACK_WEBHOOK_SECRET"),
		BaseURL:               getBaseURL(),
	}
}

func getBaseURL() string {
	if url := os.Getenv("BASE_URL"); url != "" {
		return url
	}
	return "https://api.cipcagent.co.za"
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := mux.NewRouter()

	// API routes
	api := r.PathPrefix("/api/v1").Subrouter()

	// Health check
	api.HandleFunc("/health", healthHandler).Methods("GET")

	// Payment endpoints (per spec-payments.md)
	api.HandleFunc("/payments/create", createPaymentHandler).Methods("POST")
	api.HandleFunc("/payments/{id}/status", getPaymentStatusHandler).Methods("GET")

	// Onboarding endpoint (from Typebot)
	api.HandleFunc("/flows/onboard", onboardHandler).Methods("POST")

	// Enhanced webhook handlers
	api.HandleFunc("/webhooks/ozow", ozowWebhookHandler).Methods("POST")
	api.HandleFunc("/webhooks/payfast", payfastWebhookHandler).Methods("POST")
	api.HandleFunc("/webhooks/paystack", paystackWebhookHandler).Methods("POST")
	api.HandleFunc("/webhooks/payment", paymentWebhookHandler).Methods("POST") // Legacy

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Configure for production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	fmt.Printf("🚀 CIPC Agent Backend starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "cipc-agent-backend",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func onboardHandler(w http.ResponseWriter, r *http.Request) {
	var req OnboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.LeadData.CompanyNumber == "" || req.LeadData.Email == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Generate workflow ID
	workflowID := fmt.Sprintf("wf_%d", time.Now().Unix())

	// TODO: Trigger Temporal workflow
	// For now, just log and return success
	log.Printf("🎯 New onboarding request: %s (%s)", req.LeadData.CompanyName, req.LeadData.CompanyNumber)

	response := OnboardResponse{
		WorkflowID: workflowID,
		Status:     "accepted",
		Message:    "Filing workflow initiated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func paymentWebhookHandler(w http.ResponseWriter, r *http.Request) {
	var webhook PaymentWebhook
	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
		http.Error(w, "Invalid webhook payload", http.StatusBadRequest)
		return
	}

	// Validate webhook (TODO: Add signature verification)
	if webhook.Event != "payment.completed" {
		w.WriteHeader(http.StatusOK) // Acknowledge but ignore
		return
	}

	// Process payment completion
	log.Printf("💰 Payment completed: %s - R%d", webhook.PaymentRef, webhook.Amount)

	// TODO: Update workflow status
	// TODO: Send WhatsApp notification via AISensy

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "processed",
		"message": "Payment webhook processed successfully",
	})
}

// Payment Creation Handler (verify-PAY-01)
func createPaymentHandler(w http.ResponseWriter, r *http.Request) {
	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request (per spec-payments.md)
	if req.Amount < 5000 || req.Amount > 1000000 { // R50 - R10,000
		http.Error(w, "Amount must be between R50 and R10,000", http.StatusBadRequest)
		return
	}

	if req.Currency != "ZAR" {
		http.Error(w, "Only ZAR currency is supported", http.StatusBadRequest)
		return
	}

	// Generate payment reference if "AUTO"
	reference := req.Reference
	if reference == "AUTO" {
		reference = fmt.Sprintf("PAY-%s-%d", req.Customer.CompanyNumber[:8], time.Now().Unix())
	}

	// Try Ozow first, fallback to PayFast, then Paystack
	var paymentURL string
	var gateway string
	var err error

	if paymentURL, err = paymentService.createOzowPayment(req, reference); err != nil {
		log.Printf("Ozow payment failed: %v, trying PayFast", err)
		if paymentURL, err = paymentService.createPayFastPayment(req, reference); err != nil {
			log.Printf("PayFast payment failed: %v, trying Paystack", err)
			if paymentURL, err = paymentService.createPaystackPayment(req, reference); err != nil {
				http.Error(w, "All payment gateways unavailable", http.StatusServiceUnavailable)
				return
			}
			gateway = "paystack"
		} else {
			gateway = "payfast"
		}
	} else {
		gateway = "ozow"
	}

	// Create payment record (in-memory for now)
	paymentRecord := PaymentRecord{
		ID:            fmt.Sprintf("pay_%d", time.Now().Unix()),
		Reference:     reference,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Status:        "initiated",
		CustomerEmail: req.Customer.Email,
		CustomerPhone: req.Customer.Phone,
		CompanyNumber: req.Customer.CompanyNumber,
		PaymentURL:    paymentURL,
		CreatedAt:     time.Now(),
	}

	log.Printf("💳 Payment created: %s via %s", reference, gateway)

	response := PaymentResponse{
		PaymentID:  paymentRecord.ID,
		Reference:  paymentRecord.Reference,
		PaymentURL: paymentRecord.PaymentURL,
		ExpiresAt:  time.Now().Add(30 * time.Minute), // 30 minutes
		Status:     "initiated",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Payment Status Handler
func getPaymentStatusHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paymentID := vars["id"]

	// TODO: Fetch from database
	// For now, return mock status
	status := map[string]interface{}{
		"payment_id": paymentID,
		"status":     "pending",
		"reference":  fmt.Sprintf("PAY-%s", paymentID),
		"amount":     19900,
		"created_at": time.Now().Add(-5 * time.Minute),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// Ozow Webhook Handler (verify-PAY-02)
func ozowWebhookHandler(w http.ResponseWriter, r *http.Request) {
	var webhook OzowWebhook
	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
		http.Error(w, "Invalid webhook payload", http.StatusBadRequest)
		return
	}

	// TODO: Verify HMAC signature
	log.Printf("📥 Ozow webhook received: %s - Status: %s", webhook.TransactionReference, webhook.Status)

	if webhook.Status == "Complete" {
		// Process successful payment
		amount, _ := strconv.ParseFloat(webhook.Amount, 64)
		_ = int(amount * 100) // Convert to cents and use

		// TODO: Update payment record in database

		// Trigger workflow continuation
		log.Printf("✅ Ozow payment completed: %s - R%.2f", webhook.TransactionReference, amount)

		// TODO: Send WhatsApp notification via AISensy
		// TODO: Trigger Temporal workflow for filing
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "OK")
}

// PayFast Webhook Handler (verify-PAY-03)
func payfastWebhookHandler(w http.ResponseWriter, r *http.Request) {
	var itn PayFastITN
	if err := json.NewDecoder(r.Body).Decode(&itn); err != nil {
		http.Error(w, "Invalid ITN payload", http.StatusBadRequest)
		return
	}

	// TODO: Verify MD5 signature
	log.Printf("📥 PayFast ITN received: %s - Status: %s", itn.MerchantID, itn.PaymentStatus)

	if itn.PaymentStatus == "COMPLETE" {
		amount, _ := strconv.ParseFloat(itn.AmountGross, 64)
		_ = int(amount * 100) // Convert to cents and use

		// TODO: Update payment record in database

		// Trigger workflow continuation
		log.Printf("✅ PayFast payment completed: %s - R%.2f", itn.MerchantID, amount)

		// TODO: Send WhatsApp notification via AISensy
		// TODO: Trigger Temporal workflow for filing
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "OK")
}

// PaymentWebhook - Legacy webhook support
type PaymentWebhook struct {
	Event      string    `json:"event"`
	PaymentRef string    `json:"payment_reference"`
	Amount     int       `json:"amount"`
	Timestamp  time.Time `json:"timestamp"`
	Customer   LeadData  `json:"customer"`
}

// Payment service methods (basic implementation)
func (ps *PaymentService) createOzowPayment(req PaymentRequest, reference string) (string, error) {
	// TODO: Implement actual Ozow API integration
	// For now, return mock URL
	return fmt.Sprintf("https://pay.ozow.com/secure/%s", reference), nil
}

func (ps *PaymentService) createPayFastPayment(req PaymentRequest, reference string) (string, error) {
	// TODO: Implement actual PayFast API integration
	// For now, return mock URL
	return fmt.Sprintf("https://www.payfast.co.za/eng/process?merchant_id=%s&merchant_key=%s&item_name=%s&amount=%.2f&reference=%s",
		ps.PayFastMerchantID, ps.PayFastMerchantKey, "CIPC Annual Returns Filing", float64(req.Amount)/100, reference), nil
}

// Paystack payment creation method
func (ps *PaymentService) createPaystackPayment(req PaymentRequest, reference string) (string, error) {
	// TODO: Implement actual Paystack API integration
	// Paystack amounts are in kobo (1/100 of the currency unit)
	// For ZAR, 199.00 becomes 19900 kobo
	return fmt.Sprintf("https://checkout.paystack.com/pay/%s", reference), nil
}

// Paystack Webhook Handler (verify-PAY-04 for Paystack)
func paystackWebhookHandler(w http.ResponseWriter, r *http.Request) {
	var webhook PaystackWebhook
	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
		http.Error(w, "Invalid webhook payload", http.StatusBadRequest)
		return
	}

	// TODO: Verify Paystack HMAC signature using webhook secret
	log.Printf("📥 Paystack webhook received: %s - Event: %s, Status: %s",
		webhook.Data.Reference, webhook.Event, webhook.Data.Status)

	if webhook.Event == "charge.success" {
		// Process successful payment
		amountInRand := float64(webhook.Data.Amount) / 100.0 // Convert kobo to ZAR

		// TODO: Update payment record in database

		// Trigger workflow continuation
		log.Printf("✅ Paystack payment completed: %s - R%.2f",
			webhook.Data.Reference, amountInRand)

		// TODO: Send WhatsApp notification via AISensy
		// TODO: Trigger Temporal workflow for filing
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "OK")
}

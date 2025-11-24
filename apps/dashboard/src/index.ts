/**
 * Cloudflare Worker for CIPC Dashboard Backend
 * Handles webhooks, AISensy integration, and API endpoints
 */

interface Env {
  AISENSY_API_KEY: string;
  AISENSY_BASE_URL: string;
  OZOW_SITE_CODE: string;
  OZOW_PRIVATE_KEY: string;
  OZOW_API_KEY: string;
  TEMPORAL_ADDRESS?: string;
  // DB: D1Database;
  // WEBHOOK_QUEUE: Queue;
}

class OzowService {
  private siteCode: string;
  private privateKey: string;

  constructor(siteCode: string, privateKey: string) {
    this.siteCode = siteCode;
    this.privateKey = privateKey;
  }

  async verifyPaymentNotification(notificationData: any): Promise<boolean> {
    try {
      const receivedHash = notificationData.hash;
      if (!receivedHash) return false;

      const { hash, ...dataToHash } = notificationData;
      const calculatedHash = await this.generateHash(dataToHash);

      return receivedHash === calculatedHash;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  private async generateHash(data: any): Promise<string> {
    const sortedKeys = Object.keys(data).sort();
    let hashString = '';

    for (const key of sortedKeys) {
      if (data[key] !== null && data[key] !== undefined) {
        hashString += data[key].toString();
      }
    }

    hashString += this.privateKey;

    // Use Web Crypto API for Cloudflare Workers
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

interface TypebotWebhookData {
  variables: Array<{
    name: string;
    value: string;
  }>;
  resultId: string;
  sessionId: string;
}

class AISensyService {
  constructor(private apiKey: string, private baseUrl: string) {}

  async sendMessage(phoneNumber: string, message: string): Promise<Response> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(`${this.baseUrl}/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          message: message,
          message_type: 'text',
        }),
      });

      return response;
    } catch (error) {
      console.error('AISensy API error:', error);
      throw error;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.startsWith('27') && cleaned.length === 11) {
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '27' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '27' + cleaned;
    }

    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }

    return cleaned;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Typebot webhook endpoint
      if (url.pathname === '/api/webhooks/typebot' && request.method === 'POST') {
        const aisensyService = new AISensyService(env.AISENSY_API_KEY, env.AISENSY_BASE_URL);

        const webhookData: TypebotWebhookData = await request.json();

        // Extract lead information
        const variables = webhookData.variables.reduce((acc, variable) => {
          acc[variable.name] = variable.value;
          return acc;
        }, {} as Record<string, string>);

        const leadData = {
          name: variables.name || 'Valued Customer',
          email: variables.email,
          phone: variables.phone,
          company: variables.company,
          service: variables.service || 'Annual Returns',
          sessionId: webhookData.sessionId,
          resultId: webhookData.resultId,
        };

        // Validate required fields
        if (!leadData.phone) {
          return new Response(JSON.stringify({ error: 'Phone number is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send welcome message
        const welcomeMessage = `Hi ${leadData.name}! 👋

Thank you for your interest in CIPC Agent! We're excited to help you with your ${leadData.service} filing.

Our AI-powered system will handle everything automatically. You'll receive updates via WhatsApp as we process your request.

For any questions, feel free to reply to this message.

Best regards,
CIPC Agent Team`;

        const aisensyResponse = await aisensyService.sendMessage(leadData.phone, welcomeMessage);

        if (!aisensyResponse.ok) {
          const errorText = await aisensyResponse.text();
          console.error('AISensy API error:', errorText);
          return new Response(JSON.stringify({ error: 'Failed to send WhatsApp message' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Store lead data (implement database storage here)
        console.log('New lead captured:', leadData);

        // TODO: Store in D1 database
        // TODO: Send to queue for processing
        // TODO: Trigger Temporal workflow

        return new Response(JSON.stringify({
          success: true,
          message: 'Lead processed successfully',
          leadId: webhookData.resultId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Payment webhook endpoint
      if (url.pathname === '/api/webhooks/payment' && request.method === 'POST') {
        const paymentData = await request.json();

        console.log('Payment webhook received:', paymentData);

        // Validate payment data
        if (!paymentData.payment_reference || !paymentData.transaction_id) {
          return new Response(JSON.stringify({ error: 'Missing required payment data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify payment status
        if (paymentData.status !== 'completed' && paymentData.status !== 'success') {
          console.log(`Payment not completed: ${paymentData.status}`);
          return new Response(JSON.stringify({ message: 'Payment not completed yet' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Extract lead ID from payment reference
        const referenceParts = paymentData.payment_reference.split('-');
        const leadId = referenceParts.length >= 2 ? referenceParts[1] : paymentData.payment_reference;

        console.log(`Payment confirmed for lead: ${leadId}`);

        // Trigger Temporal workflow for filing
        try {
          // For now, we'll call the CIPC Runner API directly
          // In production, this should trigger a Temporal workflow
          const filingData = {
            company_registration_number: paymentData.company_number || '2021/123456/07', // TODO: Get from stored lead data
            company_name: paymentData.company_name || 'Test Company Pty Ltd',
            financial_year_end: paymentData.financial_year_end || '2024-02-28',
            contact_email: paymentData.customer_email || 'test@example.com',
            contact_phone: paymentData.customer_phone || '',
            payment_reference: paymentData.transaction_id
          };

          // Call CIPC Runner API to start filing
          const runnerResponse = await fetch('https://cipc-runner.your-domain.com/api/filing/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(filingData)
          });

          if (runnerResponse.ok) {
            const runnerResult = await runnerResponse.json();
            console.log('Filing workflow started:', runnerResult);
          } else {
            console.error('Failed to start filing workflow:', await runnerResponse.text());
          }

        } catch (workflowError) {
          console.error('Error triggering filing workflow:', workflowError);
          // Don't fail the payment processing if workflow trigger fails
        }

        // TODO: Update database with payment confirmation

        // Send confirmation message via WhatsApp
        if (paymentData.customer_phone) {
          try {
            const aisensyService = new AISensyService(env.AISENSY_API_KEY, env.AISENSY_BASE_URL);

            const confirmationMessage = `✅ Payment Confirmed!

Thank you for your payment of R${paymentData.amount}. Your annual returns filing is now being processed.

📋 Filing Status: Initiating
⏱️ Estimated completion: 5-10 minutes

We'll send you updates as we progress. Your transaction ID: ${paymentData.transaction_id}

Questions? Reply to this message.

Best regards,
CIPC Agent Team`;

            await aisensyService.sendMessage(paymentData.customer_phone, confirmationMessage);
          } catch (whatsappError) {
            console.error('Failed to send WhatsApp confirmation:', whatsappError);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          lead_id: leadId,
          transaction_id: paymentData.transaction_id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Health check endpoint
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Default 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

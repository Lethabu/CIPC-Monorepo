/**
 * Ozow Payment Service
 * Handles payment link generation and verification for CIPC filings
 */

import crypto from 'crypto';

export interface PaymentRequest {
  amount: number;
  reference: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  paymentUrl: string;
  transactionId: string;
}

export class OzowService {
  private siteCode: string;
  private privateKey: string;
  private apiKey: string;
  private isTest: boolean;

  constructor() {
    this.siteCode = process.env.OZOW_SITE_CODE || '';
    this.privateKey = process.env.OZOW_PRIVATE_KEY || '';
    this.apiKey = process.env.OZOW_API_KEY || '';
    this.isTest = process.env.NODE_ENV !== 'production';

    if (!this.siteCode || !this.privateKey || !this.apiKey) {
      throw new Error('Ozow environment variables are required: OZOW_SITE_CODE, OZOW_PRIVATE_KEY, OZOW_API_KEY');
    }
  }

  /**
   * Generate a payment link for Ozow
   */
  async generatePaymentLink(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionId = this.generateTransactionId();
      const bankRef = request.reference;

      // Prepare payment data
      const paymentData = {
        siteCode: this.siteCode,
        countryCode: 'ZA',
        currencyCode: 'ZAR',
        amount: request.amount.toFixed(2),
        transactionReference: transactionId,
        bankReference: bankRef,
        customer: request.customer.name,
        cancelUrl: request.cancelUrl || `${process.env.APP_URL || 'https://cipc-agent.com'}/payment/cancel`,
        errorUrl: request.errorUrl || `${process.env.APP_URL || 'https://cipc-agent.com'}/payment/error`,
        successUrl: request.successUrl || `${process.env.APP_URL || 'https://cipc-agent.com'}/payment/success`,
        notifyUrl: `${process.env.WORKER_URL || 'https://cipc-dashboard.workers.dev'}/api/webhooks/payment`,
        isTest: this.isTest
      };

      // Generate hash for security
      const hash = this.generateHash(paymentData);

      // Construct payment URL
      const baseUrl = this.isTest
        ? 'https://pay.ozow.com/'
        : 'https://pay.ozow.com/';

      const params = new URLSearchParams({
        SiteCode: paymentData.siteCode,
        CountryCode: paymentData.countryCode,
        CurrencyCode: paymentData.currencyCode,
        Amount: paymentData.amount,
        TransactionReference: paymentData.transactionReference,
        BankReference: paymentData.bankReference,
        Customer: paymentData.customer,
        CancelUrl: paymentData.cancelUrl,
        ErrorUrl: paymentData.errorUrl,
        SuccessUrl: paymentData.successUrl,
        NotifyUrl: paymentData.notifyUrl,
        IsTest: paymentData.isTest.toString(),
        Hash: hash
      });

      const paymentUrl = `${baseUrl}?${params.toString()}`;

      console.log('Ozow payment link generated:', {
        transactionId,
        bankRef,
        amount: request.amount,
        url: paymentUrl.substring(0, 100) + '...' // Log partial URL for security
      });

      return {
        paymentUrl,
        transactionId
      };

    } catch (error) {
      console.error('Failed to generate Ozow payment link:', error);
      throw new Error(`Payment link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify payment notification from Ozow
   */
  verifyPaymentNotification(notificationData: any): boolean {
    try {
      // Ozow sends notifications with a hash for verification
      const receivedHash = notificationData.hash;
      if (!receivedHash) {
        console.error('No hash in payment notification');
        return false;
      }

      // Remove hash from data and recalculate
      const { hash, ...dataToHash } = notificationData;
      const calculatedHash = this.generateHash(dataToHash);

      const isValid = receivedHash === calculatedHash;
      console.log('Payment notification verification:', isValid);

      return isValid;

    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate hash for Ozow API
   */
  private generateHash(data: any): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    let hashString = '';

    // Concatenate values in sorted key order
    for (const key of sortedKeys) {
      if (data[key] !== null && data[key] !== undefined) {
        hashString += data[key].toString();
      }
    }

    // Add private key
    hashString += this.privateKey;

    // Generate SHA512 hash
    return crypto.createHash('sha512').update(hashString).digest('hex').toUpperCase();
  }

  /**
   * Check payment status (if supported by Ozow API)
   */
  async checkPaymentStatus(transactionId: string): Promise<any> {
    // Note: Ozow may not provide a direct status check API
    // This would typically be handled via webhooks
    console.log(`Checking payment status for transaction: ${transactionId}`);

    // For now, return a placeholder
    // In production, you might need to store payment status in your database
    return {
      transactionId,
      status: 'unknown',
      message: 'Status checking not implemented - use webhooks'
    };
  }
}

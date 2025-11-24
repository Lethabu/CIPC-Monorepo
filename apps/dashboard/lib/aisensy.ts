export class AISensyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AISENSY_API_KEY || '';
    this.baseUrl = process.env.AISENSY_BASE_URL || 'https://api.aisensy.com';

    if (!this.apiKey) {
      throw new Error('AISENSY_API_KEY environment variable is required');
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<any> {
    try {
      // Format phone number (remove + and spaces, ensure South African format)
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AISensy API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('AISensy message sent successfully:', result);

      return result;
    } catch (error) {
      console.error('Failed to send AISensy message:', error);
      throw error;
    }
  }

  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters: Record<string, string> = {}
  ): Promise<any> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(`${this.baseUrl}/message/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          template_name: templateName,
          parameters: parameters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AISensy template API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('AISensy template message sent successfully:', result);

      return result;
    } catch (error) {
      console.error('Failed to send AISensy template message:', error);
      throw error;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle South African numbers
    if (cleaned.startsWith('27') && cleaned.length === 11) {
      // Already in correct format (27XXXXXXXXX)
      return cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      // Convert 0XXXXXXXXX to 27XXXXXXXXX
      return '27' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // Assume it's XXXXXXXXX and add 27
      return '27' + cleaned;
    }

    // For international numbers with +, remove + and ensure correct format
    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }

    return cleaned;
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/message/status/${messageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get message status:', error);
      throw error;
    }
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

interface LoginRequest {
  companyId: string;
  phoneNumber?: string;
  channel?: 'whatsapp' | 'telegram' | 'email';
}

interface LoginResponse {
  success: boolean;
  magicLinkId?: string;
  message: string;
  expiresAt?: string;
}

// In-memory store for demo purposes (use Redis/database in production)
const magicLinks = new Map<string, { companyId: string; phoneNumber: string; channel: string; expires: Date }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { companyId, phoneNumber, channel = 'whatsapp' }: LoginRequest = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Generate magic link ID
    const magicLinkId = createHash('sha256')
      .update(`${companyId}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 32);

    // Set expiration (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store magic link
    magicLinks.set(magicLinkId, {
      companyId,
      phoneNumber: phoneNumber || '',
      channel,
      expires: expiresAt
    });

    // Generate magic link URL
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/magic-link?token=${magicLinkId}`;

    // Deliver via specified channel
    try {
      await deliverMagicLink({ magicLinkUrl, companyId, phoneNumber, channel });
    } catch (deliveryError) {
      console.error('Magic link delivery failed:', deliveryError);
      // Still return success but log the delivery failure
    }

    res.status(200).json({
      success: true,
      magicLinkId,
      message: `Magic link sent via ${channel}`,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function deliverMagicLink({
  magicLinkUrl,
  companyId,
  phoneNumber,
  channel
}: {
  magicLinkUrl: string;
  companyId: string;
  phoneNumber?: string;
  channel: string;
}) {
  const message = `Welcome to CIPC Agent!\n\nYour magic link: ${magicLinkUrl}\n\nThis link expires in 24 hours.\n\nFor security, do not share this link.`;

  switch (channel) {
    case 'whatsapp':
      await sendWhatsAppMessage(phoneNumber || '', message);
      break;
    case 'telegram':
      await sendTelegramMessage(phoneNumber || '', message);
      break;
    case 'email':
      await sendEmail(companyId, message);
      break;
    default:
      throw new Error(`Unsupported delivery channel: ${channel}`);
  }
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  // WhatsApp Business API integration
  // In production, this would use the official WhatsApp Business API
  const whatsappUrl = process.env.WHATSAPP_API_URL;
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!whatsappUrl || !whatsappToken) {
    console.warn('WhatsApp API not configured - would send:', message);
    return;
  }

  // For demo/development, just log the message
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 WhatsApp to ${phoneNumber}: ${message}`);
    return;
  }

  const response = await fetch(`${whatsappUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    })
  });

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.statusText}`);
  }
}

async function sendTelegramMessage(phoneNumber: string, message: string) {
  // Telegram Bot API integration
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

  if (!botToken) {
    console.warn('Telegram Bot API not configured - would send:', message);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Telegram to ${phoneNumber}: ${message}`);
    return;
  }

  // Telegram requires chat ID, not phone number directly
  // This would need to be integrated with user management system
  console.warn('Telegram integration requires chat ID mapping - phone number provided');
}

async function sendEmail(email: string, message: string) {
  // Resend or similar email service integration
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('Resend API not configured - would send email:', message);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✉️ Email to ${email}: ${message}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CIPC Agent <auth@cipcagent.co.za>',
      to: [email],
      subject: 'Your CIPC Agent Magic Link',
      text: message,
    })
  });

  if (!response.ok) {
    throw new Error(`Email API error: ${response.statusText}`);
  }
}

// Export magic links validation (for use in auth/magic-link page)
export { magicLinks };

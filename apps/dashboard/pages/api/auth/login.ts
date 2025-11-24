import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyId, phoneNumber, channel } = req.body;

  if (!companyId || !phoneNumber || !channel) {
    return res.status(400).json({ 
      error: 'Missing required fields: companyId, phoneNumber, channel' 
    });
  }

  // Generate magic link ID
  const magicLinkId = uuidv4();
  
  // Simulate different channel responses
  const responses = {
    whatsapp: {
      success: true,
      message: 'Magic link sent via WhatsApp',
      magicLinkId,
      channel: 'whatsapp',
      deliveryStatus: 'sent'
    },
    telegram: {
      success: true,
      message: 'Magic link sent via Telegram bot',
      magicLinkId,
      channel: 'telegram',
      deliveryStatus: 'sent'
    },
    email: {
      success: true,
      message: 'Magic link sent via email',
      magicLinkId,
      channel: 'email',
      deliveryStatus: 'sent'
    }
  };

  const response = responses[channel as keyof typeof responses];
  
  if (!response) {
    return res.status(400).json({ 
      error: 'Invalid channel. Supported: whatsapp, telegram, email' 
    });
  }

  // Log the authentication attempt
  console.log(`🔐 Auth attempt: ${channel} | Company: ${companyId} | Contact: ${phoneNumber}`);
  console.log(`🔗 Magic Link ID: ${magicLinkId}`);

  res.status(200).json(response);
}
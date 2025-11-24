import type { NextApiRequest, NextApiResponse } from 'next';

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface WebhookResponse {
  success: boolean;
  message: string;
  command?: string;
}

// In-memory store for user sessions (use database in production)
const userSessions = new Map<number, { lastActivity: Date; companyId?: string }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const update: TelegramWebhookUpdate = req.body;

    if (!update.message) {
      return res.status(200).json({ success: true, message: 'No message in update' });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text?.trim();

    if (!text) {
      return res.status(200).json({ success: true, message: 'No text in message' });
    }

    // Update user activity
    userSessions.set(chatId, {
      lastActivity: new Date(),
      companyId: userSessions.get(chatId)?.companyId
    });

    // Handle different commands
    const command = parseCommand(text);

    switch (command.type) {
      case 'start':
        await handleStart(chatId, message);
        break;

      case 'login':
        await handleLogin(chatId, message, command.companyId);
        break;

      case 'status':
        await handleStatus(chatId, message);
        break;

      case 'help':
        await handleHelp(chatId, message);
        break;

      case 'unknown':
      default:
        await handleUnknown(chatId, message);
        break;
    }

    res.status(200).json({
      success: true,
      message: 'Message processed',
      command: command.type
    });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function parseCommand(text: string) {
  const lowerText = text.toLowerCase();

  if (lowerText === '/start') {
    return { type: 'start' as const };
  }

  if (lowerText === '/help' || lowerText === 'help') {
    return { type: 'help' as const };
  }

  if (lowerText === '/status' || lowerText === 'status') {
    return { type: 'status' as const };
  }

  // Check for login command with Company ID
  const loginMatch = text.match(/^\/login\s+(\w+)$/i) || text.match(/^login\s+(\w+)$/i);
  if (loginMatch) {
    return { type: 'login' as const, companyId: loginMatch[1] };
  }

  return { type: 'unknown' as const };
}

async function handleStart(chatId: number, message: TelegramMessage) {
  const welcomeMessage = `
👋 Welcome to CIPC Agent!

I'm your AI assistant for compliance management. Here's how I can help:

📋 *Commands:*
• /login COMPANY_ID - Request magic link
• /status - Check compliance status
• /help - Show this help message

🚀 To get started, use /login with your Company Registration Number.

Example: /login 2023/123456/07

_Follow us for updates!_
  `;

  await sendTelegramMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Login", callback_data: "login" }],
        [{ text: "Help", callback_data: "help" }]
      ]
    }
  });
}

async function handleLogin(chatId: number, message: TelegramMessage, companyId?: string) {
  const user = message.from;
  const phone = user?.username || `user_${chatId}`; // Telegram username or chat ID

  if (!companyId) {
    const errorMessage = `
❌ *Missing Company ID*

Please provide your Company Registration Number.

Format: /login 2023/123456/07
Example: /login 2023/123456/07
    `;
    await sendTelegramMessage(chatId, errorMessage);
    return;
  }

  try {
    // Store company ID for this user
    userSessions.set(chatId, {
      lastActivity: new Date(),
      companyId
    });

    // Call our login API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId,
        phoneNumber: phone,
        channel: 'telegram'
      })
    });

    const result = await response.json();

    if (result.success) {
      const successMessage = `
✅ *Magic Link Sent!*

Your magic link has been sent to this chat.

📱 Check your messages above for the link.

🔒 The link expires in 24 hours.
⚠️ Do not share this link with anyone.

_Having trouble? Contact support._
      `;
      await sendTelegramMessage(chatId, successMessage);
    } else {
      await sendTelegramMessage(chatId, `❌ *Error:* ${result.message}`);
    }

  } catch (error) {
    console.error('Login error:', error);
    await sendTelegramMessage(chatId, '❌ *Error:* Failed to process login request');
  }
}

async function handleStatus(chatId: number, message: TelegramMessage) {
  const userSession = userSessions.get(chatId);

  if (!userSession?.companyId) {
    const noSessionMessage = `
❌ *No Active Session*

You need to login first.

Use: /login COMPANY_ID

Example: /login 2023/123456/07
    `;
    await sendTelegramMessage(chatId, noSessionMessage);
    return;
  }

  // Mock compliance status (would fetch from real API)
  const statusMessage = `
📊 *Compliance Status for ${userSession.companyId}*

✅ *Overall:* Good Standing
📅 *Next Filing:* Annual Return - March 31, 2025
🔔 *Reminders:* 1 pending task

Use /login again for full dashboard access.
  `;

  await sendTelegramMessage(chatId, statusMessage);
}

async function handleHelp(chatId: number, message: TelegramMessage) {
  const helpMessage = `
📚 *CIPC Agent Help*

🎯 *Available Commands:*
• /start - Show welcome message
• /login COMPANY_ID - Request dashboard access
• /status - Check compliance status
• /help - Show this help

🔐 *Security Notes:*
• Magic links expire in 24 hours
• Always keep your Company ID secure
• Don't share links with unauthorized users

📞 *Support:* Contact us for assistance
🌐 *Web:* Access full dashboard at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
  `;

  await sendTelegramMessage(chatId, helpMessage);
}

async function handleUnknown(chatId: number, message: TelegramMessage) {
  const unknownMessage = `
🤔 *Unknown Command*

I didn't understand that command.

Here are the available commands:
/start - Get started
/login COMPANY_ID - Login to dashboard
/status - Check compliance status
/help - Show help

Need help? Use /help for more information.
  `;

  await sendTelegramMessage(chatId, unknownMessage);
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  options: { reply_markup?: any } = {}
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('Telegram Bot API not configured - would send:', text);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 Telegram to ${chatId}: ${text}`);
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...options
      })
    });

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

export { userSessions };

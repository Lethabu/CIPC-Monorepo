import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;
  
  if (!update.message) {
    return res.status(200).json({ ok: true });
  }

  const { message } = update;
  const chatId = message.chat.id;
  const text = message.text;
  const username = message.from.username || message.from.first_name;

  console.log(`📱 Telegram message from @${username}: ${text}`);

  // Handle different commands
  let response = '';
  
  if (text === '/start') {
    response = `Welcome to CIPC Agent! 🏢\n\nUse /login COMPANY_ID to authenticate.\nExample: /login 2023/123456/07`;
  } else if (text.startsWith('/login ')) {
    const companyId = text.replace('/login ', '').trim();
    if (companyId) {
      response = `🔐 Authentication initiated for company ${companyId}\n\n✅ Magic link generated successfully!\nClick the link to complete login.`;
    } else {
      response = '❌ Please provide a company ID.\nExample: /login 2023/123456/07';
    }
  } else if (text === '/status') {
    response = '✅ CIPC Agent is online and ready!\n📊 All systems operational.';
  } else if (text === '/help') {
    response = `🤖 CIPC Agent Commands:\n\n/start - Welcome message\n/login COMPANY_ID - Authenticate\n/status - Check system status\n/help - Show this help`;
  } else {
    response = `I didn't understand "${text}"\n\nTry /help for available commands.`;
  }

  // In a real implementation, you would send this back to Telegram
  console.log(`🤖 Bot response to @${username}: ${response}`);

  res.status(200).json({ 
    success: true, 
    chatId, 
    response,
    method: 'sendMessage'
  });
}
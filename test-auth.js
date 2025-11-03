#!/usr/bin/env node

/**
 * CIPC Agent Authentication Test Script
 *
 * This script demonstrates the authentication flow using the login API.
 *
 * Usage:
 * 1. Make sure the dashboard server is running: cd apps/dashboard && pnpm dev
 * 2. Run: node test-auth.js
 */

const API_BASE = 'http://localhost:3000';

async function testAuthentication() {
  console.log('🚀 Testing CIPC Agent Authentication Flow');
  console.log('========================================\n');

  try {
    // Test 1: WhatsApp Login
    console.log('📱 Testing WhatsApp Login...');
    const whatsappResult = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: '2023/123456/07',
        phoneNumber: '+27821234567',
        channel: 'whatsapp'
      })
    });

    const whatsappData = await whatsappResult.json();
    console.log('✅ WhatsApp Response:', whatsappData);

    if (whatsappData.success && whatsappData.magicLinkId) {
      console.log(`🔗 Magic Link ID: ${whatsappData.magicLinkId}`);
      console.log('📊 Simulating magic link validation...\n');

      // Test 2: Validate Magic Link (would normally be done by clicking the link)
      console.log('🔐 Testing Magic Link Validation...');

      // In a real scenario, the magic link URL would be:
      console.log(`🌐 Magic Link URL: ${API_BASE}/auth/magic-link?token=${whatsappData.magicLinkId}`);
      console.log('💡 Open this URL in your browser to complete authentication\n');
    }

    // Test 3: Telegram Login
    console.log('📱 Testing Telegram Login...');
    const telegramResult = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: '2024/987654/01',
        phoneNumber: '@johndoe_telegram',
        channel: 'telegram'
      })
    });

    const telegramData = await telegramResult.json();
    console.log('✅ Telegram Response:', telegramData);

    // Test 4: Email Login
    console.log('✉️ Testing Email Login...');
    const emailResult = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: '2022/555666/02',
        phoneNumber: 'user@company.com',
        channel: 'email'
      })
    });

    const emailData = await emailResult.json();
    console.log('✅ Email Response:', emailData);

    console.log('\n🎯 Authentication Flow Test Complete!');
    console.log('💡 Check the dashboard server logs for detailed delivery information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Telegram webhook simulation
async function simulateTelegramMessage() {
  console.log('\n📱 Simulating Telegram Webhook...');

  const telegramUpdate = {
    update_id: 123456789,
    message: {
      message_id: 123,
      from: {
        id: 789012345,
        is_bot: false,
        first_name: "John",
        username: "johndoe"
      },
      chat: {
        id: 789012345,
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/login 2023/123456/07"
    }
  };

  try {
    const response = await fetch(`${API_BASE}/api/auth/telegram-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramUpdate)
    });

    const result = await response.json();
    console.log('✅ Telegram Webhook Response:', result);

  } catch (error) {
    console.error('❌ Telegram webhook test failed:', error.message);
  }
}

// Run tests
async function main() {
  await testAuthentication();
  await simulateTelegramMessage();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAuthentication, simulateTelegramMessage };

#!/usr/bin/env node

/**
 * Runtime Integration Test
 * Tests Module Federation integration between apps
 */

const http = require('http');

console.log('🧪 CIPC Agent V2 - Runtime Integration Test\n');

const endpoints = [
  { name: 'CIPC MFE', url: 'http://localhost:3001', required: true },
  { name: 'Dashboard', url: 'http://localhost:3002', required: true },
  { name: 'MF Remote Entry', url: 'http://localhost:3001/_next/static/chunks/remoteEntry.js', required: true }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(endpoint.url, (res) => {
      resolve({ ...endpoint, status: res.statusCode, success: res.statusCode === 200 });
    });
    
    req.on('error', () => {
      resolve({ ...endpoint, status: 'ERROR', success: false });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ...endpoint, status: 'TIMEOUT', success: false });
    });
  });
}

async function runTests() {
  console.log('📡 Testing runtime endpoints...\n');
  
  const results = await Promise.all(endpoints.map(testEndpoint));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
  });
  
  const allPassed = results.every(r => r.success);
  
  console.log('\n📋 Runtime Test Summary:');
  console.log('========================');
  
  if (allPassed) {
    console.log('✅ All endpoints responding - Module Federation ready');
    console.log('🔗 Access: http://localhost:3002 (Dashboard with MF integration)');
  } else {
    console.log('❌ Some endpoints failed - Start development servers:');
    console.log('   pnpm dev (or start apps individually)');
  }
}

runTests();
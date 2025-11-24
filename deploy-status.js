#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Validates production deployment status
 */

const https = require('https');

const endpoints = [
  { name: 'Dashboard', url: 'https://cipc-dashboard.vercel.app' },
  { name: 'CIPC MFE', url: 'https://cipc-mfe.vercel.app' },
  { name: 'Remote Entry', url: 'https://cipc-mfe.vercel.app/_next/static/chunks/remoteEntry.js' }
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = https.get(endpoint.url, (res) => {
      resolve({ ...endpoint, status: res.statusCode, success: res.statusCode === 200 });
    });
    
    req.on('error', () => {
      resolve({ ...endpoint, status: 'ERROR', success: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ ...endpoint, status: 'TIMEOUT', success: false });
    });
  });
}

async function checkDeployment() {
  console.log('🔍 Checking production deployment status...\n');
  
  const results = await Promise.all(endpoints.map(checkEndpoint));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
  });
  
  const allLive = results.every(r => r.success);
  
  console.log('\n📋 Production Status:');
  console.log('====================');
  
  if (allLive) {
    console.log('🎉 All services live - Production deployment successful!');
    console.log('🔗 Dashboard: https://cipc-dashboard.vercel.app');
    console.log('🔗 CIPC MFE: https://cipc-mfe.vercel.app');
  } else {
    console.log('⏳ Deployment in progress or failed - Check Vercel dashboard');
  }
}

checkDeployment();
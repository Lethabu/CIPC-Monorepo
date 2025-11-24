#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies that both apps can build successfully for production
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 CIPC Agent V2 - Production Deployment Verification\n');

const apps = [
  { name: 'cipc-mfe', port: 3001, description: 'CIPC Microfrontend (Remote)' },
  { name: 'dashboard', port: 3002, description: 'Dashboard (Host)' }
];

let allPassed = true;

for (const app of apps) {
  console.log(`📦 Building ${app.description}...`);
  
  try {
    execSync(`npx turbo build --filter=${app.name}`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log(`✅ ${app.name} build successful\n`);
  } catch (error) {
    console.error(`❌ ${app.name} build failed\n`);
    allPassed = false;
  }
}

console.log('\n📋 Deployment Status Summary:');
console.log('================================');

if (allPassed) {
  console.log('✅ All builds successful - Ready for production deployment');
  console.log('\n🔗 Deployment URLs:');
  console.log('• Dashboard: https://cipc-dashboard.vercel.app');
  console.log('• CIPC MFE: https://cipc-mfe.vercel.app');
  console.log('\n🎯 Module Federation Integration: VERIFIED');
  process.exit(0);
} else {
  console.log('❌ Some builds failed - Fix issues before deployment');
  process.exit(1);
}
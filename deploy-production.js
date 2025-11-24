#!/usr/bin/env node

/**
 * CIPC Agent V2 - Production Deployment Script
 * Deploys both dashboard and cipc-mfe to Vercel
 */

const { execSync } = require('child_process');

async function deployProduction() {
  console.log('🚀 CIPC Agent V2 - Production Deployment');
  console.log('========================================\n');

  try {
    // Deploy CIPC MFE (Remote) first
    console.log('📦 Deploying CIPC Microfrontend (Remote)...');
    process.chdir('./apps/cipc-mfe');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    // Deploy Dashboard (Host) second
    console.log('\n📊 Deploying Dashboard (Host)...');
    process.chdir('../dashboard');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('\n✅ Production Deployment Complete!');
    console.log('🌐 Dashboard: https://cipc-dashboard.vercel.app');
    console.log('🔗 CIPC MFE: https://cipc-mfe.vercel.app');
    console.log('🎯 Status: LIVE - Ready for Series A Demo');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction };
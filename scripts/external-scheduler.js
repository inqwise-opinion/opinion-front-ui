#!/usr/bin/env node

/**
 * External Scheduler Integration Script
 * 
 * This script can be called by external scheduling systems (cron, Jenkins, etc.)
 * to trigger deployments via GitHub repository dispatch events.
 * 
 * Usage examples:
 *   node external-scheduler.js --release v1.2.3 --environment production --type scheduled
 *   node external-scheduler.js --release v1.2.3 --environment staging --notes "QA testing"
 *   node external-scheduler.js --release v1.2.4 --environment production --type emergency --notes "Critical security fix"
 */

const https = require('https');
const { execSync } = require('child_process');

// Configuration
const config = {
  owner: 'inqwise-opinion',  // Your GitHub org/username
  repo: 'opinion-front-ui',  // Your repository name
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  apiUrl: 'api.github.com'
};

// Command line argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      params[key] = value;
    }
  }
  
  return params;
}

// Validate required parameters
function validateParams(params) {
  const required = ['release', 'environment'];
  const missing = required.filter(param => !params[param]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
  
  if (!['staging', 'production'].includes(params.environment)) {
    throw new Error('Environment must be either "staging" or "production"');
  }
  
  if (!params.release.startsWith('v')) {
    throw new Error('Release tag must start with "v" (e.g., v1.2.3)');
  }
  
  if (!config.token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN environment variable is required');
  }
}

// Check if release exists
async function validateRelease(releaseTag) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.apiUrl,
      port: 443,
      path: `/repos/${config.owner}/${config.repo}/releases/tags/${releaseTag}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'External-Scheduler/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else if (res.statusCode === 404) {
        reject(new Error(`Release ${releaseTag} not found`));
      } else {
        reject(new Error(`GitHub API error: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Trigger deployment via repository dispatch
async function triggerDeployment(params) {
  let eventType = params.environment === 'staging' ? 'staging-deployment' : 'scheduled-deployment';
  
  // For emergency deployments, use different event type
  if (params.type === 'emergency') {
    eventType = 'emergency-deployment';
  }
  
  const payload = {
    event_type: eventType,
    client_payload: {
      release_tag: params.release,
      environment: params.environment,
      deployment_type: params.type || 'scheduled',
      notes: params.notes || `${params.type || 'Scheduled'} deployment of ${params.release}`,
      scheduled_by: params.scheduled_by || 'External Scheduler',
      timestamp: new Date().toISOString()
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: config.apiUrl,
      port: 443,
      path: `/repos/${config.owner}/${config.repo}/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'User-Agent': 'External-Scheduler/1.0',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve({
            success: true,
            event_type: eventType,
            payload: payload.client_payload
          });
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Get current version deployed in environment
async function getCurrentVersion(environment) {
  // TODO: Implement based on your environment setup
  // Examples:
  // - Check staging.your-domain.com/version.json
  // - Query your deployment database
  // - Check Kubernetes deployments
  
  console.log(`📊 Checking current version in ${environment}...`);
  
  try {
    // Placeholder - replace with actual version check
    return 'v1.0.1'; // Current deployed version
  } catch (error) {
    console.warn(`⚠️ Could not determine current ${environment} version:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 External Scheduler - GitHub Deployment Trigger');
    console.log('================================================');
    
    const params = parseArgs();
    console.log('📋 Parameters:', params);
    
    validateParams(params);
    console.log('✅ Parameters validated');
    
    // Check if release exists
    console.log(`🔍 Validating release ${params.release}...`);
    await validateRelease(params.release);
    console.log('✅ Release validated');
    
    // Get current version for comparison
    const currentVersion = await getCurrentVersion(params.environment);
    if (currentVersion) {
      console.log(`📊 Current ${params.environment} version: ${currentVersion}`);
      if (currentVersion === params.release) {
        console.log(`⚠️ Warning: ${params.release} is already deployed to ${params.environment}`);
        if (params.force !== 'true') {
          console.log('Use --force true to redeploy the same version');
          process.exit(0);
        }
      }
    }
    
    // Trigger deployment
    console.log(`🎯 Triggering ${params.environment} deployment...`);
    const result = await triggerDeployment(params);
    
    console.log('✅ Deployment triggered successfully!');
    console.log('📊 Details:');
    console.log(`   - Event Type: ${result.event_type}`);
    console.log(`   - Release: ${result.payload.release_tag}`);
    console.log(`   - Environment: ${result.payload.environment}`);
    console.log(`   - Type: ${result.payload.deployment_type}`);
    console.log(`   - Notes: ${result.payload.notes}`);
    
    console.log('');
    console.log('🔗 Monitor deployment progress at:');
    console.log(`   https://github.com/${config.owner}/${config.repo}/actions`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Usage: node external-scheduler.js --release <version> --environment <env> [options]');
    console.error('');
    console.error('Required:');
    console.error('  --release      Release tag (e.g., v1.2.3)');
    console.error('  --environment  Target environment (staging|production)');
    console.error('');
    console.error('Optional:');
    console.error('  --type         Deployment type (scheduled|emergency|hotfix)');
    console.error('  --notes        Deployment notes');
    console.error('  --scheduled_by Who scheduled this deployment');
    console.error('  --force        Force deployment even if same version (true|false)');
    console.error('');
    console.error('Environment Variables:');
    console.error('  GITHUB_TOKEN   GitHub personal access token');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  triggerDeployment,
  validateRelease,
  getCurrentVersion
};
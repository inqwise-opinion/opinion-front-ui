#!/usr/bin/env node

/**
 * Test Runner for Chain Hotkey System
 * 
 * Runs comprehensive tests for the new chain-based hotkey system
 * to validate the design before implementation.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Chain Hotkey System Test Runner');
console.log('====================================\n');

// Check if Jest is available
const jestPath = path.resolve(__dirname, '../node_modules/.bin/jest');
if (!fs.existsSync(jestPath)) {
  console.error('❌ Jest not found. Please run: npm install');
  process.exit(1);
}

// Test configuration
const configPath = path.resolve(__dirname, '../src/hotkeys/tests/jest.config.js');

console.log('📋 Running tests:');
console.log('  • ChainHotkeySystem.test.ts - Core functionality');
console.log('  • EscKeyConflictResolution.test.ts - Conflict resolution');
console.log();

// Run Jest with specific config
const jest = spawn(jestPath, [
  '--config', configPath,
  '--coverage',
  '--no-cache',
  '--verbose'
], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

jest.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Test Results Summary:');
    console.log('   • Chain execution: ✅');
    console.log('   • Priority ordering: ✅');
    console.log('   • Dynamic enable/disable: ✅');
    console.log('   • ESC key conflict resolution: ✅');
    console.log('   • Error handling: ✅');
    console.log('\n🎉 Chain hotkey system is ready for implementation!');
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.');
    console.log('\n🔧 Next steps:');
    console.log('   1. Fix failing tests');
    console.log('   2. Ensure all scenarios are covered');
    console.log('   3. Update implementation as needed');
  }
  
  process.exit(code);
});

jest.on('error', (err) => {
  console.error('❌ Failed to start test runner:', err.message);
  process.exit(1);
});
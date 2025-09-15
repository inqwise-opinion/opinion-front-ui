/**
 * Jest Configuration for Chain Hotkey System Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/hotkeys/tests/ChainHotkeySystem.test.ts',
    '<rootDir>/src/hotkeys/tests/EscKeyConflictResolution.test.ts'
  ],
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/hotkeys/tests/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/hotkeys/HotkeyChainSystem.ts',
    'src/hotkeys/ChainHotkeyManagerImpl.ts',
    '!src/hotkeys/HotkeyChainSystem.ts' // Interface file, no coverage needed
  ],
  
  coverageReporters: ['text', 'html', 'lcov'],
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Report coverage threshold
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
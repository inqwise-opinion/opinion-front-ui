import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,
  
  // Configuration for TypeScript source files
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser DOM globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        
        // DOM Elements
        HTMLElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTableRowElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        NodeListOf: 'readonly',
        
        // Browser APIs and Types
        Window: 'readonly',
        Document: 'readonly',
        
        // Events
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        CustomEvent: 'readonly',
        ErrorEvent: 'readonly',
        TransitionEvent: 'readonly',
        PromiseRejectionEvent: 'readonly',
        EventListener: 'readonly',
        AddEventListenerOptions: 'readonly',
        
        // Timers and async
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        FrameRequestCallback: 'readonly',
        
        // Browser APIs
        DOMParser: 'readonly',
        FormData: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        getComputedStyle: 'readonly',
        URL: 'readonly',
        
        // Node.js types (for TypeScript)
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types - necessary for complex type compatibility
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      
      // JavaScript rules
      'no-console': 'off', // We use structured logging now
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-dupe-class-members': 'off', // Allow method overloads
      'no-case-declarations': 'error', // Enforce block scoping in switch cases
      'no-empty': 'error',
    },
  },

  // Configuration for test files
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser DOM globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        
        // DOM Elements and Events
        HTMLElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTableRowElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        NodeListOf: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        CustomEvent: 'readonly',
        EventListener: 'readonly',
        
        // Browser APIs
        Window: 'readonly',
        Document: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        DOMParser: 'readonly',
        
        // Timers and animation
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        FrameRequestCallback: 'readonly',
        
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        
        // Test-specific globals
        global: 'readonly',
        AddEventListenerOptions: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Relaxed rules for tests
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types in tests for mocking
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'error',
    },
  },

  // Configuration for CommonJS files
  {
    files: ['*.cjs', '**/*.cjs', 'jest.config.*', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        
        // CommonJS specific
        NodeJS: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Files that use Node.js APIs (for config loading, etc.)
  {
    files: [
      'src/logging/LoggerFactory.ts',
      'src/router/RouterService.ts',
      'tests/**/*.test.ts',
      'tests/**/jest.config.js'
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        
        // Node.js globals for configuration loading
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
        
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        
        // Test-specific
        ChainHotkeyManager: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types in Node.js files
      'prefer-const': 'error',
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js', // Ignore root-level JS files like this config
    ],
  },
];
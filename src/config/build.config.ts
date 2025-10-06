/**
 * Build Configuration
 * 
 * This file contains build-time configuration for different deployment scenarios.
 * Instead of relying on environment variables, we define explicit configurations
 * that can be selected at build time.
 * 
 * Note: This file accesses process.env at build time and is safe for both
 * Node.js (build) and browser (runtime) environments.
 */

/* eslint-env node */

export interface BuildConfig {
  /**
   * Base URL for the application (used for routing and assets)
   * Examples: '', '/app', '/opinion-front-ui/pr-16'
   */
  baseUrl: string;
  
  /**
   * Enable GitHub Pages SPA routing fallback
   * When true, the app will decode routes from query parameters (e.g., /?/surveys -> /surveys)
   */
  enableSpaRouting: boolean;
  
  /**
   * Build environment
   */
  environment: 'development' | 'production' | 'test';
  
  /**
   * Enable debug logging
   */
  enableDebugLogging: boolean;
  
  /**
   * Asset path prefix (usually same as baseUrl but can be different for CDN)
   */
  assetsUrl?: string;
}

/**
 * Predefined build configurations
 */
const BUILD_CONFIGS: Record<string, BuildConfig> = {
  // Local development
  development: {
    baseUrl: '',
    enableSpaRouting: false,
    environment: 'development',
    enableDebugLogging: true
  },
  
  // Production deployment (root domain)
  production: {
    baseUrl: '',
    enableSpaRouting: false,
    environment: 'production',
    enableDebugLogging: false
  },
  
  // GitHub Pages PR preview (requires SPA routing)
  'github-pages-pr': {
    baseUrl: '', // Will be set dynamically in CI
    enableSpaRouting: true,
    environment: 'production',
    enableDebugLogging: false
  },
  
  // GitHub Pages main branch
  'github-pages-main': {
    baseUrl: '/opinion-front-ui',
    enableSpaRouting: true,
    environment: 'production',
    enableDebugLogging: false
  },
  
  // Testing environment
  test: {
    baseUrl: '',
    enableSpaRouting: false,
    environment: 'test',
    enableDebugLogging: false
  }
};

// Declare the Vite-injected build configuration constant
declare global {
  const __BUILD_CONFIG__: BuildConfig;
}

/**
 * Get build configuration from Vite-injected constants
 * This is set at build time via Vite's define option
 */
function getBuildConfig(): BuildConfig {
  // Use Vite-injected configuration if available, otherwise fallback to development
  if (typeof __BUILD_CONFIG__ !== 'undefined') {
    console.log('🔧 Using Vite-injected build config:', JSON.stringify(__BUILD_CONFIG__, null, 2));
    return __BUILD_CONFIG__;
  }
  
  // Fallback for development/testing when Vite define is not available
  console.log('🔧 Using fallback development config (Vite define not available)');
  return BUILD_CONFIGS.development;
}

/**
 * Current build configuration
 */
export const buildConfig = getBuildConfig();

/**
 * Helper functions for common checks
 */
export const isDevelopment = () => buildConfig.environment === 'development';
export const isProduction = () => buildConfig.environment === 'production';
export const isTest = () => buildConfig.environment === 'test';
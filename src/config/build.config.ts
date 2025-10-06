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

/**
 * Get build configuration based on BUILD_CONFIG environment variable
 * Falls back to development if not specified
 */
function getBuildConfig(): BuildConfig {
  // Safe access to process.env (available in Node.js/build time only)
  // eslint-disable-next-line no-undef
  const configName = (typeof process !== 'undefined' && process.env?.BUILD_CONFIG) || 'development';
  const baseConfig = BUILD_CONFIGS[configName];
  
  if (!baseConfig) {
    console.warn(`Unknown build config '${configName}', falling back to development`);
    return BUILD_CONFIGS.development;
  }
  
  // Allow runtime override of baseUrl for dynamic scenarios (like PR previews)
  // eslint-disable-next-line no-undef
  const runtimeBaseUrl = typeof process !== 'undefined' ? process.env?.RUNTIME_BASE_URL : undefined;
  if (runtimeBaseUrl) {
    return {
      ...baseConfig,
      baseUrl: runtimeBaseUrl
    };
  }
  
  return baseConfig;
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
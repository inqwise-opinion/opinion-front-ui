/**
 * Application configuration
 * Handles environment-specific settings like base URLs for routing
 */

export interface AppConfig {
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
  enableSpaRouting: boolean;
}

/**
 * Get base URL from environment variables
 * This is used for GitHub Pages PR previews and other deployment scenarios
 */
function getBaseUrl(): string {
  // Use Vite's native environment variable access (build-time injection)
  const envBaseUrl = import.meta.env.VITE_BASE_URL;
  
  // Debug logging to understand what's happening
  console.log('🔍 Environment variable debug - BASE_URL:');
  console.log('   import.meta.env.VITE_BASE_URL:', JSON.stringify(envBaseUrl));
  console.log('   typeof:', typeof envBaseUrl);
  console.log('   is undefined?:', envBaseUrl === undefined);
  console.log('   is string "undefined"?:', envBaseUrl === 'undefined');
  console.log('   truthy?:', !!envBaseUrl);
  
  if (envBaseUrl && envBaseUrl !== 'undefined') {
    // Ensure it starts with / and doesn't end with / (unless it's just '/')
    const normalized = envBaseUrl.startsWith('/') ? envBaseUrl : '/' + envBaseUrl;
    const result = normalized === '/' ? '' : normalized.replace(/\/$/, '');
    console.log('   normalized result:', JSON.stringify(result));
    return result;
  }

  console.log('   using default (empty string)');
  // Default: no base URL (root domain)
  return '';
}

/**
 * Application configuration instance
 */

/**
 * Get environment mode compatible with both Vite and Jest
 */
function getEnvironmentMode(): AppConfig['environment'] {
  // Check process.env (available in both Node.js and Vite after build)
  if (typeof process !== 'undefined' && process.env) {
    // Try NODE_ENV first (standard)
    if (process.env.NODE_ENV) {
      return (process.env.NODE_ENV as AppConfig['environment']) || 'development';
    }
    
    // Try MODE (Vite-specific)
    if (process.env.MODE) {
      return (process.env.MODE as AppConfig['environment']) || 'development';
    }
  }
  
  // Default fallback
  return 'development';
}

/**
 * Get SPA routing flag from environment variables
 * This enables GitHub Pages SPA routing mode where routes are encoded as query parameters
 */
function getSpaRoutingFlag(): boolean {
  const envFlag = import.meta.env.VITE_ENABLE_SPA_ROUTING;
  
  console.log('🔍 Environment variable debug - SPA_ROUTING:');
  console.log('   import.meta.env.VITE_ENABLE_SPA_ROUTING:', JSON.stringify(envFlag));
  console.log('   typeof:', typeof envFlag);
  console.log('   === "true"?:', envFlag === 'true');
  console.log('   === true?:', envFlag === true);
  
  const result = envFlag === 'true' || envFlag === true;
  console.log('   final result:', result);
  
  return result;
}

// Debug: Log complete environment before creating config
console.log('🌍 Complete import.meta.env at config creation:');
console.log(import.meta.env);

export const appConfig: AppConfig = {
  baseUrl: getBaseUrl(),
  environment: getEnvironmentMode(),
  enableSpaRouting: getSpaRoutingFlag()
};

// Debug: Log final config
console.log('🏠 Final appConfig:');
console.log(JSON.stringify(appConfig, null, 2));

/**
 * Get the full URL path with base URL prepended
 * @param path - The route path (e.g., '/dashboard')
 * @returns Full path with base URL (e.g., '/opinion-front-ui/pr-15/dashboard')
 */
export function getFullPath(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  // If no base URL, return path as-is
  if (!appConfig.baseUrl) {
    return normalizedPath;
  }
  
  // Combine base URL with path
  return appConfig.baseUrl + normalizedPath;
}

/**
 * Remove base URL from a full path to get the route path
 * @param fullPath - The full path (e.g., '/opinion-front-ui/pr-15/dashboard')
 * @returns Route path (e.g., '/dashboard')
 */
export function getRoutePath(fullPath: string): string {
  if (!appConfig.baseUrl) {
    return fullPath;
  }
  
  if (fullPath.startsWith(appConfig.baseUrl)) {
    const routePath = fullPath.slice(appConfig.baseUrl.length);
    return routePath || '/';
  }
  
  return fullPath;
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return appConfig.environment === 'development';
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return appConfig.environment === 'production';
}
/**
 * Application configuration
 * Handles environment-specific settings like base URLs for routing
 */

export interface AppConfig {
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * Get base URL from environment variables
 * Compatible with both Vite (import.meta.env) and Jest (process.env)
 */
function getBaseUrl(): string {
  // Check for explicit environment variable
  let envBaseUrl: string | undefined;
  
  // Always check process.env first (available in both Node.js and Vite)
  if (typeof process !== 'undefined' && process.env) {
    envBaseUrl = process.env.VITE_BASE_URL;
  }
  
  // For browser environment, Vite will inject process.env at build time
  // so we don't need import.meta.env at all
  
  if (envBaseUrl) {
    // Ensure it starts with / and doesn't end with / (unless it's just '/')
    const normalized = envBaseUrl.startsWith('/') ? envBaseUrl : '/' + envBaseUrl;
    return normalized === '/' ? '' : normalized.replace(/\/$/, '');
  }

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

export const appConfig: AppConfig = {
  baseUrl: getBaseUrl(),
  environment: getEnvironmentMode()
};

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
/**
 * Jest mock for app config
 * Avoids import.meta.env issues in test environment
 */

export interface AppConfig {
  baseUrl: string;
  environment: 'development' | 'production' | 'test';
}

export const appConfig: AppConfig = {
  baseUrl: '',
  environment: 'test'
};

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

export function isDevelopment(): boolean {
  return appConfig.environment === 'development';
}

export function isProduction(): boolean {
  return appConfig.environment === 'production';
}
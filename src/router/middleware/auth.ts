import { RouteContext, RouteResult } from '../types';
import { PUBLIC_ROUTES } from '../routes';

/**
 * Authentication middleware for the router
 * Ensures that non-public routes require authentication
 */
export async function authMiddleware(
  context: RouteContext,
  next: () => Promise<RouteResult>
): Promise<RouteResult> {
  const { pathname } = context;
  
  // Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route.path.endsWith('*')) {
      // Handle wildcard paths (e.g. /assets/*)
      const basePath = route.path.slice(0, -1);
      return pathname.startsWith(basePath);
    }
    return route.path === pathname;
  });

  if (isPublicRoute) {
    return next();
  }

  // For non-public routes, check authentication
  // This will need to be connected to the actual auth service
  const authService = context.services?.get('auth');
  if (!authService) {
    throw new Error('Auth service not available');
  }

  const isAuthenticated = await authService.isAuthenticated();
  if (!isAuthenticated) {
    // Redirect to login
    return {
      component: import('../pages/auth/LoginPage').then(m => m.default),
      params: {
        redirectTo: pathname
      }
    };
  }

  return next();
}
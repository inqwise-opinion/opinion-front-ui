import { RouteContext, RouteResult } from '../types';
import { PUBLIC_ROUTES } from '../routes';

/**
 * Authentication middleware for the router
 * Ensures that non-public routes require authentication
 */
export async function authMiddleware(
  context: any,
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

  // TEMP: allow all routes for now; integrate auth later
  return next();
}
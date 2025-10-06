import UniversalRouter, { RouteContext as UniversalRouteContext } from 'universal-router';
import { LayoutContext } from '../contexts/LayoutContext';
import { EventBus } from '../lib/EventBus';
import { Service } from '../interfaces/Service';
import { RouteDefinition, RouteResult } from './types';
import { RouteContextImpl } from './RouteContextImpl';
import { PageContextImpl } from '../contexts/PageContextImpl';
import { authMiddleware } from './middleware/auth';
import { ALL_ROUTES } from './routes';
import { getFullPath, getRoutePath, appConfig } from '../config/app';
import type { ActivePage } from '../interfaces/ActivePage';
import type { PageProvider } from './types';

/**
 * Internal router types
 */
interface ProcessedRoute {
  path: string;
  action: (context: UniversalRouteContext, params: Record<string, string | string[]>) => Promise<RouteResult>;
  children?: ProcessedRoute[];
}
interface NavigationState {
  currentPath: string;
  currentPage: ActivePage | null;
  isNavigating: boolean;
}

export class RouterService implements Service {
  public static readonly SERVICE_ID = 'router';
  private router: UniversalRouter<RouteResult> | null = null;
  private serviceId: string;
  private eventBus: EventBus;
  private navigationState: NavigationState = {
    currentPath: '/',
    currentPage: null,
    isNavigating: false
  };

  constructor(private layoutContext: LayoutContext) {
    this.serviceId = RouterService.SERVICE_ID;
    this.eventBus = layoutContext.getEventBus();
  }

  async init(): Promise<void> {
    // Initialize router with routes directly
    this.initializeRouter(ALL_ROUTES);

    // Handle initial route (skip during tests to avoid JSDOM URL issues)
    if (process.env.NODE_ENV !== 'test') {
      let currentPath = getRoutePath(window.location.pathname);
      
      // Handle SPA routing encoded as query parameter (e.g., ?/surveys) if enabled
      if (appConfig.enableSpaRouting && window.location.search.startsWith('?/')) {
        // Extract the route from query parameter and clean up URL
        const encodedRoute = window.location.search.slice(2); // Remove '?/'
        const decodedRoute = '/' + encodedRoute.replace(/~and~/g, '&');
        currentPath = decodedRoute;
        
        // Clean up the URL by replacing it with the proper route
        const fullPath = getFullPath(currentPath);
        window.history.replaceState(null, '', fullPath);
        
      }
      
      
      try {
        await this.handleRoute(currentPath);
      } catch (error) {
        console.error('RouterService - Initial route failed:', error);
        throw error;
      }
    }

    // Observe URL changes
    window.addEventListener('popstate', this.handlePopState);
  }

  async destroy(): Promise<void> {
    window.removeEventListener('popstate', this.handlePopState);
  }

  getServiceId(): string {
    return this.serviceId;
  }

  private handlePopState = (): void => {
    const routePath = getRoutePath(window.location.pathname);
    this.handleRoute(routePath);
  };

  private initializeRouter(routes: RouteDefinition[]): void {
    // Ensure all routes have a leading slash
    const normalizedRoutes = routes.map(route => ({
      ...route,
      path: route.path.startsWith('/') ? route.path : `/${route.path}`,
    }));

    // Process route tree recursively  
    const processRoute = (route: RouteDefinition): ProcessedRoute => ({
      // Ensure paths start with '/' for UniversalRouter
      path: route.path.startsWith('/') ? route.path : `/${route.path}`,
      action: async (context: UniversalRouteContext, params: Record<string, string | string[]>) => {
        // Create proper RouteContext from UniversalRouter context - use pathname as primary source
        const routePath = context.pathname || context.path || '/';
        // Convert params to Record<string, string> format
        const stringParams: Record<string, string> = {};
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            stringParams[key] = Array.isArray(value) ? value[0] : String(value);
          }
        }
        const routeContext = new RouteContextImpl(routePath, stringParams, this.layoutContext);
        return authMiddleware(context, async () => route.action(routeContext));
      },
      children: route.children?.map(processRoute)
    });

    // Create router with processed routes
    const processedRoutes = normalizedRoutes.map(processRoute);
    this.router = new UniversalRouter(processedRoutes);
  }

  /**
   * Handle route changes and page lifecycle
   */
  public async handleRoute(path: string): Promise<void> {
    if (!this.router || !this.layoutContext) {
      throw new Error('Router or Layout not initialized');
    }

    // Set navigation state
    this.navigationState.isNavigating = true;
    
    try {
      // Clean up current page if exists
      if (this.navigationState.currentPage && 'destroy' in this.navigationState.currentPage && typeof (this.navigationState.currentPage as { destroy?: () => Promise<void> }).destroy === 'function') {
        await (this.navigationState.currentPage as { destroy: () => Promise<void> }).destroy();
      }
      this.navigationState.currentPage = null;

      // Navigate to new page
      const result = await this.navigate(path);

      if (!result || !result.pageProvider) {
        throw new Error(`No page provider found for route ${path}`);
      }

      // Create RouteContext and PageContext using consistent path from result
      // The result.routeInfo contains the actual resolved path and params from the router
      // Extract basePath from the route path (e.g., '/surveys/123' -> basePath: '/surveys')
      const basePath = this.extractBasePath(result.routeInfo.path);
      const routeContext = new RouteContextImpl(result.routeInfo.path, result.routeInfo.params, this.layoutContext, undefined, basePath);
      
      // If this is an error page result, mark the route as failed
      if (result.routeInfo.params && 'errorCode' in result.routeInfo.params) {
        routeContext.fail({
          code: result.routeInfo.params.errorCode as string,
          message: result.routeInfo.params.errorMessage as string,
          details: result.routeInfo.params.errorDetails as string
        });
      }
      
      const pageContext = new PageContextImpl(routeContext, this.layoutContext);

      // Create and initialize new page component using PageProvider
      const mainContent = this.layoutContext.getMainContent();
      if (!mainContent) {
        throw new Error('MainContent not available from LayoutContext');
      }
      // Cast to MainContentImpl since PageProvider expects concrete implementation
      const newPage = result.pageProvider(mainContent as any, pageContext);

      // Associate page with context (one-time association)
      pageContext.setPage(newPage);

      await newPage.init();
      
      // Update navigation state with resolved path from routeContext (most accurate)
      this.navigationState.currentPage = newPage;
      this.navigationState.currentPath = routeContext.getPath();
    } catch (error) {
      console.error('Failed to load page for route: %s', path, error);
      
      // Reset navigation state on error
      this.navigationState.isNavigating = false;
      throw error;
    } finally {
      this.navigationState.isNavigating = false;
    }
  }

  /**
   * Navigate to a route and return the route result
   */
  private async navigate(path: string): Promise<RouteResult> {
    if (!this.router) throw new Error('Router not initialized');

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      // Notify about navigation start
      this.eventBus.publish('router:navigationStart', { 
        from: this.navigationState.currentPath, 
        to: normalizedPath 
      });

      try {
        // Resolve the route
        const resolveResult = await this.router.resolve(normalizedPath);
        const result = resolveResult as RouteResult;

        // Update browser history with full path and current path with route path
        const fullPath = getFullPath(normalizedPath);
        window.history.pushState(null, '', fullPath);
        this.navigationState.currentPath = normalizedPath;

        // Notify about successful navigation
        this.eventBus.publish('router:navigationEnd', { path: normalizedPath });

        return result;
      } catch (routeError) {
        // If route not found, return 404 page
        if (routeError instanceof Error && routeError.message.includes('Route not found')) {
          return await this.createErrorPageResult(
            normalizedPath,
            '404',
            'Page Not Found',
            `The page '${normalizedPath}' does not exist.`
          );
        }
        
        // For other router errors, return a generic error page
        if (routeError instanceof Error) {
          return await this.createErrorPageResult(
            normalizedPath,
            '503',
            'Service Unavailable',
            `Routing service is temporarily unavailable: ${routeError.message}`
          );
        }
        
        throw routeError;
      }
    } catch (error) {
      // Handle navigation errors
      this.eventBus.publish('router:error', { error: error as Error });
      throw error;
    }
  }

  getCurrentPath(): string {
    return this.navigationState.currentPath;
  }

  public getCurrentPage(): ActivePage | null {
    return this.navigationState.currentPage;
  }
  
  public isNavigating(): boolean {
    return this.navigationState.isNavigating;
  }
  
  // =====================================================================================
  // PROGRAMMATIC NAVIGATION METHODS
  // =====================================================================================
  
  /**
   * Navigate to a new route (pushes new state to history)
   */
  public async push(path: string): Promise<void> {
    await this.handleRoute(path);
  }
  
  /**
   * Navigate to a route from a full URL (handles base URL extraction)
   */
  public async navigateToUrl(url: string | URL): Promise<void> {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const routePath = getRoutePath(urlObj.pathname);
    await this.push(routePath);
  }
  
  /**
   * Check if a URL should be handled by SPA routing (internal links)
   */
  public isInternalUrl(url: string | URL): boolean {
    try {
      const urlObj = typeof url === 'string' ? new URL(url) : url;
      return urlObj.origin === window.location.origin;
    } catch {
      // Invalid URL
      return false;
    }
  }
  
  /**
   * Replace current route (replaces current state in history)
   */
  public async replace(path: string): Promise<void> {
    // Temporarily disable history push in navigate()
    const originalPush = window.history.pushState;
    window.history.pushState = (state: any, title: string, url?: string | URL | null) => {
      return window.history.replaceState(state, title, url);
    };
    
    try {
      await this.handleRoute(path);
    } finally {
      // Restore original pushState
      window.history.pushState = originalPush;
    }
  }
  
  /**
   * Go back in history
   */
  public back(): void {
    window.history.back();
  }
  
  /**
   * Go forward in history
   */
  public forward(): void {
    window.history.forward();
  }
  
  /**
   * Go to specific history entry
   */
  public go(delta: number): void {
    window.history.go(delta);
  }
  
  /**
   * Reload current page
   */
  public async reload(): Promise<void> {
    await this.handleRoute(this.navigationState.currentPath);
  }
  
  // =====================================================================================
  // PATH HANDLING HELPERS
  // =====================================================================================

  /**
   * Extract base path from a full route path
   * Examples:
   *   '/surveys' -> '/surveys'
   *   '/surveys/123' -> '/surveys'
   *   '/surveys/123/collectors' -> '/surveys'
   *   '/account/456' -> '/account'
   *   '/' -> '/'
   */
  private extractBasePath(fullPath: string): string {
    // Handle root path
    if (fullPath === '/') {
      return '/';
    }
    
    // Split path into segments
    const segments = fullPath.split('/').filter(segment => segment.length > 0);
    
    if (segments.length === 0) {
      return '/';
    }
    
    // For now, use the first segment as basePath
    // This handles common patterns like:
    //   /surveys/123 -> /surveys
    //   /account/456 -> /account
    return '/' + segments[0];
  }

  // =====================================================================================
  // ERROR HANDLING HELPERS
  // =====================================================================================
  
  /**
   * Create a standardized error page RouteResult
   */
  private async createErrorPageResult(
    path: string,
    errorCode: string = '404',
    errorMessage: string = 'Page Not Found',
    errorDetails?: string
  ): Promise<RouteResult> {
    const ErrorPage = (await import('../pages/ErrorPage')).default;
    
    // Put error info in route params so ErrorPage can access them
    const errorParams = {
      errorCode,
      errorMessage,
      errorDetails: errorDetails || `The page '${path}' could not be found.`
    };
    
    const pageProvider: PageProvider = (mainContent, pageContext) => {
      return new ErrorPage(mainContent, pageContext);
    };
    
    return {
      pageProvider,
      routeInfo: {
        path,
        params: errorParams
      }
    };
  }
}

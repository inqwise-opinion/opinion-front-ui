import UniversalRouter from 'universal-router';
import { LayoutContext } from '../contexts/LayoutContext';
import { EventBus } from '../lib/EventBus';
import { Service } from '../interfaces/Service';
import { RouteContext, RouteDefinition } from './types';
import { authMiddleware } from './middleware/auth';
import { ALL_ROUTES } from './routes';

interface RouteResult {
  component: any;
  params?: Record<string, any>;
}

export class RouterService implements Service {
  public static readonly SERVICE_ID = 'router';
  private router: any;
  private currentPath: string = '/';
  private serviceId: string;
  private eventBus: EventBus;
  private currentPage: any = null;

  constructor(private layoutContext: LayoutContext) {
    this.serviceId = RouterService.SERVICE_ID;
    this.eventBus = layoutContext.getEventBus();
    // Router will be initialized in init()
    this.router = null;
  }

  async init(): Promise<void> {
    console.log('🎯 ROUTER.TS - Initializing...');
    // Initialize router with empty routes
    this.router = new UniversalRouter([], {
      resolveRoute: async (context) => {
        if (!context.route?.action) return undefined; // allow nested/parent routes without action
        const routeContext = {
          ...context,
          services: new Map([['layout', this.layoutContext]])
        };
        return context.route.action(routeContext, {});
      }
    });

    // Register routes
    console.log('🎯 ROUTER.TS - Registering routes...');
    this.registerRoutes(ALL_ROUTES);

    // Handle initial route (skip during tests to avoid JSDOM URL issues)
    if (process.env.NODE_ENV !== 'test') {
      const currentPath = window.location.pathname;
      await this.handleRoute(currentPath);
    }

    // Observe URL changes
    window.addEventListener('popstate', this.handlePopState);

    console.log('✅ ROUTER.TS - Initialization complete');
  }

  async destroy(): Promise<void> {
    window.removeEventListener('popstate', this.handlePopState);
  }

  getServiceId(): string {
    return this.serviceId;
  }

  private handlePopState = () => {
    this.handleRoute(window.location.pathname);
  };

  registerRoutes(routes: RouteDefinition[]) {
    // Ensure all routes have a leading slash
    routes = routes.map(route => ({
      ...route,
      path: route.path.startsWith('/') ? route.path : `/${route.path}`,
    }));
    if (!this.router) throw new Error('Router not initialized');

    // Process route tree recursively
    const processRoute = (route: RouteDefinition): RouteDefinition => ({
      // Ensure paths start with '/' for UniversalRouter
      path: route.path.startsWith('/') ? route.path : `/${route.path}`,
      action: async (context: RouteContext) => {
        const routeContext = {
          ...context,
          services: new Map([['layout', this.layoutContext]])
        };
        return authMiddleware(routeContext, async () => route.action(routeContext));
      },
      children: route.children?.map(processRoute)
    });

    // Create router with processed routes
    const processedRoutes = routes.map(processRoute);
    this.router = new UniversalRouter(processedRoutes, {
      resolveRoute: async (context) => {
        if (!context.route?.action) {
          return undefined; // allow traversing to child routes
        }
        const routeContext = {
          ...context,
          services: new Map([['layout', this.layoutContext]])
        };
        const result = await context.route.action(routeContext, context.params || {});
        return result;
      }
    });
  }

  /**
   * Handle route changes and page lifecycle
   */
  public async handleRoute(path: string): Promise<void> {
    if (!this.router || !this.layoutContext) {
      throw new Error('Router or Layout not initialized');
    }

    console.log(`🎯 ROUTER.TS - handleRoute('${path}') START`);
    try {
      // Clean up current page if exists
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        console.log('🎯 ROUTER.TS - Destroying current page...');
        this.currentPage.destroy();
        console.log('✅ ROUTER.TS - Current page destroyed');
      }

      // Navigate to new page
      const result = await this.navigate(path);

      if (!result || !result.component) {
        throw new Error(`No component found for route ${path}`);
      }

      // Create and initialize new page component
      console.log(`🎯 ROUTER.TS - Creating ${result.component.name}...`);
      this.currentPage = new result.component(this.layoutContext.getMainContent());

      // Pass any route params to the page
      if (result.params) {
        console.log('🎯 ROUTER.TS - Setting route params:', result.params);
        this.currentPage.setParams?.(result.params);
      }

      console.log('🎯 ROUTER.TS - Initializing page component...');
      await this.currentPage.init();
      console.log('✅ ROUTER.TS - Page component initialized successfully');
    } catch (error) {
      console.error(
        `❌ ROUTER.TS - Failed to load page for route ${path}:`,
        error
      );
      console.error(`❌ ROUTER.TS - Route error stack:`, (error as Error).stack);
      throw error;
    }
    console.log(`🎯 ROUTER.TS - handleRoute('${path}') END`);
  }

  /**
   * Navigate to a route and return the route result
   */
  private async navigate(path: string) {
    if (!this.router) throw new Error('Router not initialized');

    try {
      // Ensure path starts with /
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Notify about navigation start
      this.eventBus.publish('router:navigationStart', { 
        from: this.currentPath, 
        to: normalizedPath 
      });

      try {
        // Resolve the route
        const result = await this.router.resolve(normalizedPath);

        // Update browser history and current path
        window.history.pushState(null, '', normalizedPath);
        this.currentPath = normalizedPath;

        // Notify about successful navigation
        this.eventBus.publish('router:navigationEnd', { path: normalizedPath });

        return result;
      } catch (routeError) {
        // If route not found, return 404 page
        if (routeError instanceof Error && routeError.message.includes('Route not found')) {
          const ErrorPage = (await import('../pages/ErrorPage')).default;
          return {
            component: ErrorPage,
            params: {
              code: '404',
              message: 'Page Not Found',
              details: `The page '${normalizedPath}' does not exist.`
            }
          };
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
    return this.currentPath;
  }

  public getCurrentPage(): any {
    return this.currentPage;
  }
}
import UniversalRouter from 'universal-router';
import { LayoutContext } from '../contexts/LayoutContext';
import { Service } from '../interfaces/Service';
import { RouteContext, RouteDefinition, RouterEventMap } from './types';
import { ALL_ROUTES } from './routes';
import { authMiddleware } from './middleware/auth';

export class RouterService implements Service {
  public static readonly SERVICE_ID = 'router';
  private router: UniversalRouter;
  private currentPath: string = '/';

  constructor(private layoutContext: LayoutContext) {
    this.router = new UniversalRouter(ALL_ROUTES, {
      baseUrl: '/',
      resolveRoute: async (context, params) => {
        const ctx = {
          ...context,
          params: params || {},
          services: new Map([['layout', this.layoutContext]])
        } as RouteContext;

        // Apply authentication middleware
        return authMiddleware(ctx, async () => {
          return (context as RouteContext).route.action(ctx);
        });
      },
    });
  }

  async init(): Promise<void> {
    // Observe URL changes
    window.addEventListener('popstate', this.handlePopState);
  }

  async destroy(): Promise<void> {
    window.removeEventListener('popstate', this.handlePopState);
  }

  private handlePopState = () => {
    this.navigate(window.location.pathname);
  };

  registerRoutes(routes: RouteDefinition[]) {
    this.router = new UniversalRouter(routes, {
      baseUrl: '/',
      resolveRoute: (context, params) => {
        return (context as RouteContext).route.action({
          ...context,
          params: params || {},
        } as RouteContext);
      },
    });
  }

  async navigate(path: string) {
    try {
      // Notify about navigation start
      this.layoutContext.eventBus.publish<RouterEventMap['router:navigationStart']>(
        'router:navigationStart',
        { from: this.currentPath, to: path }
      );

      // Resolve the route
      const result = await this.router.resolve(path);

      // Update browser history
      window.history.pushState(null, '', path);
      this.currentPath = path;

      // Notify about successful navigation
      this.layoutContext.eventBus.publish<RouterEventMap['router:navigationEnd']>(
        'router:navigationEnd',
        { path }
      );

      // Return the resolved route result
      return result;
    } catch (error) {
      // Handle navigation errors
      this.layoutContext.eventBus.publish<RouterEventMap['router:error']>(
        'router:error',
        { error: error as Error }
      );
      throw error;
    }
  }

  getCurrentPath(): string {
    return this.currentPath;
  }
}
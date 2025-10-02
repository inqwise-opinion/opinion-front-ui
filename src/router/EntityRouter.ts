import { Service } from '../interfaces/Service';
import { LayoutContext } from '../contexts/LayoutContext';
import { RouteDefinition, RouteResult, RouteContext } from './types';

export abstract class EntityRouter implements Service {
  protected routes: RouteDefinition[] = [];
  protected serviceId: string;

  getServiceId(): string {
    return this.serviceId;
  }

  constructor(
    protected layoutContext: LayoutContext,
    protected entityName: string
  ) {
    this.serviceId = `${entityName}.router`;
  }

  protected _isInitialized = false;
  
  async init(): Promise<void> {
    this.registerRoutes();
    await this.mount();
    this._isInitialized = true;
  }

  async destroy(): Promise<void> {
    // EntityRouter cleanup - no external dependencies to unmount
    this._isInitialized = false;
  }

  protected abstract registerRoutes(): void;

  protected async mount() {
    // EntityRouter is self-contained and handles its own routes
    // Routes are registered internally and handled via the handle() method
    console.log(`EntityRouter '${this.entityName}' mounted with ${this.routes.length} routes`);
  }


  /**
   * Handle route delegation - finds matching route and executes its action
   */
  public async handle(context: RouteContext): Promise<RouteResult> {
    if (!this._isInitialized) {
      throw new Error(`${this.entityName} router not initialized`);
    }

    const path = context.getPath();
    const matchingRoute = this.findMatchingRoute(path, this.routes);
    
    if (!matchingRoute) {
      throw new Error(`No route found for path: ${path} in ${this.entityName} router`);
    }

    return await matchingRoute.action(context);
  }

  /**
   * Find a route that matches the given path
   */
  private findMatchingRoute(path: string, routes: RouteDefinition[]): RouteDefinition | null {
    for (const route of routes) {
      if (this.matchesPath(path, route.path)) {
        return route;
      }
      
      // Check children routes recursively
      if (route.children && route.children.length > 0) {
        const childMatch = this.findMatchingRoute(path, route.children);
        if (childMatch) {
          return childMatch;
        }
      }
    }
    return null;
  }

  /**
   * Check if a path matches a route pattern
   */
  private matchesPath(path: string, routePattern: string): boolean {
    // Convert route pattern to regex (simplified implementation)
    const pattern = routePattern
      .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
      .replace(/\*/g, '.*');       // Replace * with catch-all
    
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  }

}
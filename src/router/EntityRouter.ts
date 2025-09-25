import { Service } from '../interfaces/Service';
import { LayoutContext } from '../contexts/LayoutContext';
import { RouteDefinition } from './types';

export abstract class EntityRouter implements Service {
  protected basePath: string = '/';
  protected routes: RouteDefinition[] = [];

  constructor(
    protected layoutContext: LayoutContext,
    protected entityName: string
  ) {}

  async init(): Promise<void> {
    this.registerRoutes();
    await this.mount();
  }

  async destroy(): Promise<void> {
    await this.unmount();
  }

  protected abstract registerRoutes(): void;

  protected getRouterService() {
    return this.layoutContext.getService('router');
  }

  protected async mount() {
    const routerService = this.getRouterService();
    if (!routerService) {
      throw new Error(`Router service not found when mounting ${this.entityName} router`);
    }
    
    // Register this router's routes
    routerService.registerRoutes(this.routes);
  }

  protected async unmount() {
    // No-op for now - in a more complex implementation, 
    // this would unregister routes from the router service
  }

  protected buildPath(path: string): string {
    return `${this.basePath}${path}`.replace(/\/+/g, '/');
  }
}
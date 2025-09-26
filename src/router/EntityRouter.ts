import { Service } from '../interfaces/Service';
import { LayoutContext } from '../contexts/LayoutContext';
import { RouteDefinition } from './types';

export abstract class EntityRouter implements Service {
  protected basePath: string = '/';
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
    this.basePath = '/';
  }

  protected _isInitialized = false;
  
  async init(): Promise<void> {
    this.registerRoutes();
    await this.mount();
    this._isInitialized = true;
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
    (routerService as any).registerRoutes(this.routes);
  }

  protected async unmount() {
    // No-op for now - in a more complex implementation, 
    // this would unregister routes from the router service
  }

  protected buildPath(path: string): string {
    // Normalize the base path to always start with /
    let basePath = this.basePath.startsWith('/') ? this.basePath : `/${this.basePath}`;
    basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

    // Handle special case for root path
    if (path === '/' || path === '') {
      return basePath;
    }

    // Clean up the input path
    let inputPath = path;
    inputPath = inputPath.startsWith('/') ? inputPath.substring(1) : inputPath;
    inputPath = inputPath.endsWith('/') ? inputPath.slice(0, -1) : inputPath;

    return `${basePath}/${inputPath}`.replace(/\/+/g, '/');
  }
}
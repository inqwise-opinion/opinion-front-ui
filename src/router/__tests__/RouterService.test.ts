import { RouterService } from '../RouterService';
import { LayoutContext } from '../../contexts/LayoutContext';
import { RouteDefinition } from '../types';
import { PageComponent } from '../../components/PageComponent';

class TestPage extends PageComponent {
  protected render(): void {}
}

describe('RouterService', () => {
  let routerService: RouterService;
  let layoutContext: LayoutContext;
  let publishSpy: jest.SpyInstance;

  beforeEach(() => {
    layoutContext = {
      eventBus: {
        publish: jest.fn(),
      },
    } as unknown as LayoutContext;

    publishSpy = jest.spyOn(layoutContext.eventBus, 'publish');
    routerService = new RouterService(layoutContext);
  });

  afterEach(() => {
    publishSpy.mockRestore();
  });

  it('should initialize with empty routes', () => {
    expect(routerService.getCurrentPath()).toBe('/');
  });

  it('should register routes and navigate to them', async () => {
    const routes: RouteDefinition[] = [
      {
        path: '/test',
        action: () => ({ component: TestPage }),
      },
    ];

    routerService.registerRoutes(routes);
    const result = await routerService.navigate('/test');

    expect(result).toEqual({ component: TestPage });
    expect(routerService.getCurrentPath()).toBe('/test');
  });

  it('should emit navigation events', async () => {
    const routes: RouteDefinition[] = [
      {
        path: '/test',
        action: () => ({ component: TestPage }),
      },
    ];

    routerService.registerRoutes(routes);
    await routerService.navigate('/test');

    expect(publishSpy).toHaveBeenCalledWith('router:navigationStart', {
      from: '/',
      to: '/test',
    });

    expect(publishSpy).toHaveBeenCalledWith('router:navigationEnd', {
      path: '/test',
    });
  });

  it('should emit error event on navigation failure', async () => {
    const routes: RouteDefinition[] = [
      {
        path: '/test',
        action: () => {
          throw new Error('Navigation failed');
        },
      },
    ];

    routerService.registerRoutes(routes);

    try {
      await routerService.navigate('/test');
    } catch (error) {
      expect(publishSpy).toHaveBeenCalledWith('router:error', {
        error: expect.any(Error),
      });
    }
  });
});
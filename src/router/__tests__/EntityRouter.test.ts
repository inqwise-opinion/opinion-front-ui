import { EntityRouter } from '../EntityRouter';
import { LayoutContext } from '../../contexts/LayoutContext';
import { RouteDefinition } from '../types';
import { PageComponent } from '../../components/PageComponent';

class TestPage extends PageComponent {
  protected render(): void {}
}

class TestEntityRouter extends EntityRouter {
  protected registerRoutes(): void {
    this.basePath = '/test';
    this.routes = [
      {
        path: this.buildPath('/'),
        action: () => ({ component: TestPage }),
      },
      {
        path: this.buildPath('/:id'),
        action: (context) => ({
          component: TestPage,
          params: context.params,
        }),
      },
    ];
  }
}

describe('EntityRouter', () => {
  let entityRouter: TestEntityRouter;
  let layoutContext: LayoutContext;
  let mockRouterService: { registerRoutes: jest.Mock };

  beforeEach(() => {
    mockRouterService = {
      registerRoutes: jest.fn(),
    };

    layoutContext = {
      getService: jest.fn().mockReturnValue(mockRouterService),
    } as unknown as LayoutContext;

    entityRouter = new TestEntityRouter(layoutContext, 'test');
  });

  it('should initialize and mount routes', async () => {
    await entityRouter.init();

    expect(mockRouterService.registerRoutes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/test',
        }),
        expect.objectContaining({
          path: '/test/:id',
        }),
      ])
    );
  });

  it('should build paths correctly', () => {
    // Access protected method via any
    const router = entityRouter as any;
    
    expect(router.buildPath('/test')).toBe('/test/test');
    expect(router.buildPath('test')).toBe('/test/test');
    expect(router.buildPath('/test/')).toBe('/test/test');
  });

  it('should throw error if router service is not available', async () => {
    layoutContext.getService = jest.fn().mockReturnValue(null);

    await expect(entityRouter.init()).rejects.toThrow(
      'Router service not found when mounting test router'
    );
  });
});
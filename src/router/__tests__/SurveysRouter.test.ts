import { SurveysRouter } from '../SurveysRouter';
import { LayoutContext } from '../../contexts/LayoutContext';

jest.mock('../pages/surveys/SurveyListPage', () => ({ default: {} }));
jest.mock('../pages/surveys/SurveyDetailPage', () => ({ default: {} }));
jest.mock('../pages/surveys/collectors/CollectorListPage', () => ({ default: {} }));
jest.mock('../pages/surveys/collectors/CollectorDetailPage', () => ({ default: {} }));

describe('SurveysRouter', () => {
  let surveysRouter: SurveysRouter;
  let layoutContext: LayoutContext;
  let mockRouterService: { registerRoutes: jest.Mock };

  beforeEach(() => {
    mockRouterService = {
      registerRoutes: jest.fn(),
    };

    layoutContext = {
      getService: jest.fn().mockReturnValue(mockRouterService),
    } as unknown as LayoutContext;

    surveysRouter = new SurveysRouter(layoutContext, 'surveys');
  });

  it('should initialize with correct routes', async () => {
    await surveysRouter.init();

    expect(mockRouterService.registerRoutes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/surveys',
        }),
        expect.objectContaining({
          path: '/surveys/:surveyId',
        }),
        expect.objectContaining({
          path: '/surveys/:surveyId/collectors',
          children: expect.arrayContaining([
            expect.objectContaining({
              path: '/:collectorId',
            }),
          ]),
        }),
      ])
    );
  });
});
import { SurveysRouter } from '../SurveysRouter';
import { LayoutContext } from '../../contexts/LayoutContext';
import { PageComponent } from '../../components/PageComponent';

// Create mock component class first
class MockPageComponent extends PageComponent {
  protected render(): void {}
  public destroy(): void {}
}

// Mock the component modules
const mockComponents = {
  SurveyListPage: class extends MockPageComponent {},
  SurveyDetailPage: class extends MockPageComponent {},
  CollectorListPage: class extends MockPageComponent {},
  CollectorDetailPage: class extends MockPageComponent {}
};

jest.mock('../../pages/surveys/SurveyListPage', () => ({ default: mockComponents.SurveyListPage }));
jest.mock('../../pages/surveys/SurveyDetailPage', () => ({ default: mockComponents.SurveyDetailPage }));
jest.mock('../../pages/surveys/collectors/CollectorListPage', () => ({ default: mockComponents.CollectorListPage }));
jest.mock('../../pages/surveys/collectors/CollectorDetailPage', () => ({ default: mockComponents.CollectorDetailPage }));

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
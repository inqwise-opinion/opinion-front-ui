import { EntityRouter } from './EntityRouter';
import { PageProvider } from './types';
import { LayoutContext } from '../contexts/LayoutContext';
import SurveyListPage from '../pages/surveys/SurveyListPage';
import SurveyDetailPage from '../pages/surveys/SurveyDetailPage';

export class SurveysRouter extends EntityRouter {
  public static readonly SERVICE_ID = 'surveys.router';

  constructor(layoutContext: LayoutContext, entityName: string) {
    super(layoutContext, entityName);
    this.serviceId = SurveysRouter.SERVICE_ID;
  }

  protected registerRoutes(): void {
    this.logger.info('🔍 SURVEYS ROUTER - Starting route registration...');
    
    this.routes = [
      {
        path: '/',
        action: async (context) => {
          const pageProvider: PageProvider = (mainContent, pageContext) => 
            new SurveyListPage(mainContent, pageContext);
          
          return {
            pageProvider,
            routeInfo: {
              path: context.getPath(),
              params: context.getParams()
            }
          };
        }
      },
      {
        path: '/:surveyId',
        action: async (context) => {
          const pageProvider: PageProvider = (mainContent, pageContext) => 
            new SurveyDetailPage(mainContent, pageContext);
          
          return {
            pageProvider,
            routeInfo: {
              path: context.getPath(),
              params: context.getParams()
            }
          };
        }
      }
    ];
  }
}
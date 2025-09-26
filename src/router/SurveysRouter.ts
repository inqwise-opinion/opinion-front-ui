import { EntityRouter } from './EntityRouter';
import { RouteDefinition } from './types';
import SurveyListPage from '../pages/surveys/SurveyListPage';
import SurveyDetailPage from '../pages/surveys/SurveyDetailPage';
import CollectorListPage from '../pages/surveys/collectors/CollectorListPage';
import CollectorDetailPage from '../pages/surveys/collectors/CollectorDetailPage';

export class SurveysRouter extends EntityRouter {
  public static readonly SERVICE_ID = 'surveys.router';

  protected registerRoutes(): void {
    this.basePath = '/surveys';
    
    this.routes = [
      {
        path: this.buildPath('/'),
        action: async (_context: any) => {
          return { component: SurveyListPage };
        }
      },
      {
        path: this.buildPath('/:surveyId'),
        action: async (context: any) => {
          return { component: SurveyDetailPage, params: context.params };
        }
      },
      {
        path: this.buildPath('/:surveyId/collectors'),
        action: async (context: any) => {
          return { component: CollectorListPage, params: context.params };
        },
        children: [
          {
            path: '/:collectorId',
            action: async (context: any) => {
              return { component: CollectorDetailPage, params: context.params };
            }
          }
        ]
      }
    ];
  }
}
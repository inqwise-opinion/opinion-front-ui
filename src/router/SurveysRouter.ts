import { EntityRouter } from './EntityRouter';
import { RouteDefinition } from './types';

export class SurveysRouter extends EntityRouter {
  public static readonly SERVICE_ID = 'surveys.router';

  protected registerRoutes(): void {
    this.basePath = '/surveys';
    
    this.routes = [
      {
        path: this.buildPath('/'),
        action: () => ({
          component: import('../pages/surveys/SurveyListPage').then(m => m.default)
        })
      },
      {
        path: this.buildPath('/:surveyId'),
        action: (context) => ({
          component: import('../pages/surveys/SurveyDetailPage').then(m => m.default),
          params: context.params
        })
      },
      {
        path: this.buildPath('/:surveyId/collectors'),
        action: (context) => ({
          component: import('../pages/surveys/collectors/CollectorListPage').then(m => m.default),
          params: context.params
        }),
        children: [
          {
            path: '/:collectorId',
            action: (context) => ({
              component: import('../pages/surveys/collectors/CollectorDetailPage').then(m => m.default),
              params: context.params
            })
          }
        ]
      }
    ];
  }
}
import { RouteDefinition, PageProvider } from './types';
import DashboardPage from "../pages/DashboardPage";
import DebugPage from "../pages/DebugPage";
import AccountRootPage from "../pages/account/AccountRootPage";
import AccountSettingsPage from "../pages/account/AccountSettingsPage";
import LoginPage from "../pages/auth/LoginPage";
import { SurveysRouter } from "./SurveysRouter";
import { LoggerFactory } from '../logging/LoggerFactory';

// Import RouteContextWrapper at the top level
import { RouteContextWrapper } from './RouteContextWrapper';

// Create logger for route handling
const logger = LoggerFactory.getInstance().getLogger('Routes');

// Public routes (no authentication required)
export const PUBLIC_ROUTES: RouteDefinition[] = [
  {
    path: "/login",
    action: async (context) => {
      const pageProvider: PageProvider = (mainContent, pageContext) =>
        new LoginPage(mainContent, pageContext);

      return {
        pageProvider,
        routeInfo: {
          path: context.getPath(),
          params: context.getParams(),
        },
      };
    },
  },
];

// Feature routes (available after authentication)
export const FEATURE_ROUTES: RouteDefinition[] = [
  {
    path: "/dashboard",
    action: async (context) => {
      const pageProvider: PageProvider = (mainContent, pageContext) =>
        new DashboardPage(mainContent, pageContext);

      return {
        pageProvider,
        routeInfo: {
          path: context.getPath(),
          params: context.getParams(),
        },
      };
    },
  },
  {
    path: "/surveys",
    children: [], // This makes it catch all routes under /surveys
    action: async (context) => {
      try {
        const serviceRef = context
          .getLayoutContext()
          .getServiceReference(SurveysRouter.SERVICE_ID);
        
        const surveysRouter = await serviceRef.get();
        if (!surveysRouter) {
          throw new Error("SurveysRouter service not found");
        }
        
        const fullPath = context.getPath();
        const subPath = fullPath.replace(/^\/surveys/, '') || '/';
        
        const wrappedContext = new RouteContextWrapper(
          context,
          subPath,       // relative path
          '/surveys'     // basePath
        );
        
        const result = await (surveysRouter as any).handle(wrappedContext);
        return result;
      } catch (error) {
        logger.error('❌ Surveys routing error:', (error as Error)?.message);
        
        // Return fallback error page
        const ErrorPage = (await import('../pages/ErrorPage')).default;
        const pageProvider: PageProvider = (mainContent, pageContext) => {
          const errorPage = new ErrorPage(mainContent, pageContext);
          errorPage.setParams({
            code: '500',
            message: 'Surveys Service Error',
            details: `Error in surveys routing: ${(error as Error)?.message}`
          });
          return errorPage;
        };

        return {
          pageProvider,
          routeInfo: {
            path: context.getPath(),
            params: context.getParams(),
          },
        };
      }
    },
  },
];

// Account routes with explicit paths instead of nesting
// NOTE: More specific routes must come first!
export const ACCOUNT_ROUTES: RouteDefinition[] = [
  {
    path: "/account/:accountId/settings",
    action: async (context) => {
      const pageProvider: PageProvider = (mainContent, pageContext) =>
        new AccountSettingsPage(mainContent, pageContext);

      return {
        pageProvider,
        routeInfo: {
          path: context.getPath(),
          params: context.getParams(),
        },
      };
    },
  },
  {
    path: "/account/:accountId",
    action: async (context) => {
      const pageProvider: PageProvider = (mainContent, pageContext) =>
        new AccountRootPage(mainContent, pageContext);

      return {
        pageProvider,
        routeInfo: {
          path: context.getPath(),
          params: context.getParams(),
        },
      };
    },
  },
];

export const ALL_ROUTES: RouteDefinition[] = [
  // Authentication routes first
  ...PUBLIC_ROUTES,

  ...FEATURE_ROUTES,

  // Account routes with their nested structure
  ...ACCOUNT_ROUTES,

  // Root route last (catch-all)
  {
    path: "/",
    action: async (context) => {
      const pageProvider: PageProvider = (mainContent, pageContext) =>
        new DebugPage(mainContent, pageContext);

      return {
        pageProvider,
        routeInfo: {
          path: context.getPath(),
          params: context.getParams(),
        },
      };
    },
  },
];

import { RouteDefinition } from './types';
import DashboardPage from '../pages/DashboardPage';
import DebugPage from '../pages/DebugPage';
import AccountRootPage from '../pages/account/AccountRootPage';
import AccountSettingsPage from '../pages/account/AccountSettingsPage';

// Public routes (no authentication required)
export const PUBLIC_ROUTES: RouteDefinition[] = [
  {
    path: '/login',
    action: async (_context: any) => {
      // TODO: implement real login route
      return { component: DebugPage };
    }
  }
];

// Feature routes (available after authentication)
export const FEATURE_ROUTES: RouteDefinition[] = [
  {
    path: '/dashboard',
    action: async (_context: any) => {
      return { component: DashboardPage };
    }
  },
  {
    path: '/surveys',
    action: async (_context: any) => {
      // TODO: Implement SurveysPage
      return { component: DebugPage };
    }
  },
  {
    path: '/surveys/create',
    action: async (_context: any) => {
      // TODO: Implement CreateSurveyPage
      return { component: DebugPage };
    }
  }
];

// Account routes with explicit paths instead of nesting
export const ACCOUNT_ROUTES: RouteDefinition[] = [
  {
    path: '/account/:accountId/settings',
    action: async (context: any) => {
      return { component: AccountSettingsPage, params: context.params };
    }
  },
  {
    path: '/account/:accountId',
    action: async (context: any) => {
      return { component: AccountRootPage, params: context.params };
    }
  }
];

export const ALL_ROUTES: RouteDefinition[] = [
  // Authentication routes first
  ...PUBLIC_ROUTES,
  
  // Feature routes (most specific paths first)
  {
    path: '/surveys/create',
    action: async (_context: any) => {
      // TODO: Implement CreateSurveyPage
      return { component: DebugPage };
    }
  },
  ...FEATURE_ROUTES,
  
  // Account routes with their nested structure
  ...ACCOUNT_ROUTES,
  
  // Root route last (catch-all)
  {
    path: '/',
    action: async (_context: any) => {
      return { component: DebugPage };
    }
  }
];

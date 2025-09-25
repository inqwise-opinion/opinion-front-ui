import { RouteDefinition } from './types';
import { PageComponent } from '../components/PageComponent';

// Public routes (no authentication required)
export const PUBLIC_ROUTES: RouteDefinition[] = [
  {
    path: '/login',
    action: () => ({
      component: import('../pages/auth/LoginPage').then(m => m.default)
    })
  },
  {
    path: '/assets/*',
    action: () => {
      // Handle static assets - this might need different handling
      throw new Error('Static assets should be handled by the web server');
    }
  }
];

// Root level entity routers (available after authentication)
export const ENTITY_ROUTES: RouteDefinition[] = [
  {
    path: '/dashboard',
    action: () => ({
      component: import('../pages/DashboardPage').then(m => m.default)
    })
  },
  {
    path: '/',
    action: () => ({
      component: import('../pages/DebugPage').then(m => m.default)
    })
  }
];

// Account-specific routes
export const ACCOUNT_ROUTES: RouteDefinition[] = [
  {
    path: '/account/:accountId',
    action: (context) => ({
      component: import('../pages/account/AccountRootPage').then(m => m.default),
      params: context.params
    }),
    children: [
      {
        path: '/settings',
        action: () => ({
          component: import('../pages/account/AccountSettingsPage').then(m => m.default)
        })
      }
    ]
  }
];

// Combine all routes
export const ALL_ROUTES: RouteDefinition[] = [
  ...PUBLIC_ROUTES,
  ...ENTITY_ROUTES,
  ...ACCOUNT_ROUTES
];
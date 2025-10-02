/**
 * Debug test for RouterService to identify the exact route causing path-to-regexp error
 * This test simulates the exact same route structure as the main RouterService
 */

describe('RouterService Route Structure Debug', () => {
  test('should test all routes step by step to identify the problematic route', () => {
    console.log('🔍 DEBUG TEST - Testing RouterService route structure...');
    
    // Import UniversalRouter - use default import syntax
    const UniversalRouter = require('universal-router').default;
    
    // Define the exact same routes as in routes.ts
    const PUBLIC_ROUTES = [
      {
        path: "/login",
        action: () => ({ test: 'login result' })
      }
    ];
    
    const FEATURE_ROUTES = [
      {
        path: "/dashboard", 
        action: () => ({ test: 'dashboard result' })
      },
      {
        path: "/surveys/*",
        action: () => ({ test: 'surveys result' })
      }
    ];
    
    const ACCOUNT_ROUTES = [
      {
        path: "/account/:accountId/settings",
        action: () => ({ test: 'account settings result' })
      },
      {
        path: "/account/:accountId", 
        action: () => ({ test: 'account result' })
      }
    ];
    
    const ROOT_ROUTE = {
      path: "/",
      action: () => ({ test: 'root result' })
    };
    
    // Test each route group individually
    console.log('📋 Testing PUBLIC_ROUTES...');
    try {
      const publicRouter = new UniversalRouter(PUBLIC_ROUTES);
      console.log('✅ PUBLIC_ROUTES work fine');
    } catch (error) {
      console.error('❌ PUBLIC_ROUTES failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing FEATURE_ROUTES without surveys...');
    const FEATURE_ROUTES_NO_SURVEYS = [
      {
        path: "/dashboard", 
        action: () => ({ test: 'dashboard result' })
      }
    ];
    try {
      const featureRouter = new UniversalRouter(FEATURE_ROUTES_NO_SURVEYS);
      console.log('✅ FEATURE_ROUTES (no surveys) work fine');
    } catch (error) {
      console.error('❌ FEATURE_ROUTES (no surveys) failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing FEATURE_ROUTES with surveys...');
    try {
      const featureRouter = new UniversalRouter(FEATURE_ROUTES);
      console.log('✅ FEATURE_ROUTES (with surveys) work fine');
    } catch (error) {
      console.error('❌ FEATURE_ROUTES (with surveys) failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing ACCOUNT_ROUTES...');
    try {
      const accountRouter = new UniversalRouter(ACCOUNT_ROUTES);
      console.log('✅ ACCOUNT_ROUTES work fine');
    } catch (error) {
      console.error('❌ ACCOUNT_ROUTES failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing ROOT_ROUTE...');
    try {
      const rootRouter = new UniversalRouter([ROOT_ROUTE]);
      console.log('✅ ROOT_ROUTE works fine');
    } catch (error) {
      console.error('❌ ROOT_ROUTE failed:', error.message);
      throw error;
    }
    
    // Test combinations
    console.log('📋 Testing PUBLIC + FEATURE (no surveys)...');
    try {
      const combo1Router = new UniversalRouter([
        ...PUBLIC_ROUTES,
        ...FEATURE_ROUTES_NO_SURVEYS
      ]);
      console.log('✅ PUBLIC + FEATURE (no surveys) work fine');
    } catch (error) {
      console.error('❌ PUBLIC + FEATURE (no surveys) failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing PUBLIC + FEATURE (with surveys)...');
    try {
      const combo2Router = new UniversalRouter([
        ...PUBLIC_ROUTES,
        ...FEATURE_ROUTES
      ]);
      console.log('✅ PUBLIC + FEATURE (with surveys) work fine');
    } catch (error) {
      console.error('❌ PUBLIC + FEATURE (with surveys) failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing PUBLIC + FEATURE + ACCOUNT...');
    try {
      const combo3Router = new UniversalRouter([
        ...PUBLIC_ROUTES,
        ...FEATURE_ROUTES,
        ...ACCOUNT_ROUTES
      ]);
      console.log('✅ PUBLIC + FEATURE + ACCOUNT work fine');
    } catch (error) {
      console.error('❌ PUBLIC + FEATURE + ACCOUNT failed:', error.message);
      throw error;
    }
    
    console.log('📋 Testing ALL ROUTES (including root)...');
    try {
      const allRoutesRouter = new UniversalRouter([
        ...PUBLIC_ROUTES,
        ...FEATURE_ROUTES,
        ...ACCOUNT_ROUTES,
        ROOT_ROUTE
      ]);
      console.log('✅ ALL ROUTES work fine');
    } catch (error) {
      console.error('❌ ALL ROUTES failed:', error.message);
      console.error('❌ This is likely our problem!');
      throw error;
    }
  });
});
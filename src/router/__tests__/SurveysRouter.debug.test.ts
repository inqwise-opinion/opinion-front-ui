/**
 * Debug test for SurveysRouter path generation
 * This test helps identify the exact issue with route path formatting
 * that's causing the "Missing parameter name at 10" error
 */

import { SurveysRouter } from '../SurveysRouter';
import { LayoutContextImpl } from '../../contexts/LayoutContextImpl';

describe('SurveysRouter Path Generation Debug', () => {
  let surveysRouter: SurveysRouter;
  let layoutContext: LayoutContextImpl;

  beforeEach(() => {
    // Create a minimal mock layout context
    layoutContext = new LayoutContextImpl();
    surveysRouter = new SurveysRouter(layoutContext, 'surveys');
  });

  test('should generate valid paths without errors', () => {
    console.log('🔍 DEBUG TEST - Testing SurveysRouter path generation...');
    
    try {
      // This calls registerRoutes() internally which generates the paths
      surveysRouter['registerRoutes']();
      
      const routes = surveysRouter['routes'];
      console.log('📋 DEBUG TEST - Generated routes:');
      
      routes.forEach((route, index) => {
        console.log(`  Route ${index + 1}: "${route.path}"`);
        console.log(`    Length: ${route.path.length}`);
        console.log(`    Character at position 10: "${route.path[9] || 'N/A'}"`);
        
        // Check for malformed parameter syntax
        const colonMatches = route.path.match(/:/g);
        const paramMatches = route.path.match(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        
        console.log(`    Colons found: ${colonMatches?.length || 0}`);
        console.log(`    Valid parameters: ${paramMatches?.length || 0}`);
        
        if (colonMatches && paramMatches && colonMatches.length !== paramMatches.length) {
          console.error(`❌ MALFORMED PARAMETER in route: "${route.path}"`);
          console.error(`   Expected ${colonMatches.length} parameters, found ${paramMatches.length}`);
        }
        
        // Check children routes if they exist
        if (route.children) {
          console.log(`    Children routes:`);
          route.children.forEach((child, childIndex) => {
            console.log(`      Child ${childIndex + 1}: "${child.path}"`);
            console.log(`        Length: ${child.path.length}`);
            
            const childColonMatches = child.path.match(/:/g);
            const childParamMatches = child.path.match(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
            
            console.log(`        Colons found: ${childColonMatches?.length || 0}`);
            console.log(`        Valid parameters: ${childParamMatches?.length || 0}`);
            
            if (childColonMatches && childParamMatches && childColonMatches.length !== childParamMatches.length) {
              console.error(`❌ MALFORMED PARAMETER in child route: "${child.path}"`);
              console.error(`   Expected ${childColonMatches.length} parameters, found ${childParamMatches.length}`);
            }
          });
        }
        
        console.log(''); // Empty line for readability
      });
      
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('❌ DEBUG TEST - Error during route generation:', error);
      throw error;
    }
  });

  test('should test route structure validity', () => {
    console.log('🔍 DEBUG TEST - Testing route structure validity...');
    
    const router = surveysRouter as any;
    router.registerRoutes();
    const routes = router.routes;
    
    routes.forEach((route: any, index: number) => {
      console.log(`Route ${index + 1}: "${route.path}"`);
      console.log(`  Action defined: ${typeof route.action === 'function'}`);
      
      // Validate path structure
      if (route.path.includes(':')) {
        const params = route.path.match(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        console.log(`  Parameters: ${params?.join(', ') || 'none'}`);
      }
      
      if (route.children) {
        console.log(`  Has ${route.children.length} child routes`);
        route.children.forEach((child: any, childIndex: number) => {
          console.log(`    Child ${childIndex + 1}: "${child.path}"`);
          console.log(`      Action defined: ${typeof child.action === 'function'}`);
        });
      }
    });
    
    expect(routes.length).toBeGreaterThan(0);
    routes.forEach((route: any) => {
      expect(route.path).toBeDefined();
      expect(route.action).toBeInstanceOf(Function);
    });
  });

  test('should test route path formats for compatibility', () => {
    console.log('🔍 DEBUG TEST - Testing route path formats...');
    
    const router = surveysRouter as any;
    router.registerRoutes();
    const routes = router.routes;
    
    // Test that all routes have valid path formats
    routes.forEach((route: any, index: number) => {
      const path = route.path;
      
      // Check for common path-to-regexp issues
      expect(path).toBeTruthy();
      expect(typeof path).toBe('string');
      
      // Test parameter syntax
      if (path.includes(':')) {
        const validParams = path.match(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        const allColons = path.match(/:/g);
        
        // All colons should be part of valid parameters
        expect(validParams?.length).toBe(allColons?.length);
        
        console.log(`Route ${index + 1}: "${path}" - Parameters: ${validParams?.join(', ') || 'none'}`);
      } else {
        console.log(`Route ${index + 1}: "${path}" - Static route`);
      }
      
      // Test children
      if (route.children) {
        route.children.forEach((child: any, childIndex: number) => {
          const childPath = child.path;
          expect(childPath).toBeTruthy();
          expect(typeof childPath).toBe('string');
          
          if (childPath.includes(':')) {
            const validParams = childPath.match(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
            const allColons = childPath.match(/:/g);
            expect(validParams?.length).toBe(allColons?.length);
          }
          
          console.log(`  Child ${childIndex + 1}: "${childPath}"`);
        });
      }
    });
    
    console.log('✅ All route paths have valid format for path-to-regexp compatibility');
  });
});
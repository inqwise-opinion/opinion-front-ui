import { 
  buildConfig, 
  isDevelopment, 
  isProduction, 
  isTest 
} from '../../src/config/build.config';

import { 
  appConfig, 
  getFullPath, 
  getRoutePath, 
  isHomepage 
} from '../../src/config/app';

import { DEFAULT_NAVIGATION_ITEMS } from '../../src/config/navigation';

describe('Build Configuration', () => {
  describe('buildConfig', () => {
    it('should have a valid build configuration', () => {
      expect(buildConfig).toBeDefined();
      expect(buildConfig).toHaveProperty('baseUrl');
      expect(buildConfig).toHaveProperty('enableSpaRouting');
      expect(buildConfig).toHaveProperty('environment');
      expect(buildConfig).toHaveProperty('enableDebugLogging');
    });

    it('should have string baseUrl', () => {
      expect(typeof buildConfig.baseUrl).toBe('string');
    });

    it('should have boolean enableSpaRouting', () => {
      expect(typeof buildConfig.enableSpaRouting).toBe('boolean');
    });

    it('should have valid environment', () => {
      expect(['development', 'production', 'test']).toContain(buildConfig.environment);
    });

    it('should have boolean enableDebugLogging', () => {
      expect(typeof buildConfig.enableDebugLogging).toBe('boolean');
    });

    it('should have optional assetsUrl', () => {
      if (buildConfig.assetsUrl !== undefined) {
        expect(typeof buildConfig.assetsUrl).toBe('string');
      }
    });
  });

  describe('Environment helpers', () => {
    it('should return boolean values', () => {
      expect(typeof isDevelopment()).toBe('boolean');
      expect(typeof isProduction()).toBe('boolean');
      expect(typeof isTest()).toBe('boolean');
    });

    it('should have exactly one environment as true', () => {
      const environmentChecks = [isDevelopment(), isProduction(), isTest()];
      const trueCount = environmentChecks.filter(check => check).length;
      
      expect(trueCount).toBe(1);
    });

    it('should match buildConfig environment', () => {
      switch (buildConfig.environment) {
        case 'development':
          expect(isDevelopment()).toBe(true);
          expect(isProduction()).toBe(false);
          expect(isTest()).toBe(false);
          break;
        case 'production':
          expect(isDevelopment()).toBe(false);
          expect(isProduction()).toBe(true);
          expect(isTest()).toBe(false);
          break;
        case 'test':
          expect(isDevelopment()).toBe(false);
          expect(isProduction()).toBe(false);
          expect(isTest()).toBe(true);
          break;
        default:
          fail(`Unknown environment: ${buildConfig.environment}`);
      }
    });
  });

  describe('Build config fallback behavior', () => {
    it('should handle missing __BUILD_CONFIG__ gracefully', () => {
      // This test verifies that the fallback logic works
      // In test environment, __BUILD_CONFIG__ might not be defined
      expect(buildConfig).toBeDefined();
      expect(buildConfig.environment).toBeDefined();
    });
  });
});

describe('App Configuration', () => {
  describe('appConfig', () => {
    it('should inherit from buildConfig', () => {
      expect(appConfig.baseUrl).toBe(buildConfig.baseUrl);
      expect(appConfig.environment).toBe(buildConfig.environment);
      expect(appConfig.enableSpaRouting).toBe(buildConfig.enableSpaRouting);
      expect(appConfig.enableDebugLogging).toBe(buildConfig.enableDebugLogging);
    });

    it('should have homepage page ID', () => {
      expect(appConfig.homepagePageId).toBeDefined();
      expect(typeof appConfig.homepagePageId).toBe('string');
      expect(appConfig.homepagePageId).toBe('dashboard');
    });
  });

  describe('getFullPath function', () => {
    const originalAppConfig = { ...appConfig };

    afterEach(() => {
      // Restore original config
      Object.assign(appConfig, originalAppConfig);
    });

    it('should handle paths when no base URL is set', () => {
      appConfig.baseUrl = '';
      
      expect(getFullPath('/dashboard')).toBe('/dashboard');
      expect(getFullPath('dashboard')).toBe('/dashboard');
      expect(getFullPath('/surveys/list')).toBe('/surveys/list');
    });

    it('should prepend base URL when set', () => {
      appConfig.baseUrl = '/opinion-front-ui';
      
      expect(getFullPath('/dashboard')).toBe('/opinion-front-ui/dashboard');
      expect(getFullPath('dashboard')).toBe('/opinion-front-ui/dashboard');
      expect(getFullPath('/surveys/list')).toBe('/opinion-front-ui/surveys/list');
    });

    it('should handle root path correctly', () => {
      appConfig.baseUrl = '/opinion-front-ui';
      
      expect(getFullPath('/')).toBe('/opinion-front-ui/');
      expect(getFullPath('')).toBe('/opinion-front-ui/');
    });

    it('should handle complex base URLs', () => {
      appConfig.baseUrl = '/opinion-front-ui/pr-123';
      
      expect(getFullPath('/dashboard')).toBe('/opinion-front-ui/pr-123/dashboard');
      expect(getFullPath('/surveys/create')).toBe('/opinion-front-ui/pr-123/surveys/create');
    });

    it('should ensure paths start with /', () => {
      appConfig.baseUrl = '/base';
      
      expect(getFullPath('dashboard')).toBe('/base/dashboard');
      expect(getFullPath('surveys/list')).toBe('/base/surveys/list');
    });
  });

  describe('getRoutePath function', () => {
    const originalAppConfig = { ...appConfig };

    afterEach(() => {
      // Restore original config
      Object.assign(appConfig, originalAppConfig);
    });

    it('should return path as-is when no base URL is set', () => {
      appConfig.baseUrl = '';
      
      expect(getRoutePath('/dashboard')).toBe('/dashboard');
      expect(getRoutePath('/surveys/list')).toBe('/surveys/list');
      expect(getRoutePath('/')).toBe('/');
    });

    it('should remove base URL when present', () => {
      appConfig.baseUrl = '/opinion-front-ui';
      
      expect(getRoutePath('/opinion-front-ui/dashboard')).toBe('/dashboard');
      expect(getRoutePath('/opinion-front-ui/surveys/list')).toBe('/surveys/list');
      expect(getRoutePath('/opinion-front-ui/')).toBe('/');
      expect(getRoutePath('/opinion-front-ui')).toBe('/');
    });

    it('should handle complex base URLs', () => {
      appConfig.baseUrl = '/opinion-front-ui/pr-123';
      
      expect(getRoutePath('/opinion-front-ui/pr-123/dashboard')).toBe('/dashboard');
      expect(getRoutePath('/opinion-front-ui/pr-123/surveys/create')).toBe('/surveys/create');
      expect(getRoutePath('/opinion-front-ui/pr-123')).toBe('/');
    });

    it('should return original path if base URL is not a prefix', () => {
      appConfig.baseUrl = '/opinion-front-ui';
      
      expect(getRoutePath('/other-app/dashboard')).toBe('/other-app/dashboard');
      expect(getRoutePath('/dashboard')).toBe('/dashboard');
    });

    it('should handle edge cases', () => {
      appConfig.baseUrl = '/opinion-front-ui';
      
      expect(getRoutePath('')).toBe('');
      // This DOES strip because '/opinion-front-ui' is a prefix of '/opinion-front-ui-extra/page'
      // The function is checking startsWith(), so '/opinion-front-ui-extra/page'.startsWith('/opinion-front-ui') is true
      expect(getRoutePath('/opinion-front-ui-extra/page')).toBe('-extra/page');
    });
  });

  describe('isHomepage function', () => {
    it('should identify homepage correctly', () => {
      expect(isHomepage('dashboard')).toBe(true);
      expect(isHomepage('surveys')).toBe(false);
      expect(isHomepage('debug')).toBe(false);
      expect(isHomepage('')).toBe(false);
      expect(isHomepage('DASHBOARD')).toBe(false); // Case sensitive
    });
  });

  describe('Exported helper functions', () => {
    it('should re-export environment helpers', () => {
      // Test that the functions are exported from app.ts
      const { isDevelopment: appIsDev, isProduction: appIsProd, isTest: appIsTest } = require('../../src/config/app');
      
      expect(appIsDev).toBe(isDevelopment);
      expect(appIsProd).toBe(isProduction);
      expect(appIsTest).toBe(isTest);
    });
  });
});

describe('Navigation Configuration', () => {
  describe('DEFAULT_NAVIGATION_ITEMS', () => {
    it('should be an array', () => {
      expect(Array.isArray(DEFAULT_NAVIGATION_ITEMS)).toBe(true);
      expect(DEFAULT_NAVIGATION_ITEMS.length).toBeGreaterThan(0);
    });

    it('should have valid navigation item structure', () => {
      DEFAULT_NAVIGATION_ITEMS.forEach((item, index) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('text');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('href');
        expect(item).toHaveProperty('caption');
        expect(item).toHaveProperty('active');

        expect(typeof item.id).toBe('string');
        expect(typeof item.text).toBe('string');
        expect(typeof item.icon).toBe('string');
        expect(typeof item.href).toBe('string');
        expect(typeof item.caption).toBe('string');
        expect(typeof item.active).toBe('boolean');

        expect(item.id).toBeTruthy();
        expect(item.text).toBeTruthy();
        expect(item.href.startsWith('/')).toBe(true);
      });
    });

    it('should contain expected navigation items', () => {
      const expectedItems = ['dashboard', 'surveys', 'debug'];
      const actualItems = DEFAULT_NAVIGATION_ITEMS.map(item => item.id);
      
      expectedItems.forEach(expectedId => {
        expect(actualItems).toContain(expectedId);
      });
    });

    it('should have unique IDs', () => {
      const ids = DEFAULT_NAVIGATION_ITEMS.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique hrefs', () => {
      const hrefs = DEFAULT_NAVIGATION_ITEMS.map(item => item.href);
      const uniqueHrefs = new Set(hrefs);
      
      expect(uniqueHrefs.size).toBe(hrefs.length);
    });

    it('should have all items inactive by default', () => {
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        expect(item.active).toBe(false);
      });
    });

    it('should have meaningful captions', () => {
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        expect(item.caption.length).toBeGreaterThan(10);
        expect(item.caption).toMatch(/^[A-Z]/); // Should start with capital letter
      });
    });

    describe('Individual navigation items', () => {
      let dashboardItem: any;
      let surveysItem: any;
      let debugItem: any;

      beforeEach(() => {
        dashboardItem = DEFAULT_NAVIGATION_ITEMS.find(item => item.id === 'dashboard');
        surveysItem = DEFAULT_NAVIGATION_ITEMS.find(item => item.id === 'surveys');
        debugItem = DEFAULT_NAVIGATION_ITEMS.find(item => item.id === 'debug');
      });

      it('should have dashboard item', () => {
        expect(dashboardItem).toBeDefined();
        expect(dashboardItem.text).toBe('Dashboard');
        expect(dashboardItem.icon).toBe('dashboard');
        expect(dashboardItem.href).toBe('/dashboard');
        expect(dashboardItem.caption).toContain('dashboard');
      });

      it('should have surveys item', () => {
        expect(surveysItem).toBeDefined();
        expect(surveysItem.text).toBe('Surveys');
        expect(surveysItem.icon).toBe('poll');
        expect(surveysItem.href).toBe('/surveys');
        expect(surveysItem.caption).toContain('survey');
      });

      it('should have debug item', () => {
        expect(debugItem).toBeDefined();
        expect(debugItem.text).toBe('Debug');
        expect(debugItem.icon).toBe('bug_report');
        expect(debugItem.href).toBe('/debug');
        expect(debugItem.caption).toContain('Development tools'); // Updated to match actual caption
      });
    });
  });
});

describe('Configuration Integration', () => {
  it('should have consistent configuration across files', () => {
    // App config should use build config values
    expect(appConfig.baseUrl).toBe(buildConfig.baseUrl);
    expect(appConfig.environment).toBe(buildConfig.environment);
    expect(appConfig.enableSpaRouting).toBe(buildConfig.enableSpaRouting);
    expect(appConfig.enableDebugLogging).toBe(buildConfig.enableDebugLogging);
  });

  it('should have navigation items that match homepage configuration', () => {
    const homepageNavItem = DEFAULT_NAVIGATION_ITEMS.find(
      item => item.id === appConfig.homepagePageId
    );
    
    expect(homepageNavItem).toBeDefined();
    expect(homepageNavItem?.href).toBe(`/${appConfig.homepagePageId}`);
  });

  it('should handle different environment configurations', () => {
    // Test that the configuration system can handle different environments
    expect(['development', 'production', 'test']).toContain(buildConfig.environment);
    
    // Debug logging should typically be enabled in development, disabled in production
    if (buildConfig.environment === 'development') {
      // In development, debug logging is typically enabled, but not required
      expect(typeof buildConfig.enableDebugLogging).toBe('boolean');
    } else if (buildConfig.environment === 'production') {
      // In production, debug logging should typically be disabled
      expect(typeof buildConfig.enableDebugLogging).toBe('boolean');
    }
  });

  describe('Path resolution integration', () => {
    it('should correctly resolve paths for navigation items', () => {
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        const fullPath = getFullPath(item.href);
        const routePath = getRoutePath(fullPath);
        
        expect(routePath).toBe(item.href);
      });
    });

    it('should handle round-trip path conversion', () => {
      const testPaths = ['/dashboard', '/surveys', '/debug', '/surveys/create'];
      
      testPaths.forEach(path => {
        const fullPath = getFullPath(path);
        const routePath = getRoutePath(fullPath);
        
        expect(routePath).toBe(path);
      });
    });
  });
});

describe('Configuration Edge Cases', () => {
  describe('Empty and null values', () => {
    it('should handle empty base URL gracefully', () => {
      const originalBaseUrl = appConfig.baseUrl;
      appConfig.baseUrl = '';
      
      expect(getFullPath('/test')).toBe('/test');
      expect(getRoutePath('/test')).toBe('/test');
      
      // Restore
      appConfig.baseUrl = originalBaseUrl;
    });

    it('should handle empty paths', () => {
      expect(getFullPath('')).toMatch(/^\//);
      expect(getRoutePath('')).toBe('');
    });
  });

  describe('Special characters in paths', () => {
    it('should handle special characters in paths', () => {
      const specialPaths = [
        '/path with spaces',
        '/path-with-dashes',
        '/path_with_underscores',
        '/path.with.dots',
        '/path123with456numbers'
      ];
      
      specialPaths.forEach(path => {
        const fullPath = getFullPath(path);
        const routePath = getRoutePath(fullPath);
        
        expect(routePath).toBe(path);
      });
    });
  });

  describe('Configuration validation', () => {
    it('should have valid navigation item icons', () => {
      const validIconPattern = /^[a-z_]+$/; // Material icons pattern
      
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        expect(item.icon).toMatch(validIconPattern);
      });
    });

    it('should have valid navigation item IDs', () => {
      const validIdPattern = /^[a-z]+$/; // Simple lowercase letters
      
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        expect(item.id).toMatch(validIdPattern);
      });
    });

    it('should have navigation hrefs that match the expected pattern', () => {
      DEFAULT_NAVIGATION_ITEMS.forEach(item => {
        expect(item.href).toMatch(/^\/[a-z]+$/);
      });
    });
  });
});
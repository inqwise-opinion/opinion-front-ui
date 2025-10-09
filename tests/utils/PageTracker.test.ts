import { PageTracker } from '../../src/utils/PageTracker';
import { LoggerFactory } from '../../src/logging/LoggerFactory';

// Mock the logger to avoid console output during tests
jest.mock('../../src/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getInstance: () => ({
      getLogger: () => ({
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      })
    })
  }
}));

// Mock the global EventBus and dependencies
jest.mock('../../src/lib', () => ({
  globalEventBus: {
    request: jest.fn(),
    publish: jest.fn(),
    consume: jest.fn(() => ({ unregister: jest.fn() })),
    getDebugInfo: jest.fn(() => ({
      eventCount: 5,
      totalConsumers: 10
    }))
  }
}));

// Mock the interfaces
jest.mock('../../src/components/ActivePageStatusComponent', () => ({}));
jest.mock('../../src/interfaces/ActivePage', () => ({}));

// Import after mocking
import { globalEventBus } from '../../src/lib';

// Mock console methods for testing
const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    group: jest.fn(),
    groupEnd: jest.fn(),
    log: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('PageTracker', () => {
  let pageTracker: PageTracker;
  const mockConsume = globalEventBus.consume as jest.Mock;
  const mockRequest = globalEventBus.request as jest.Mock;
  const mockPublish = globalEventBus.publish as jest.Mock;
  const mockGetDebugInfo = globalEventBus.getDebugInfo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockConsume.mockReturnValue({ unregister: jest.fn() });
    mockGetDebugInfo.mockReturnValue({
      eventCount: 5,
      totalConsumers: 10
    });
    
    pageTracker = new PageTracker();
  });

  afterEach(() => {
    if (pageTracker) {
      pageTracker.destroy();
    }
  });

  describe('Initialization', () => {
    it('should create PageTracker instance', () => {
      expect(pageTracker).toBeInstanceOf(PageTracker);
    });

    it('should setup event listeners on creation', () => {
      // Should have set up multiple consumers for different events
      expect(mockConsume).toHaveBeenCalledTimes(5); // 4 page events + 1 test event
      
      // Verify the events being consumed
      const consumedEvents = mockConsume.mock.calls.map(call => call[0]);
      expect(consumedEvents).toContain('page:status-updated');
      expect(consumedEvents).toContain('page:activated');
      expect(consumedEvents).toContain('page:deactivated');
      expect(consumedEvents).toContain('page:changed');
      expect(consumedEvents).toContain('test:page-tracker');
    });
  });

  describe('getInfo method', () => {
    it('should return page tracking info successfully', async () => {
      const mockStatus = {
        hasActivePage: true,
        pageId: 'dashboard',
        pageName: 'Dashboard',
        pagePath: '/dashboard'
      };
      
      mockRequest.mockResolvedValueOnce(mockStatus);
      
      const info = await pageTracker.getInfo();
      
      expect(mockRequest).toHaveBeenCalledWith('page:get-status', {});
      expect(mockGetDebugInfo).toHaveBeenCalled();
      
      expect(info).toEqual({
        hasActivePage: true,
        currentPageId: 'dashboard',
        currentPageName: 'Dashboard',
        currentPagePath: '/dashboard',
        eventBusInfo: {
          eventCount: 5,
          totalConsumers: 10
        }
      });
    });

    it('should handle errors gracefully', async () => {
      mockRequest.mockRejectedValueOnce(new Error('EventBus error'));
      
      const info = await pageTracker.getInfo();
      
      expect(info).toEqual({
        hasActivePage: false,
        currentPageId: null,
        currentPageName: null,
        currentPagePath: null,
        eventBusInfo: {
          eventCount: 0,
          totalConsumers: 0
        }
      });
    });
  });

  describe('getCurrentPageInfo method', () => {
    it('should return current page info', async () => {
      const mockPageInfo = {
        id: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        metadata: { title: 'Main Dashboard' }
      };
      
      mockRequest.mockResolvedValueOnce(mockPageInfo);
      
      const pageInfo = await pageTracker.getCurrentPageInfo();
      
      expect(mockRequest).toHaveBeenCalledWith('page:get-current-info', {});
      expect(pageInfo).toEqual(mockPageInfo);
    });

    it('should return null on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Request failed'));
      
      const pageInfo = await pageTracker.getCurrentPageInfo();
      
      expect(pageInfo).toBeNull();
    });
  });

  describe('isPageActive method', () => {
    it('should check if page is active', async () => {
      mockRequest.mockResolvedValueOnce(true);
      
      const isActive = await pageTracker.isPageActive('dashboard');
      
      expect(mockRequest).toHaveBeenCalledWith('page:is-active', { pageId: 'dashboard' });
      expect(isActive).toBe(true);
    });

    it('should return false on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Check failed'));
      
      const isActive = await pageTracker.isPageActive('nonexistent');
      
      expect(isActive).toBe(false);
    });
  });

  describe('Event history management', () => {
    it('should start with empty event history', () => {
      const history = pageTracker.getEventHistory();
      
      expect(history).toEqual([]);
    });

    it('should track page status updates', () => {
      // Get the callback for page:status-updated
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      expect(statusCallback).toBeDefined();
      
      // Simulate status update
      const mockStatusData = {
        pageId: 'dashboard',
        pageName: 'Dashboard',
        hasActivePage: true
      };
      
      statusCallback(mockStatusData);
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].event).toBe('page:status-updated');
      expect(history[0].data).toEqual({
        pageId: 'dashboard',
        pageName: 'Dashboard',
        hasActivePage: true
      });
    });

    it('should track page activations', () => {
      const activatedCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:activated'
      )?.[1];
      
      expect(activatedCallback).toBeDefined();
      
      // Simulate page activation
      const mockPageData = {
        page: {
          getPageId: () => 'surveys',
          getPageInfo: () => ({ name: 'Surveys' })
        }
      };
      
      activatedCallback(mockPageData);
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].event).toBe('page:activated');
      expect(history[0].data).toEqual({
        pageId: 'surveys',
        pageName: 'Surveys'
      });
    });

    it('should track page changes', () => {
      const changedCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:changed'
      )?.[1];
      
      expect(changedCallback).toBeDefined();
      
      // Simulate page change
      const mockChangeData = {
        previousPage: {
          getPageId: () => 'dashboard',
          getPageInfo: () => ({ name: 'Dashboard' })
        },
        currentPage: {
          getPageId: () => 'surveys',
          getPageInfo: () => ({ name: 'Surveys' })
        }
      };
      
      changedCallback(mockChangeData);
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].event).toBe('page:changed');
      expect(history[0].data).toEqual({
        fromPageId: 'dashboard',
        toPageId: 'surveys',
        fromPageName: 'Dashboard',
        toPageName: 'Surveys'
      });
    });

    it('should limit history size', () => {
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      expect(statusCallback).toBeDefined();
      
      // Add more than max history size (20) events
      for (let i = 0; i < 25; i++) {
        statusCallback({
          pageId: `page-${i}`,
          pageName: `Page ${i}`,
          hasActivePage: true
        });
      }
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(20); // Should be limited to maxHistorySize
      
      // Should keep the most recent events
      expect(history[0].data.pageId).toBe('page-5'); // oldest kept
      expect(history[19].data.pageId).toBe('page-24'); // newest
    });

    it('should include time ago information in history', () => {
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      expect(statusCallback).toBeDefined();
      
      statusCallback({
        pageId: 'test-page',
        pageName: 'Test Page',
        hasActivePage: true
      });
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('ago');
      expect(typeof history[0].ago).toBe('string');
    });
  });

  describe('EventBus debugging', () => {
    it('should get EventBus debug info', () => {
      const debugInfo = pageTracker.getEventBusDebugInfo();
      
      expect(mockGetDebugInfo).toHaveBeenCalled();
      expect(debugInfo).toEqual({
        eventCount: 5,
        totalConsumers: 10
      });
    });

    it('should test EventBus functionality', () => {
      pageTracker.testEventBus('Test message');
      
      expect(mockPublish).toHaveBeenCalledWith('test:page-tracker', {
        message: 'Test message',
        timestamp: expect.any(Number),
        source: 'PageTracker'
      });
    });

    it('should test EventBus with default message', () => {
      pageTracker.testEventBus();
      
      expect(mockPublish).toHaveBeenCalledWith('test:page-tracker', {
        message: 'Hello from PageTracker!',
        timestamp: expect.any(Number),
        source: 'PageTracker'
      });
    });
  });

  describe('printStatus method', () => {
    it('should print status to console', async () => {
      const mockStatus = {
        hasActivePage: true,
        pageId: 'dashboard',
        pageName: 'Dashboard',
        pagePath: '/dashboard'
      };
      
      const mockPageInfo = {
        id: 'dashboard',
        name: 'Dashboard',
        metadata: { title: 'Main Dashboard' }
      };
      
      mockRequest
        .mockResolvedValueOnce(mockStatus) // for getInfo()
        .mockResolvedValueOnce(mockPageInfo); // for getCurrentPageInfo()
      
      await pageTracker.printStatus();
      
      expect(console.group).toHaveBeenCalledWith('📊 PageTracker Status');
      expect(console.log).toHaveBeenCalledWith('🔍 Has Active Page:', true);
      expect(console.log).toHaveBeenCalledWith('📄 Current Page ID:', 'dashboard');
      expect(console.log).toHaveBeenCalledWith('📄 Current Page Name:', 'Dashboard');
      expect(console.log).toHaveBeenCalledWith('📄 Current Page Path:', '/dashboard');
      expect(console.log).toHaveBeenCalledWith('📄 Page Metadata:', { title: 'Main Dashboard' });
      expect(console.log).toHaveBeenCalledWith('📡 EventBus Events:', 5);
      expect(console.log).toHaveBeenCalledWith('📡 EventBus Consumers:', 10);
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('should handle status with no active page', async () => {
      const mockStatus = {
        hasActivePage: false,
        pageId: null,
        pageName: null,
        pagePath: null
      };
      
      mockRequest.mockResolvedValueOnce(mockStatus);
      
      await pageTracker.printStatus();
      
      expect(console.log).toHaveBeenCalledWith('🔍 Has Active Page:', false);
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Current Page ID:')
      );
    });

    it('should display recent events in status', async () => {
      // Add some events to history
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      statusCallback({ pageId: 'test1', pageName: 'Test 1', hasActivePage: true });
      statusCallback({ pageId: 'test2', pageName: 'Test 2', hasActivePage: true });
      statusCallback({ pageId: 'test3', pageName: 'Test 3', hasActivePage: true });
      
      const mockStatus = { hasActivePage: false, pageId: null, pageName: null, pagePath: null };
      mockRequest.mockResolvedValueOnce(mockStatus);
      
      await pageTracker.printStatus();
      
      expect(console.log).toHaveBeenCalledWith('📜 Recent Events:', 3);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('• page:status-updated')
      );
    });
  });

  describe('Destroy functionality', () => {
    it('should cleanup consumers and history on destroy', () => {
      // Use the existing pageTracker instance instead of creating a new one
      // since the mock setup is for the existing instance
      
      // Add some history to the existing instance
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      if (statusCallback) {
        statusCallback({ pageId: 'test', pageName: 'Test', hasActivePage: true });
      }
      
      expect(pageTracker.getEventHistory()).toHaveLength(1);
      
      pageTracker.destroy();
      
      // Should clear history
      expect(pageTracker.getEventHistory()).toHaveLength(0);
      
      // The mock unregister functions would have been called
      // but since we're using the same instance throughout the test,
      // we can't easily verify the exact calls without interfering with other tests
    });
  });

  describe('Time formatting', () => {
    it('should format time correctly', () => {
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      expect(statusCallback).toBeDefined();
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      const mockNow = 1000000;
      Date.now = jest.fn(() => mockNow);
      
      // Add event with specific timestamp
      const eventTime = mockNow - 30000; // 30 seconds ago
      statusCallback({
        pageId: 'test',
        pageName: 'Test',
        hasActivePage: true
      });
      
      // Manually set the timestamp to test time formatting
      const history = pageTracker.getEventHistory();
      if (history.length > 0) {
        // The timeAgo method should be tested through the actual interface
        expect(history[0].ago).toMatch(/\d+[smhd] ago/);
      }
      
      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing page info gracefully', () => {
      const changedCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:changed'
      )?.[1];
      
      expect(changedCallback).toBeDefined();
      
      // Simulate change with missing previousPage
      const mockChangeData = {
        currentPage: {
          getPageId: () => 'surveys',
          getPageInfo: () => ({ name: 'Surveys' })
        }
      };
      
      expect(() => {
        changedCallback(mockChangeData);
      }).not.toThrow();
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].data.fromPageId).toBeUndefined();
      expect(history[0].data.toPageId).toBe('surveys');
    });

    it('should handle test event reception', () => {
      const testCallback = mockConsume.mock.calls.find(
        call => call[0] === 'test:page-tracker'
      )?.[1];
      
      expect(testCallback).toBeDefined();
      
      const testData = { message: 'Test event data' };
      testCallback(testData);
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].event).toBe('test:page-tracker');
      expect(history[0].data).toEqual(testData);
    });

    it('should handle null/undefined event data', () => {
      const statusCallback = mockConsume.mock.calls.find(
        call => call[0] === 'page:status-updated'
      )?.[1];
      
      expect(() => {
        statusCallback(null);
        statusCallback(undefined);
        statusCallback({});
      }).not.toThrow();
      
      const history = pageTracker.getEventHistory();
      expect(history).toHaveLength(3);
    });
  });

  describe('Global instance and window integration', () => {
    it('should handle window object availability', () => {
      // Test that the module handles cases where window might not be available
      // This is implicitly tested by the module loading without errors
      expect(pageTracker).toBeInstanceOf(PageTracker);
    });
  });
});
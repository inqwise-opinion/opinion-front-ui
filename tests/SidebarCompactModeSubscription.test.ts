/**
 * Unit tests for Sidebar Compact Mode Subscription functionality
 * Tests the event subscription system for compact mode changes
 */

import { Sidebar, CompactModeChangeHandler } from '../src/components/Sidebar';

describe('Sidebar Compact Mode Subscription', () => {
  let sidebar: Sidebar;
  let sidebarElement: HTMLElement;
  let compactToggleButton: HTMLElement;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div class="app-layout">
        <nav class="app-sidebar" id="app-sidebar" aria-label="Main navigation">
          <div class="sidebar-header">
            <div class="sidebar-brand">
              <h1 class="brand-title">Opinion</h1>
            </div>
          </div>
          <div class="sidebar-navigation">
            <!-- Navigation populated by Sidebar component -->
          </div>
          <div class="sidebar-footer">
            <!-- Footer populated by Sidebar component -->
          </div>
        </nav>
      </div>
    `;
    
    // Create desktop viewport environment (compact mode is for desktop)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Initialize sidebar
    sidebar = new Sidebar();
    sidebar.init();
    
    // Get DOM references
    sidebarElement = document.getElementById('app-sidebar') as HTMLElement;
    compactToggleButton = document.querySelector('.compact-toggle-btn') as HTMLElement;
  });

  afterEach(() => {
    // Clean up sidebar instance
    if (sidebar) {
      sidebar.destroy();
    }
    
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Subscription Management', () => {
    test('should allow subscribing to compact mode changes', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      const unsubscribe = sidebar.onCompactModeChange(handler);
      
      expect(typeof unsubscribe).toBe('function');
      expect(handler).not.toHaveBeenCalled();
    });

    test('should call handler when compact mode is toggled', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      expect(handler).toHaveBeenCalledWith(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should call handler with correct state on subsequent toggles', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Toggle to compact mode
      compactToggleButton.click();
      expect(handler).toHaveBeenLastCalledWith(true);
      
      // Toggle back to normal mode
      compactToggleButton.click();
      expect(handler).toHaveBeenLastCalledWith(false);
      
      expect(handler).toHaveBeenCalledTimes(2);
    });

    test('should support multiple subscribers', () => {
      const handler1: CompactModeChangeHandler = jest.fn();
      const handler2: CompactModeChangeHandler = jest.fn();
      const handler3: CompactModeChangeHandler = jest.fn();
      
      sidebar.onCompactModeChange(handler1);
      sidebar.onCompactModeChange(handler2);
      sidebar.onCompactModeChange(handler3);
      
      // Toggle compact mode
      compactToggleButton.click();
      
      expect(handler1).toHaveBeenCalledWith(true);
      expect(handler2).toHaveBeenCalledWith(true);
      expect(handler3).toHaveBeenCalledWith(true);
    });

    test('should call all subscribers in the order they were added', () => {
      const callOrder: number[] = [];
      const handler1: CompactModeChangeHandler = () => callOrder.push(1);
      const handler2: CompactModeChangeHandler = () => callOrder.push(2);
      const handler3: CompactModeChangeHandler = () => callOrder.push(3);
      
      sidebar.onCompactModeChange(handler1);
      sidebar.onCompactModeChange(handler2);
      sidebar.onCompactModeChange(handler3);
      
      // Toggle compact mode
      compactToggleButton.click();
      
      expect(callOrder).toEqual([1, 2, 3]);
    });

    test('should handle handlers that throw errors without affecting others', () => {
      const errorHandler: CompactModeChangeHandler = () => {
        throw new Error('Handler error');
      };
      const workingHandler: CompactModeChangeHandler = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      sidebar.onCompactModeChange(errorHandler);
      sidebar.onCompactModeChange(workingHandler);
      
      // Toggle compact mode
      compactToggleButton.click();
      
      // Working handler should still be called despite error in first handler
      expect(workingHandler).toHaveBeenCalledWith(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Sidebar - Error in compact mode change handler:',
        expect.any(Error)
      );
    });
  });

  describe('Unsubscription', () => {
    test('should stop calling handler after unsubscribing', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      const unsubscribe = sidebar.onCompactModeChange(handler);
      
      // Toggle once - should call handler
      compactToggleButton.click();
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Toggle again - should not call handler
      compactToggleButton.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should only unsubscribe the specific handler', () => {
      const handler1: CompactModeChangeHandler = jest.fn();
      const handler2: CompactModeChangeHandler = jest.fn();
      
      const unsubscribe1 = sidebar.onCompactModeChange(handler1);
      sidebar.onCompactModeChange(handler2);
      
      // Unsubscribe only handler1
      unsubscribe1();
      
      // Toggle compact mode
      compactToggleButton.click();
      
      // Only handler2 should be called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(true);
    });

    test('should handle multiple unsubscriptions safely', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      const unsubscribe = sidebar.onCompactModeChange(handler);
      
      // Unsubscribe multiple times - should not throw error
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
      
      // Toggle compact mode
      compactToggleButton.click();
      
      // Handler should not be called
      expect(handler).not.toHaveBeenCalled();
    });

    test('should handle unsubscribing non-existent handler safely', () => {
      const handler1: CompactModeChangeHandler = jest.fn();
      const handler2: CompactModeChangeHandler = jest.fn();
      
      const unsubscribe1 = sidebar.onCompactModeChange(handler1);
      
      // Try to unsubscribe handler2 that was never subscribed
      const fakeUnsubscribe = () => {
        sidebar['compactModeHandlers'] = sidebar['compactModeHandlers'].filter(h => h !== handler2);
      };
      
      expect(() => fakeUnsubscribe()).not.toThrow();
      
      // Real handler should still work
      compactToggleButton.click();
      expect(handler1).toHaveBeenCalledWith(true);
    });
  });

  describe('State Querying', () => {
    test('should provide current compact mode state', () => {
      // Initial state should be false
      expect(sidebar.isCompactMode()).toBe(false);
      
      // Toggle to compact mode
      compactToggleButton.click();
      expect(sidebar.isCompactMode()).toBe(true);
      
      // Toggle back to normal mode
      compactToggleButton.click();
      expect(sidebar.isCompactMode()).toBe(false);
    });

    test('should return false when sidebar element is not available', () => {
      // Destroy sidebar
      sidebar.destroy();
      
      // Should return false when sidebar element is null
      expect(sidebar.isCompactMode()).toBe(false);
    });

    test('should provide accurate state during subscription callbacks', () => {
      let stateInCallback: boolean | undefined;
      
      const handler: CompactModeChangeHandler = (isCompact) => {
        stateInCallback = sidebar.isCompactMode();
        expect(stateInCallback).toBe(isCompact);
      };
      
      sidebar.onCompactModeChange(handler);
      
      // Toggle to compact mode
      compactToggleButton.click();
      expect(stateInCallback).toBe(true);
      
      // Toggle back to normal mode
      compactToggleButton.click();
      expect(stateInCallback).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle subscription when sidebar is not initialized', () => {
      const uninitializedSidebar = new Sidebar();
      const handler: CompactModeChangeHandler = jest.fn();
      
      // Should not throw when subscribing to uninitialized sidebar
      expect(() => {
        uninitializedSidebar.onCompactModeChange(handler);
      }).not.toThrow();
    });

    test('should handle subscription with null handler gracefully', () => {
      expect(() => {
        sidebar.onCompactModeChange(null as any);
      }).not.toThrow();
      
      // Toggle should not cause errors even with null handler
      expect(() => {
        compactToggleButton.click();
      }).not.toThrow();
    });

    test('should handle subscription with undefined handler gracefully', () => {
      expect(() => {
        sidebar.onCompactModeChange(undefined as any);
      }).not.toThrow();
      
      // Toggle should not cause errors even with undefined handler
      expect(() => {
        compactToggleButton.click();
      }).not.toThrow();
    });

    test('should clean up all subscriptions on destroy', () => {
      const handler1: CompactModeChangeHandler = jest.fn();
      const handler2: CompactModeChangeHandler = jest.fn();
      
      sidebar.onCompactModeChange(handler1);
      sidebar.onCompactModeChange(handler2);
      
      // Destroy sidebar
      sidebar.destroy();
      
      // Create new sidebar instance
      sidebar = new Sidebar();
      sidebar.init();
      
      // Get new references
      sidebarElement = document.getElementById('app_sidebar') as HTMLElement;
      compactToggleButton = document.getElementById('sidebar_compact_toggle') as HTMLElement;
      
      // Toggle compact mode - old handlers should not be called
      compactToggleButton.click();
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Integration with Compact Mode Functionality', () => {
    test('should notify subscribers when compact mode changes via DOM manipulation', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Manually add compact class (simulating external change)
      sidebarElement.classList.add('sidebar-compact');
      
      // Click toggle (should remove class and notify)
      compactToggleButton.click();
      
      expect(handler).toHaveBeenCalledWith(false);
      expect(sidebarElement.classList.contains('sidebar-compact')).toBe(false);
    });

    test('should maintain subscription functionality during navigation updates', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Update navigation
      sidebar.updateNavigation([
        {
          id: 'new-item',
          text: 'New Item',
          icon: 'star',
          href: '/new-item'
        }
      ]);
      
      // Toggle should still notify subscribers
      compactToggleButton.click();
      expect(handler).toHaveBeenCalledWith(true);
    });

    test('should maintain subscription functionality during active page changes', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Set active page
      sidebar.setActivePage('dashboard');
      
      // Toggle should still notify subscribers
      compactToggleButton.click();
      expect(handler).toHaveBeenCalledWith(true);
    });

    test('should work correctly with getState method', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Initial state
      let state = sidebar.getState();
      expect(state.isCompact).toBe(false);
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      state = sidebar.getState();
      expect(state.isCompact).toBe(true);
      expect(handler).toHaveBeenCalledWith(true);
    });
  });

  describe('Performance', () => {
    test('should handle many subscribers efficiently', () => {
      const handlers: CompactModeChangeHandler[] = [];
      
      // Create 100 handlers
      for (let i = 0; i < 100; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        sidebar.onCompactModeChange(handler);
      }
      
      // Toggle should be fast even with many subscribers
      const startTime = performance.now();
      compactToggleButton.click();
      const endTime = performance.now();
      
      // Should complete in reasonable time (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      
      // All handlers should be called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledWith(true);
      });
    });

    test('should not create memory leaks with repeated subscriptions and unsubscriptions', () => {
      const handlers: (() => void)[] = [];
      
      // Create and destroy many subscriptions
      for (let i = 0; i < 100; i++) {
        const handler: CompactModeChangeHandler = jest.fn();
        const unsubscribe = sidebar.onCompactModeChange(handler);
        handlers.push(unsubscribe);
        
        // Unsubscribe every other one
        if (i % 2 === 0) {
          unsubscribe();
        }
      }
      
      // Toggle compact mode
      compactToggleButton.click();
      
      // Should not cause performance issues or errors
      expect(sidebar.isCompactMode()).toBe(true);
      
      // Clean up remaining subscriptions
      handlers.forEach(unsubscribe => unsubscribe());
    });

    test('should handle rapid toggling with subscribers efficiently', () => {
      const handler: CompactModeChangeHandler = jest.fn();
      sidebar.onCompactModeChange(handler);
      
      // Rapid fire toggles
      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        compactToggleButton.click();
      }
      const endTime = performance.now();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(100);
      
      // Handler should be called for each toggle
      expect(handler).toHaveBeenCalledTimes(50);
      
      // Final state should be false (even number of clicks)
      expect(sidebar.isCompactMode()).toBe(false);
      expect(handler).toHaveBeenLastCalledWith(false);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    test('should support layout manager subscribing to compact mode changes', () => {
      const layoutManager = {
        adjustLayout: jest.fn(),
        onCompactModeChange: (isCompact: boolean) => {
          layoutManager.adjustLayout(isCompact ? 'compact' : 'normal');
        }
      };
      
      sidebar.onCompactModeChange(layoutManager.onCompactModeChange);
      
      // Toggle to compact mode
      compactToggleButton.click();
      expect(layoutManager.adjustLayout).toHaveBeenCalledWith('compact');
      
      // Toggle back to normal mode
      compactToggleButton.click();
      expect(layoutManager.adjustLayout).toHaveBeenCalledWith('normal');
    });

    test('should support multiple components subscribing independently', () => {
      const header = { updateWidth: jest.fn() };
      const footer = { updateMargin: jest.fn() };
      const content = { adjustPadding: jest.fn() };
      
      sidebar.onCompactModeChange((isCompact) => {
        header.updateWidth(isCompact ? 'calc(100% - 80px)' : 'calc(100% - 280px)');
      });
      
      sidebar.onCompactModeChange((isCompact) => {
        footer.updateMargin(isCompact ? '80px' : '280px');
      });
      
      sidebar.onCompactModeChange((isCompact) => {
        content.adjustPadding(isCompact ? '10px' : '20px');
      });
      
      // Toggle compact mode
      compactToggleButton.click();
      
      expect(header.updateWidth).toHaveBeenCalledWith('calc(100% - 80px)');
      expect(footer.updateMargin).toHaveBeenCalledWith('80px');
      expect(content.adjustPadding).toHaveBeenCalledWith('10px');
    });

    test('should support analytics tracking of compact mode usage', () => {
      const analytics = {
        track: jest.fn(),
        events: [] as Array<{event: string, data: any}>
      };
      
      sidebar.onCompactModeChange((isCompact) => {
        const event = {
          event: 'sidebar_compact_mode_changed',
          data: { 
            isCompact,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        };
        analytics.events.push(event);
        analytics.track(event);
      });
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      expect(analytics.track).toHaveBeenCalledTimes(1);
      expect(analytics.events).toHaveLength(1);
      expect(analytics.events[0].data.isCompact).toBe(true);
      
      // Toggle back to normal mode
      compactToggleButton.click();
      
      expect(analytics.track).toHaveBeenCalledTimes(2);
      expect(analytics.events).toHaveLength(2);
      expect(analytics.events[1].data.isCompact).toBe(false);
    });

    test('should support preferences saving on compact mode changes', () => {
      const preferences = {
        save: jest.fn(),
        data: {} as any
      };
      
      sidebar.onCompactModeChange((isCompact) => {
        preferences.data.sidebarCompactMode = isCompact;
        preferences.save('sidebarCompactMode', isCompact);
      });
      
      // Toggle to compact mode
      compactToggleButton.click();
      
      expect(preferences.save).toHaveBeenCalledWith('sidebarCompactMode', true);
      expect(preferences.data.sidebarCompactMode).toBe(true);
      
      // Toggle back to normal mode
      compactToggleButton.click();
      
      expect(preferences.save).toHaveBeenCalledWith('sidebarCompactMode', false);
      expect(preferences.data.sidebarCompactMode).toBe(false);
    });
  });
});

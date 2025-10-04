/**
 * Integration Tests for ESC Key Conflict Resolution
 * 
 * Tests the specific scenario that motivated the chain system:
 * - Mobile sidebar and user menu both need ESC key
 * - Components should cooperate, not conflict
 * - Smart chain control based on component state
 */

import { 
  ChainHotkeyProvider, 
  ChainHotkeyHandler, 
  HotkeyExecutionContext,
  HotkeyChainAction 
} from '../../src/hotkeys/HotkeyChainSystem';
import { ChainHotkeyManagerImpl } from '../../src/hotkeys/ChainHotkeyManagerImpl';

/**
 * Mock Mobile Sidebar Provider - High priority, mobile-specific
 */
class MockMobileSidebarProvider implements ChainHotkeyProvider {
  private isMobile = false;
  private isMobileMenuVisible = false;
  public sidebarClosed = false;

  getHotkeyProviderId(): string { return 'MobileSidebar'; }
  getProviderPriority(): number { return 800; }
  getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }

  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    if (!this.isMobile || !this.isMobileMenuVisible) return null;
    
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('📱 Sidebar: ESC pressed - closing mobile menu');
        this.closeMobileMenu();
        ctx.preventDefault();
        
        // Smart chain control: let user menu also close if it's in the chain
        if (ctx.hasProvider('UserMenu')) {
          ctx.next(); // Cooperative behavior
        } else {
          ctx.break(); // We're the only one handling ESC
        }
      },
      description: 'Close mobile sidebar',
      priority: 800,
      enable: () => { /* implementation */ },
      disable: () => { /* implementation */ },
      isEnabled: () => this.isMobile && this.isMobileMenuVisible
    });
    
    return hotkeys;
  }

  // Test helper methods
  setMobile(isMobile: boolean): void {
    this.isMobile = isMobile;
  }

  setMobileMenuVisible(visible: boolean): void {
    this.isMobileMenuVisible = visible;
  }

  private closeMobileMenu(): void {
    this.isMobileMenuVisible = false;
    this.sidebarClosed = true;
  }

  // Check if sidebar was closed
  wasSidebarClosed(): boolean {
    return this.sidebarClosed;
  }

  reset(): void {
    this.sidebarClosed = false;
  }
}

/**
 * Mock User Menu Provider - Medium priority, global
 */
class MockUserMenuProvider implements ChainHotkeyProvider {
  private isUserMenuOpen = false;
  public userMenuClosed = false;

  getHotkeyProviderId(): string { return 'UserMenu'; }
  getProviderPriority(): number { return 600; }
  getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }

  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: this.isUserMenuOpen,
      handler: (ctx: HotkeyExecutionContext) => {
        if (!this.isUserMenuOpen) {
          ctx.next(); // Not our concern
          return;
        }
        
        console.log('👤 UserMenu: ESC pressed - closing user menu');
        this.closeUserMenu();
        
        // Smart decision: prevent default only if we're the last handler
        if (ctx.chainIndex === ctx.chainLength - 1) {
          ctx.preventDefault();
          ctx.break();
        } else {
          ctx.next(); // Let others handle too
        }
      },
      description: 'Close user menu',
      priority: 600,
      enable: () => { this.isUserMenuOpen = true; },
      disable: () => { this.isUserMenuOpen = false; },
      isEnabled: () => this.isUserMenuOpen
    });
    
    return hotkeys;
  }

  // Test helper methods
  setUserMenuOpen(open: boolean): void {
    this.isUserMenuOpen = open;
  }

  private closeUserMenu(): void {
    this.isUserMenuOpen = false;
    this.userMenuClosed = true;
  }

  wasUserMenuClosed(): boolean {
    return this.userMenuClosed;
  }

  reset(): void {
    this.userMenuClosed = false;
  }
}

/**
 * Mock Modal Dialog Provider - Highest priority, breaks chain when active
 */
class MockModalDialogProvider implements ChainHotkeyProvider {
  private isModalOpen = false;
  public modalClosed = false;

  getHotkeyProviderId(): string { return 'ModalDialog'; }
  getProviderPriority(): number { return 1000; }
  getDefaultChainBehavior(): HotkeyChainAction { return 'break'; }

  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    if (!this.isModalOpen) return null;
    
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        console.log('🚪 Modal: ESC pressed - closing modal (highest priority)');
        this.closeModal();
        ctx.preventDefault();
        ctx.break(); // Always break - modal has absolute priority
      },
      description: 'Close modal dialog',
      priority: 1000,
      enable: () => { /* implementation */ },
      disable: () => { /* implementation */ },
      isEnabled: () => this.isModalOpen
    });
    
    return hotkeys;
  }

  setModalOpen(open: boolean): void {
    this.isModalOpen = open;
  }

  private closeModal(): void {
    this.isModalOpen = false;
    this.modalClosed = true;
  }

  wasModalClosed(): boolean {
    return this.modalClosed;
  }

  reset(): void {
    this.modalClosed = false;
  }
}

describe('ESC Key Conflict Resolution', () => {
  let manager: ChainHotkeyManagerImpl;
  let mobileProvider: MockMobileSidebarProvider;
  let userMenuProvider: MockUserMenuProvider;
  let modalProvider: MockModalDialogProvider;

  beforeEach(() => {
    manager = new ChainHotkeyManagerImpl();
    mobileProvider = new MockMobileSidebarProvider();
    userMenuProvider = new MockUserMenuProvider();
    modalProvider = new MockModalDialogProvider();

    // Mock document
    (global as any).document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Register providers
    manager.registerProvider(mobileProvider);
    manager.registerProvider(userMenuProvider);
    manager.registerProvider(modalProvider);
  });

  afterEach(() => {
    manager.destroy();
  });

  const createEscEvent = (): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });
  };

  describe('Single Component Scenarios', () => {
    test('should close only mobile sidebar when only sidebar is open', async () => {
      // Setup: Only mobile sidebar is open
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(false);
      modalProvider.setModalOpen(false);

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(1);
      expect(result.finalAction).toBe('break'); // Should break since no user menu
      expect(mobileProvider.wasSidebarClosed()).toBe(true);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(false);
      expect(modalProvider.wasModalClosed()).toBe(false);
    });

    test('should close only user menu when only user menu is open', async () => {
      // Setup: Only user menu is open  
      mobileProvider.setMobile(false);
      mobileProvider.setMobileMenuVisible(false);
      userMenuProvider.setUserMenuOpen(true);
      modalProvider.setModalOpen(false);

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(1);
      expect(result.finalAction).toBe('break');
      expect(mobileProvider.wasSidebarClosed()).toBe(false);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(true);
      expect(modalProvider.wasModalClosed()).toBe(false);
    });

    test('should close only modal when only modal is open', async () => {
      // Setup: Only modal is open
      mobileProvider.setMobile(false);
      mobileProvider.setMobileMenuVisible(false);
      userMenuProvider.setUserMenuOpen(false);
      modalProvider.setModalOpen(true);

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(1);
      expect(result.finalAction).toBe('break');
      expect(mobileProvider.wasSidebarClosed()).toBe(false);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(false);
      expect(modalProvider.wasModalClosed()).toBe(true);
    });
  });

  describe('Multiple Component Scenarios - The Core Conflict Resolution', () => {
    test('should close both mobile sidebar AND user menu when both are open', async () => {
      // Setup: Both mobile sidebar and user menu are open
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(true);
      modalProvider.setModalOpen(false);

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      // Both should close - this is the key improvement!
      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(2); // Both handlers executed
      expect(result.finalAction).toBe('break');
      expect(mobileProvider.wasSidebarClosed()).toBe(true);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(true);
      expect(modalProvider.wasModalClosed()).toBe(false);
      
      console.log('🎉 SUCCESS: Both sidebar and user menu closed cooperatively!');
    });

    test('should close modal ONLY when modal + other components are open', async () => {
      // Setup: Modal + sidebar + user menu all open
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(true);
      modalProvider.setModalOpen(true); // Modal takes priority

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      // Only modal should close (highest priority breaks chain)
      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(1);
      expect(result.finalAction).toBe('break');
      expect(modalProvider.wasModalClosed()).toBe(true);
      expect(mobileProvider.wasSidebarClosed()).toBe(false); // Blocked by modal
      expect(userMenuProvider.wasUserMenuClosed()).toBe(false); // Blocked by modal
    });
  });

  describe('State-Based Behavior', () => {
    test('should not execute handlers when components are in wrong state', async () => {
      // Setup: Components exist but are not in active states
      mobileProvider.setMobile(false); // Not mobile, so no mobile sidebar ESC
      userMenuProvider.setUserMenuOpen(false); // User menu closed
      modalProvider.setModalOpen(false); // Modal closed

      const event = createEscEvent();
      const result = await manager.executeChain('Escape', event);

      expect(result.executed).toBe(false);
      expect(result.handlersExecuted).toBe(0);
      expect(mobileProvider.wasSidebarClosed()).toBe(false);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(false);
      expect(modalProvider.wasModalClosed()).toBe(false);
    });

    test('should handle dynamic state changes', async () => {
      // Setup: Start with both components active
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(true);
      mobileProvider.reset();
      userMenuProvider.reset();

      // First ESC - both should close
      const event1 = createEscEvent();
      const result1 = await manager.executeChain('Escape', event1);

      expect(result1.handlersExecuted).toBe(2);
      expect(mobileProvider.wasSidebarClosed()).toBe(true);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(true);

      // Reset state tracking
      mobileProvider.reset();
      userMenuProvider.reset();

      // Second ESC - nothing should happen (both already closed)
      const event2 = createEscEvent();
      const result2 = await manager.executeChain('Escape', event2);

      expect(result2.executed).toBe(false);
      expect(result2.handlersExecuted).toBe(0);
      expect(mobileProvider.wasSidebarClosed()).toBe(false);
      expect(userMenuProvider.wasUserMenuClosed()).toBe(false);
    });
  });

  describe('Chain Execution Order Verification', () => {
    // Setup providers for order verification
    let hotkeyManager: ChainHotkeyManager;

    beforeEach(() => {
      hotkeyManager = new ChainHotkeyManagerImpl();

      // Register in reverse priority order to ensure sort works
      hotkeyManager.registerProvider({
        getHotkeyProviderId: () => 'UserMenu',
        getProviderPriority: () => 600,
        getChainHotkeys: () => new Map([
          ['Escape', {
            key: 'Escape',
            providerId: 'UserMenu',
            enabled: true,
            handler: () => {},
            isEnabled: () => true
          }]
        ])
      });

      hotkeyManager.registerProvider({
        getHotkeyProviderId: () => 'MobileSidebar',
        getProviderPriority: () => 800,
        getChainHotkeys: () => new Map([
          ['Escape', {
            key: 'Escape',
            providerId: 'MobileSidebar',
            enabled: true,
            handler: () => {},
            isEnabled: () => true
          }]
        ])
      });
    });
    test('should execute handlers in correct priority order', async () => {
      // Get the chain debug info and verify initial order
      const initialDebugInfo = hotkeyManager.getChainDebugInfo('Escape');
      const initialOrder = initialDebugInfo.handlers.map(h => h.providerId);
      expect(initialOrder).toEqual(['MobileSidebar', 'UserMenu']);
      
      // Setup: Both components active
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(true);

      const event = createEscEvent();
      await hotkeyManager.executeChain('Escape', event);

      // Verify priority order maintained after chain execution
      const finalDebugInfo = hotkeyManager.getChainDebugInfo('Escape');
      const finalOrder = finalDebugInfo.handlers.map(h => h.providerId);
      expect(finalOrder).toEqual(['MobileSidebar', 'UserMenu']);
    });
  });

  describe('Debug Information', () => {
    test('should provide accurate debug information for ESC key chain', () => {
      // Setup: All components in active states
      mobileProvider.setMobile(true);
      mobileProvider.setMobileMenuVisible(true);
      userMenuProvider.setUserMenuOpen(true);
      modalProvider.setModalOpen(true);

      const debugInfo = manager.getChainDebugInfo('Escape');

      expect(debugInfo.providers).toEqual(['ModalDialog', 'MobileSidebar', 'UserMenu']);
      expect(debugInfo.totalHandlers).toBe(3);
      expect(debugInfo.handlers).toHaveLength(3);

      // Check priority ordering
      expect(debugInfo.handlers[0].providerId).toBe('ModalDialog');
      expect(debugInfo.handlers[0].priority).toBe(1000);
      expect(debugInfo.handlers[1].providerId).toBe('MobileSidebar');
      expect(debugInfo.handlers[1].priority).toBe(800);
      expect(debugInfo.handlers[2].providerId).toBe('UserMenu');
      expect(debugInfo.handlers[2].priority).toBe(600);

      // Check all are enabled
      expect(debugInfo.handlers.every(h => h.enabled)).toBe(true);
    });
  });

  describe('Performance and Error Resilience', () => {
    test('should handle errors in one handler without affecting others', async () => {
      // Define error-throwing provider
      const erroringProvider: ChainHotkeyProvider = {
        getHotkeyProviderId: () => 'MobileSidebar',
        getProviderPriority: () => 800,
        getDefaultChainBehavior: () => 'next',
        getChainHotkeys: () => new Map<string, ChainHotkeyHandler>([
          ['Escape', {
            key: 'Escape',
            providerId: 'MobileSidebar',
            enabled: true,
            description: 'Error test handler',
            isEnabled: () => true,
            handler: (ctx: HotkeyExecutionContext) => { throw new Error('Mobile sidebar error'); },
            priority: 800,
            enable: () => {},
            disable: () => {}
          }]
        ])
      };
      
      // Setup manager and register provider
      const testManager = new ChainHotkeyManagerImpl();
      testManager.registerProvider(erroringProvider);
      
      // Add another provider that should still work
      testManager.registerProvider({
        getHotkeyProviderId: () => 'UserMenu',
        getProviderPriority: () => 600,
        getDefaultChainBehavior: () => 'next',
        getChainHotkeys: () => new Map<string, ChainHotkeyHandler>([
          ['Escape', {
            key: 'Escape',
            providerId: 'UserMenu',
            enabled: true,
            handler: () => {},
            isEnabled: () => true
          }]
        ])
      });
      
      // Verify error is handled and chain continues
      const event = createEscEvent();
      const result = await testManager.executeChain('Escape', event);
      
      expect(result.executed).toBe(true);
      expect(result.handlersExecuted).toBe(2);
      
      // Cleanup
      testManager.destroy();
    });
  });
});

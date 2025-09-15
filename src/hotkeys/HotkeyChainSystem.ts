/**
 * Advanced Chain-Based Hotkey System
 * 
 * Features:
 * 1. Chain-based execution with ctx.next() / ctx.break() control
 * 2. Dynamic enable/disable per hotkey
 * 3. Provider-level default behavior (next or break)
 * 4. Priority-based provider ordering
 */

export type HotkeyChainAction = 'next' | 'break';

/**
 * Execution context passed to each hotkey handler in the chain
 */
export interface HotkeyExecutionContext {
  /** Original keyboard event */
  readonly event: KeyboardEvent;
  
  /** Hotkey that triggered this chain */
  readonly key: string;
  
  /** Current provider in the chain */
  readonly currentProvider: string;
  
  /** Index of current handler in chain */
  readonly chainIndex: number;
  
  /** Total handlers in chain */
  readonly chainLength: number;
  
  /** Continue to next handler in chain */
  next(): void;
  
  /** Break chain execution (stop processing) */
  break(): void;
  
  /** Prevent default browser behavior */
  preventDefault(): void;
  
  /** Stop event propagation */
  stopPropagation(): void;
  
  /** Check if a specific provider is in the chain */
  hasProvider(providerId: string): boolean;
  
  /** Get all provider IDs in the chain */
  getProviderChain(): string[];
}

/**
 * Enhanced hotkey handler with chain control and dynamic state
 */
export interface ChainHotkeyHandler {
  /** Hotkey string (e.g., 'Escape', 'Ctrl+s') */
  key: string;
  
  /** Handler function with execution context */
  handler: (ctx: HotkeyExecutionContext) => void;
  
  /** Handler description for debugging */
  description?: string;
  
  /** Component/provider identifier */
  providerId: string;
  
  /** Current enabled state */
  enabled: boolean;
  
  /** Dynamic enable/disable methods */
  enable(): void;
  disable(): void;
  
  /** Check if currently enabled */
  isEnabled(): boolean;
  
  /** Priority level (higher = earlier in chain) */
  priority?: number;
}

/**
 * Enhanced hotkey provider with chain control
 */
export interface ChainHotkeyProvider {
  /** Provider identifier */
  getHotkeyProviderId(): string;
  
  /** Get hotkeys with chain control */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null;
  
  /** Default behavior when this provider's handler completes */
  getDefaultChainBehavior(): HotkeyChainAction;
  
  /** Provider priority (higher = earlier in chain) */
  getProviderPriority(): number;
  
  /** Called when provider is added to chain */
  onChainRegistered?(): void;
  
  /** Called when provider is removed from chain */
  onChainUnregistered?(): void;
}

/**
 * Chain execution result
 */
export interface ChainExecutionResult {
  /** Whether any handlers were executed */
  executed: boolean;
  
  /** Number of handlers that ran */
  handlersExecuted: number;
  
  /** Total handlers in chain */
  totalHandlers: number;
  
  /** Final chain action */
  finalAction: HotkeyChainAction;
  
  /** Whether preventDefault was called */
  preventedDefault: boolean;
  
  /** Whether stopPropagation was called */
  stoppedPropagation: boolean;
  
  /** Execution details for debugging */
  executionLog: Array<{
    providerId: string;
    executed: boolean;
    action: HotkeyChainAction;
    error?: string;
  }>;
}

/**
 * Chain-based hotkey manager
 */
export interface ChainHotkeyManager {
  /** Register a provider in the chain */
  registerProvider(provider: ChainHotkeyProvider): () => void;
  
  /** Unregister a provider */
  unregisterProvider(providerId: string): void;
  
  /** Execute hotkey chain for a specific key */
  executeChain(key: string, event: KeyboardEvent): Promise<ChainExecutionResult>;
  
  /** Get all registered providers */
  getProviders(): ChainHotkeyProvider[];
  
  /** Get providers for a specific key */
  getProvidersForKey(key: string): ChainHotkeyProvider[];
  
  /** Enable/disable all hotkeys for a provider */
  setProviderEnabled(providerId: string, enabled: boolean): void;
  
  /** Get chain execution debug info */
  getChainDebugInfo(key: string): {
    providers: string[];
    handlers: Array<{
      providerId: string;
      key: string;
      enabled: boolean;
      priority: number;
      description?: string;
    }>;
    totalHandlers: number;
  };
  
  /** Cleanup and destroy the manager */
  destroy(): void;
}

/**
 * Example usage scenarios for the new system
 */
export namespace HotkeyChainExamples {
  
  /**
   * Modal Dialog Provider (Highest Priority)
   * Always breaks chain when active
   */
  export class ModalDialogProvider implements ChainHotkeyProvider {
    private isModalOpen = false;
    
    getHotkeyProviderId(): string { return 'ModalDialog'; }
    getProviderPriority(): number { return 1000; } // Highest
    getDefaultChainBehavior(): HotkeyChainAction { return 'break'; } // Always break
    
    getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
      if (!this.isModalOpen) return null; // No hotkeys when modal closed
      
      const hotkeys = new Map<string, ChainHotkeyHandler>();
      
      hotkeys.set('Escape', {
        key: 'Escape',
        providerId: this.getHotkeyProviderId(),
        enabled: true,
        handler: (ctx: HotkeyExecutionContext) => {
          console.log('🚪 Modal: ESC pressed - closing modal');
          this.closeModal();
          ctx.preventDefault();
          ctx.break(); // Stop chain - modal has priority
        },
        description: 'Close modal dialog',
        priority: 1000,
        enable: () => { /* implementation */ },
        disable: () => { /* implementation */ },
        isEnabled: () => this.isModalOpen
      });
      
      return hotkeys;
    }
    
    private closeModal() {
      this.isModalOpen = false;
      // Close modal logic
    }
  }
  
  /**
   * Mobile Sidebar Provider (High Priority, Mobile Only)
   * Breaks chain only when mobile menu is visible
   */
  export class MobileSidebarProvider implements ChainHotkeyProvider {
    private isMobile = false;
    private isMobileMenuVisible = false;
    
    getHotkeyProviderId(): string { return 'MobileSidebar'; }
    getProviderPriority(): number { return 800; } 
    getDefaultChainBehavior(): HotkeyChainAction { return 'next'; } // Allow others unless we handle
    
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
          
          // Conditional chain control
          if (ctx.hasProvider('UserMenu')) {
            ctx.next(); // Let user menu also close if open
          } else {
            ctx.break(); // We handled it, no need for others
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
    
    private closeMobileMenu() {
      this.isMobileMenuVisible = false;
      // Close mobile menu logic
    }
  }
  
  /**
   * User Menu Provider (Medium Priority)
   * Always continues chain unless it's the only one
   */
  export class UserMenuProvider implements ChainHotkeyProvider {
    private isUserMenuOpen = false;
    
    getHotkeyProviderId(): string { return 'UserMenu'; }
    getProviderPriority(): number { return 600; }
    getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }
    
    getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
      const hotkeys = new Map<string, ChainHotkeyHandler>();
      
      hotkeys.set('Escape', {
        key: 'Escape',
        providerId: this.getHotkeyProviderId(),
        enabled: this.isUserMenuOpen, // Only enabled when menu is open
        handler: (ctx: HotkeyExecutionContext) => {
          if (!this.isUserMenuOpen) {
            ctx.next(); // Not our concern, continue chain
            return;
          }
          
          console.log('👤 UserMenu: ESC pressed - closing user menu');
          this.closeUserMenu();
          
          // Smart chain decision
          if (ctx.chainIndex === ctx.chainLength - 1) {
            // We're the last handler, prevent default
            ctx.preventDefault();
            ctx.break();
          } else {
            // Others might need ESC too, let them decide
            ctx.next();
          }
        },
        description: 'Close user menu',
        priority: 600,
        enable: () => { this.setEscEnabled(true); },
        disable: () => { this.setEscEnabled(false); },
        isEnabled: () => this.isUserMenuOpen
      });
      
      return hotkeys;
    }
    
    private closeUserMenu() {
      this.isUserMenuOpen = false;
      // Close user menu logic
    }
    
    private setEscEnabled(enabled: boolean) {
      // Dynamic enable/disable logic
    }
  }
  
  /**
   * Page Provider (Lowest Priority)
   * Default fallback behavior
   */
  export class PageProvider implements ChainHotkeyProvider {
    getHotkeyProviderId(): string { return 'CurrentPage'; }
    getProviderPriority(): number { return 100; } // Lowest
    getDefaultChainBehavior(): HotkeyChainAction { return 'break'; } // End of chain
    
    getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
      const hotkeys = new Map<string, ChainHotkeyHandler>();
      
      hotkeys.set('Escape', {
        key: 'Escape',
        providerId: this.getHotkeyProviderId(),
        enabled: true,
        handler: (ctx: HotkeyExecutionContext) => {
          console.log('📄 Page: ESC pressed - page-specific handling');
          // Page-specific ESC behavior
          ctx.break(); // End of chain
        },
        description: 'Page-specific ESC handling',
        priority: 100,
        enable: () => { /* implementation */ },
        disable: () => { /* implementation */ },
        isEnabled: () => true
      });
      
      return hotkeys;
    }
  }
}

/**
 * Usage example:
 * 
 * ```typescript
 * const chainManager = new ChainHotkeyManagerImpl();
 * 
 * // Register providers in any order - priority determines execution order
 * chainManager.registerProvider(new UserMenuProvider());
 * chainManager.registerProvider(new ModalDialogProvider());
 * chainManager.registerProvider(new MobileSidebarProvider());
 * chainManager.registerProvider(new PageProvider());
 * 
 * // ESC key execution order:
 * // 1. ModalDialog (priority 1000) - breaks if modal open
 * // 2. MobileSidebar (priority 800) - breaks/continues conditionally
 * // 3. UserMenu (priority 600) - usually continues
 * // 4. PageProvider (priority 100) - always breaks (end of chain)
 * ```
 */

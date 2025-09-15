/**
 * Chain-Based Hotkey Manager Implementation
 * 
 * Concrete implementation of the chain-based hotkey system with:
 * - Priority-based provider ordering 
 * - Chain execution with ctx.next() / ctx.break()
 * - Dynamic enable/disable support
 * - Comprehensive logging and debugging
 */

import { 
  ChainHotkeyManager, 
  ChainHotkeyProvider, 
  ChainExecutionResult,
  HotkeyExecutionContext,
  HotkeyChainAction,
  ChainHotkeyHandler
} from './HotkeyChainSystem';

/**
 * Execution context implementation
 */
class HotkeyExecutionContextImpl implements HotkeyExecutionContext {
  private _action: HotkeyChainAction = 'next';
  private _prevented = false;
  private _stopped = false;
  private _providerChain: string[];

  constructor(
    public readonly event: KeyboardEvent,
    public readonly key: string,
    public readonly currentProvider: string,
    public readonly chainIndex: number,
    public readonly chainLength: number,
    providerChain: string[]
  ) {
    this._providerChain = [...providerChain];
  }

  next(): void {
    this._action = 'next';
  }

  break(): void {
    this._action = 'break';
  }

  preventDefault(): void {
    if (!this._prevented) {
      this.event.preventDefault();
      this._prevented = true;
    }
  }

  stopPropagation(): void {
    if (!this._stopped) {
      this.event.stopPropagation();
      this._stopped = true;
    }
  }

  hasProvider(providerId: string): boolean {
    return this._providerChain.includes(providerId);
  }

  getProviderChain(): string[] {
    return [...this._providerChain];
  }

  // Internal method to get current action
  getCurrentAction(): HotkeyChainAction {
    return this._action;
  }

  // Internal method to check if prevented
  isDefaultPrevented(): boolean {
    return this._prevented;
  }

  // Internal method to check if stopped
  isPropagationStopped(): boolean {
    return this._stopped;
  }
}

/**
 * Chain-based hotkey manager implementation
 */
export class ChainHotkeyManagerImpl implements ChainHotkeyManager {
  private providers = new Map<string, ChainHotkeyProvider>();
  private globalKeydownListener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.setupGlobalKeydownListener();
  }

  /**
   * Setup global keydown listener
   */
  private setupGlobalKeydownListener(): void {
    this.globalKeydownListener = (event: KeyboardEvent) => {
      const key = this.normalizeKey(event);
      this.executeChain(key, event).catch(error => {
        console.error('ChainHotkeyManager - Error in chain execution:', error);
      });
    };

    document.addEventListener('keydown', this.globalKeydownListener);
    console.log('ChainHotkeyManager - Global keydown listener initialized');
  }

  /**
   * Normalize keyboard event to consistent string
   */
  private normalizeKey(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.metaKey) modifiers.push('Meta');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    
    return modifiers.length > 0 ? `${modifiers.join('+')}+${event.key}` : event.key;
  }

  /**
   * Register a provider in the chain
   */
  registerProvider(provider: ChainHotkeyProvider): () => void {
    const providerId = provider.getHotkeyProviderId();
    
    if (this.providers.has(providerId)) {
      console.warn(`ChainHotkeyManager - Provider '${providerId}' already registered, replacing`);
    }
    
    this.providers.set(providerId, provider);
    provider.onChainRegistered?.();
    
    console.log(`ChainHotkeyManager - Registered provider '${providerId}' with priority ${provider.getProviderPriority()}`);
    
    // Return unregister function
    return () => {
      this.unregisterProvider(providerId);
    };
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.onChainUnregistered?.();
      this.providers.delete(providerId);
      console.log(`ChainHotkeyManager - Unregistered provider '${providerId}'`);
    }
  }

  /**
   * Execute hotkey chain for a specific key
   */
  async executeChain(key: string, event: KeyboardEvent): Promise<ChainExecutionResult> {
    const result: ChainExecutionResult = {
      executed: false,
      handlersExecuted: 0,
      totalHandlers: 0,
      finalAction: 'next',
      preventedDefault: false,
      stoppedPropagation: false,
      executionLog: []
    };

    // Get all providers that have handlers for this key
    const providersWithHandlers = this.getProvidersForKey(key);
    if (providersWithHandlers.length === 0) {
      return result;
    }

    // Sort by priority (highest first)
    providersWithHandlers.sort((a, b) => b.getProviderPriority() - a.getProviderPriority());
    
    // Get all enabled handlers
    const enabledHandlers: Array<{
      provider: ChainHotkeyProvider;
      handler: ChainHotkeyHandler;
    }> = [];

    for (const provider of providersWithHandlers) {
      const hotkeys = provider.getChainHotkeys();
      const handler = hotkeys?.get(key);
      if (handler && handler.isEnabled()) {
        enabledHandlers.push({ provider, handler });
      }
    }

    result.totalHandlers = enabledHandlers.length;
    if (enabledHandlers.length === 0) {
      return result;
    }

    // Build provider chain for context
    const providerChain = enabledHandlers.map(h => h.provider.getHotkeyProviderId());

    console.log(`🔗 ChainHotkeyManager - Executing chain for '${key}' with ${enabledHandlers.length} handlers:`, 
                providerChain);

    // Execute chain
    for (let i = 0; i < enabledHandlers.length; i++) {
      const { provider, handler } = enabledHandlers[i];
      const providerId = provider.getHotkeyProviderId();

      // Create execution context
      const context = new HotkeyExecutionContextImpl(
        event,
        key,
        providerId,
        i,
        enabledHandlers.length,
        providerChain
      );

      const logEntry = {
        providerId,
        executed: false,
        action: 'next' as HotkeyChainAction,
        error: undefined as string | undefined
      };

      try {
        console.log(`  🔗 ${i + 1}/${enabledHandlers.length}: Executing ${providerId}`);
        
        // Execute handler
        handler.handler(context);
        
        logEntry.executed = true;
        logEntry.action = context.getCurrentAction();
        result.handlersExecuted++;

        console.log(`    ✅ ${providerId}: ${logEntry.action} (prevented: ${context.isDefaultPrevented()})`);

        // Update result state
        if (context.isDefaultPrevented()) {
          result.preventedDefault = true;
        }
        if (context.isPropagationStopped()) {
          result.stoppedPropagation = true;
        }

        // Check if chain should break
        if (context.getCurrentAction() === 'break') {
          result.finalAction = 'break';
          result.executionLog.push(logEntry);
          console.log(`  🛑 Chain broken by ${providerId}`);
          break;
        }

        result.finalAction = 'next';
        
      } catch (error) {
        logEntry.error = error instanceof Error ? error.message : String(error);
        console.error(`    ❌ ${providerId}: Error -`, error);
      }

      result.executionLog.push(logEntry);
    }

    result.executed = result.handlersExecuted > 0;
    
    console.log(`🏁 ChainHotkeyManager - Chain execution complete:`, {
      key,
      executed: result.executed,
      handlersExecuted: result.handlersExecuted,
      totalHandlers: result.totalHandlers,
      finalAction: result.finalAction
    });

    return result;
  }

  /**
   * Get all registered providers
   */
  getProviders(): ChainHotkeyProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers for a specific key
   */
  getProvidersForKey(key: string): ChainHotkeyProvider[] {
    const providers: ChainHotkeyProvider[] = [];
    
    for (const provider of this.providers.values()) {
      const hotkeys = provider.getChainHotkeys();
      if (hotkeys?.has(key)) {
        providers.push(provider);
      }
    }
    
    return providers;
  }

  /**
   * Enable/disable all hotkeys for a provider
   */
  setProviderEnabled(providerId: string, enabled: boolean): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      console.warn(`ChainHotkeyManager - Provider '${providerId}' not found`);
      return;
    }

    const hotkeys = provider.getChainHotkeys();
    if (hotkeys) {
      for (const handler of hotkeys.values()) {
        if (enabled) {
          handler.enable();
        } else {
          handler.disable();
        }
      }
      console.log(`ChainHotkeyManager - Provider '${providerId}' ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get chain execution debug info
   */
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
  } {
    const providersWithHandlers = this.getProvidersForKey(key);
    providersWithHandlers.sort((a, b) => b.getProviderPriority() - a.getProviderPriority());

    const handlers: Array<{
      providerId: string;
      key: string;
      enabled: boolean;
      priority: number;
      description?: string;
    }> = [];

    for (const provider of providersWithHandlers) {
      const hotkeys = provider.getChainHotkeys();
      const handler = hotkeys?.get(key);
      if (handler) {
        handlers.push({
          providerId: provider.getHotkeyProviderId(),
          key,
          enabled: handler.isEnabled(),
          priority: provider.getProviderPriority(),
          description: handler.description
        });
      }
    }

    return {
      providers: providersWithHandlers.map(p => p.getHotkeyProviderId()),
      handlers,
      totalHandlers: handlers.length
    };
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    if (this.globalKeydownListener) {
      document.removeEventListener('keydown', this.globalKeydownListener);
      this.globalKeydownListener = null;
    }

    // Notify all providers
    for (const provider of this.providers.values()) {
      provider.onChainUnregistered?.();
    }

    this.providers.clear();
    console.log('ChainHotkeyManager - Destroyed');
  }
}

/**
 * Usage example and migration guide
 */
export namespace ChainHotkeyMigration {
  /**
   * How to migrate from old hotkey system to chain system
   */
  export const migrationGuide = `
    // OLD SYSTEM (problematic)
    layoutContext.registerHotkey({
      key: "Escape",
      handler: () => { closeMenu(); return false; },
      component: "MyComponent"
    });

    // NEW SYSTEM (chain-based)
    class MyComponentProvider implements ChainHotkeyProvider {
      getHotkeyProviderId(): string { return 'MyComponent'; }
      getProviderPriority(): number { return 500; }
      getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }
      
      getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
        const hotkeys = new Map();
        
        hotkeys.set('Escape', {
          key: 'Escape',
          providerId: 'MyComponent',
          enabled: this.isMenuOpen,
          handler: (ctx: HotkeyExecutionContext) => {
            if (this.isMenuOpen) {
              closeMenu();
              ctx.preventDefault();
              
              // Smart chain control
              if (ctx.hasProvider('Modal')) {
                ctx.next(); // Let modal also handle if needed
              } else {
                ctx.break(); // We're done
              }
            } else {
              ctx.next(); // Not our concern
            }
          },
          enable: () => this.isMenuOpen = true,
          disable: () => this.isMenuOpen = false,
          isEnabled: () => this.isMenuOpen
        });
        
        return hotkeys;
      }
    }
  `;
}
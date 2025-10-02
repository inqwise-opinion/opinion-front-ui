/**
 * Legacy Hotkey Adapter - Backward Compatibility Bridge
 * 
 * Converts old HotkeyHandler registrations to work with the new chain-based system.
 * Maintains full compatibility while providing a migration path to the new system.
 */

import {
  ChainHotkeyProvider,
  ChainHotkeyHandler,
  HotkeyChainAction,
  HotkeyExecutionContext,
} from './HotkeyChainSystem';

/**
 * Legacy HotkeyHandler interface for backward compatibility
 */
export interface HotkeyHandler {
  key: string;
  handler: (event: KeyboardEvent) => boolean | void;
  description?: string;
  context?: 'global' | 'local';
  component?: string;
}

/**
 * Legacy hotkey wrapper that implements the new chain interface
 */
class LegacyHotkeyWrapper implements ChainHotkeyHandler {
  private _enabled = true;
  
  constructor(private legacyHandler: HotkeyHandler) {}

  get key(): string {
    return this.legacyHandler.key;
  }

  get providerId(): string {
    return this.legacyHandler.component || 'LegacyProvider';
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get description(): string | undefined {
    return this.legacyHandler.description;
  }

  get priority(): number | undefined {
    // Legacy handlers get medium priority
    return 500;
  }

  handler = (ctx: HotkeyExecutionContext): void => {
    try {
      const result = this.legacyHandler.handler(ctx.event);
      
      if (result === false) {
        // Legacy convention: return false = prevent default and stop
        ctx.preventDefault();
        ctx.break();
      } else {
        // Legacy convention: return void/true = continue normally
        ctx.next();
      }
    } catch (error) {
      console.error(`LegacyHotkeyAdapter - Error in legacy handler for ${this.key}:`, error);
      ctx.next(); // Continue chain on error
    }
  };

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  isEnabled(): boolean {
    return this._enabled;
  }
}

/**
 * Adapter provider that wraps legacy hotkey handlers
 */
export class LegacyHotkeyProvider implements ChainHotkeyProvider {
  private hotkeys = new Map<string, ChainHotkeyHandler>();
  private componentId: string;

  constructor(componentId = 'LegacyProvider') {
    this.componentId = componentId;
  }

  getHotkeyProviderId(): string {
    return this.componentId;
  }

  getProviderPriority(): number {
    // Legacy providers get medium priority by default
    return 500;
  }

  getDefaultChainBehavior(): HotkeyChainAction {
    // Legacy system was more conservative - continue to next handler
    return 'next';
  }

  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    return this.hotkeys.size > 0 ? this.hotkeys : null;
  }

  /**
   * Register a legacy hotkey handler
   */
  registerLegacyHotkey(legacyHandler: HotkeyHandler): () => void {
    const wrapper = new LegacyHotkeyWrapper(legacyHandler);
    this.hotkeys.set(legacyHandler.key, wrapper);
    
    console.log(`LegacyHotkeyProvider - Registered legacy hotkey: ${legacyHandler.key} for ${legacyHandler.component || 'unknown'}`);
    
    // Return unregister function
    return () => {
      this.unregisterLegacyHotkey(legacyHandler.key, legacyHandler.component);
    };
  }

  /**
   * Unregister legacy hotkey handler
   */
  unregisterLegacyHotkey(key: string, component?: string): void {
    const handler = this.hotkeys.get(key);
    if (handler && (!component || handler.providerId === component)) {
      this.hotkeys.delete(key);
      console.log(`LegacyHotkeyProvider - Unregistered legacy hotkey: ${key} for ${component || 'unknown'}`);
    }
  }

  /**
   * Unregister all legacy hotkeys for a component
   */
  unregisterAllLegacyHotkeys(component?: string): void {
    if (!component) {
      this.hotkeys.clear();
      console.log('LegacyHotkeyProvider - Cleared all legacy hotkeys');
      return;
    }

    const keysToRemove: string[] = [];
    for (const [key, handler] of this.hotkeys) {
      if (handler.providerId === component) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.hotkeys.delete(key));
    console.log(`LegacyHotkeyProvider - Unregistered ${keysToRemove.length} legacy hotkeys for component: ${component}`);
  }

  /**
   * Get all registered legacy hotkeys (for debugging)
   */
  getRegisteredLegacyHotkeys(): HotkeyHandler[] {
    const legacyHandlers: HotkeyHandler[] = [];
    
    for (const [key, wrapper] of this.hotkeys) {
      // Reconstruct legacy handler structure for compatibility
      legacyHandlers.push({
        key,
        handler: (event: KeyboardEvent) => {
          // This is a simplified handler for inspection purposes only
          console.log(`Legacy handler simulation for ${key}`);
        },
        description: wrapper.description,
        context: 'global', // Legacy system didn't have context distinction
        component: wrapper.providerId,
      });
    }
    
    return legacyHandlers;
  }

  onChainRegistered?(): void {
    console.log(`LegacyHotkeyProvider - Chain registered for ${this.componentId}`);
  }

  onChainUnregistered?(): void {
    console.log(`LegacyHotkeyProvider - Chain unregistered for ${this.componentId}`);
  }
}

/**
 * Adapter manager that provides backward compatibility
 */
export class LegacyHotkeyAdapter {
  private providers = new Map<string, LegacyHotkeyProvider>();
  private defaultProvider: LegacyHotkeyProvider;

  constructor() {
    this.defaultProvider = new LegacyHotkeyProvider('DefaultLegacyProvider');
  }

  /**
   * Register a legacy hotkey (backward compatibility method)
   */
  registerHotkey(hotkey: HotkeyHandler): () => void {
    const componentId = hotkey.component || 'DefaultLegacyProvider';
    let provider = this.providers.get(componentId);
    
    if (!provider) {
      provider = new LegacyHotkeyProvider(componentId);
      this.providers.set(componentId, provider);
    }
    
    return provider.registerLegacyHotkey(hotkey);
  }

  /**
   * Unregister legacy hotkey
   */
  unregisterHotkey(key: string, component?: string): void {
    if (component) {
      const provider = this.providers.get(component);
      provider?.unregisterLegacyHotkey(key, component);
    } else {
      // Remove from all providers
      for (const provider of this.providers.values()) {
        provider.unregisterLegacyHotkey(key);
      }
      this.defaultProvider.unregisterLegacyHotkey(key);
    }
  }

  /**
   * Unregister all hotkeys for a component
   */
  unregisterAllHotkeys(component?: string): void {
    if (component) {
      const provider = this.providers.get(component);
      if (provider) {
        provider.unregisterAllLegacyHotkeys(component);
        this.providers.delete(component);
      }
    } else {
      // Clear all
      this.providers.clear();
      this.defaultProvider.unregisterAllLegacyHotkeys();
    }
  }

  /**
   * Get all registered legacy hotkeys
   */
  getRegisteredHotkeys(): HotkeyHandler[] {
    const allHotkeys: HotkeyHandler[] = [];
    
    for (const provider of this.providers.values()) {
      allHotkeys.push(...provider.getRegisteredLegacyHotkeys());
    }
    
    allHotkeys.push(...this.defaultProvider.getRegisteredLegacyHotkeys());
    
    return allHotkeys;
  }

  /**
   * Get all legacy providers for registration with chain manager
   */
  getAllProviders(): ChainHotkeyProvider[] {
    const providers: ChainHotkeyProvider[] = [];
    
    // Add all component-specific providers
    for (const provider of this.providers.values()) {
      if (provider.getChainHotkeys()) {
        providers.push(provider);
      }
    }
    
    // Add default provider if it has hotkeys
    if (this.defaultProvider.getChainHotkeys()) {
      providers.push(this.defaultProvider);
    }
    
    return providers;
  }

  /**
   * Cleanup all legacy providers
   */
  destroy(): void {
    this.providers.clear();
    this.defaultProvider.unregisterAllLegacyHotkeys();
    console.log('LegacyHotkeyAdapter - Destroyed');
  }
}
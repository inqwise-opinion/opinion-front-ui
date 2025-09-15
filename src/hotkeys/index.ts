/**
 * Chain-Based Hotkey System
 * 
 * A sophisticated hotkey management system that replaces the problematic
 * "last registered wins" approach with cooperative chain execution.
 * 
 * Key Features:
 * - Chain-based execution with ctx.next() / ctx.break() control
 * - Dynamic enable/disable per hotkey
 * - Priority-based provider ordering
 * - Comprehensive error handling
 * - Smart component cooperation (solves ESC key conflicts!)
 * 
 * @example
 * ```typescript
 * import { ChainHotkeyManagerImpl, ChainHotkeyProvider } from '@/hotkeys';
 * 
 * // Create manager
 * const chainManager = new ChainHotkeyManagerImpl();
 * 
 * // Create provider
 * class MyComponentProvider implements ChainHotkeyProvider {
 *   getHotkeyProviderId(): string { return 'MyComponent'; }
 *   getProviderPriority(): number { return 600; }
 *   getDefaultChainBehavior(): HotkeyChainAction { return 'next'; }
 *   
 *   getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
 *     const hotkeys = new Map();
 *     hotkeys.set('Escape', {
 *       key: 'Escape',
 *       providerId: 'MyComponent',
 *       enabled: true,
 *       handler: (ctx) => {
 *         this.closeComponent();
 *         if (ctx.hasProvider('ImportantComponent')) {
 *           ctx.next(); // Let others also handle
 *         } else {
 *           ctx.preventDefault();
 *           ctx.break(); // End chain
 *         }
 *       },
 *       enable: () => this.enabled = true,
 *       disable: () => this.enabled = false,
 *       isEnabled: () => this.enabled
 *     });
 *     return hotkeys;
 *   }
 * }
 * 
 * // Register provider
 * chainManager.registerProvider(new MyComponentProvider());
 * ```
 */

// Core interfaces and types
export type {
  HotkeyChainAction,
  HotkeyExecutionContext,
  ChainHotkeyHandler,
  ChainHotkeyProvider,
  ChainExecutionResult,
  ChainHotkeyManager
} from './HotkeyChainSystem';

// Main implementation
export { ChainHotkeyManagerImpl } from './ChainHotkeyManagerImpl';

// Example providers (for reference and testing)
export { HotkeyChainExamples } from './HotkeyChainSystem';

// Re-export for convenience
export * from './HotkeyChainSystem';
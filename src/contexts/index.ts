/**
 * Layout Context Module - Main Entry Point
 * Provides clean interface-based access to layout management
 */

import LayoutContextImpl from './LayoutContextImpl.js';
import type { 
  LayoutContext,
  LayoutContextFactory,
  SidebarDimensions,
  SidebarState,
  LayoutState,
  LayoutEventType,
  ResponsiveModeType,
  LayoutModeType,
  ResponsiveMode,
  LayoutMode,
  LayoutEvent,
  LayoutEventListener
} from './LayoutContext.js';

/**
 * Factory class for creating/getting LayoutContext instances
 */
export class LayoutContextFactory implements LayoutContextFactory {
  /**
   * Get the singleton LayoutContext instance
   * @returns LayoutContext interface instance
   */
  public static getInstance(): LayoutContext {
    return LayoutContextImpl.getInstance();
  }
}

/**
 * Convenience function for getting LayoutContext instance
 * @returns LayoutContext interface instance
 */
export function getLayoutContext(): LayoutContext {
  return LayoutContextImpl.getInstance();
}

// Re-export all types for consumers
export type {
  LayoutContext,
  SidebarDimensions,
  SidebarState,
  LayoutState,
  LayoutEventType,
  ResponsiveModeType,
  LayoutModeType,
  ResponsiveMode,
  LayoutMode,
  LayoutEvent,
  LayoutEventListener
};

// Default export is the factory function
export default getLayoutContext;

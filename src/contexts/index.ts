/**
 * Layout Context Module - Main Entry Point
 * Provides clean interface-based access to layout management
 */

import LayoutContextImpl from "./LayoutContextImpl";
import type {
  LayoutContext,
  LayoutEventType,
  LayoutModeType,
  LayoutMode,
  LayoutEvent,
  LayoutEventListener,
  LayoutViewPort,
} from "./LayoutContext";

// Re-export all types for consumers
export type {
  LayoutContext,
  LayoutEventType,
  LayoutModeType,
  LayoutMode,
  LayoutEvent,
  LayoutEventListener,
  LayoutViewPort,
};

// Re-export the implementation class
export { LayoutContextImpl };

// Singleton instance for global access
let layoutContextInstance: LayoutContextImpl | null = null;

/**
 * Get the global layout context instance
 * Creates a singleton instance if it doesn't exist
 */
export function getLayoutContext(): LayoutContextImpl {
  if (!layoutContextInstance) {
    layoutContextInstance = new LayoutContextImpl();
  }
  return layoutContextInstance;
}

// Default export is the implementation class
export default LayoutContextImpl;

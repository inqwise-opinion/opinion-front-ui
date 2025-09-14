/**
 * MainContent Interface
 * Defines the contract for main content components
 */

import { ComponentReference, ComponentReferenceConfig } from './ComponentReference';
import type { LayoutContext } from '../contexts/LayoutContext';

export interface MainContentConfig {
  className?: string;
  id?: string;
  role?: string;
  ariaLabel?: string;
}

/**
 * Interface for MainContent components
 */
export interface MainContent {
  /**
   * Initialize the main content component
   */
  init(): Promise<void>;

  /**
   * Set content in the main area
   */
  setContent(content: string | HTMLElement): void;

  /**
   * Clear all content from main area
   */
  clearContent(): void;

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void;

  /**
   * Set error state
   */
  setError(error: string | null): void;

  /**
   * Show/hide main content
   */
  show(): void;
  hide(): void;

  /**
   * Check if main content is initialized
   */
  isReady(): boolean;

  /**
   * Get the main content element
   */
  getElement(): HTMLElement | null;

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void;
}

/**
 * MainContent reference utilities
 */
export class MainContentRef {
  static readonly COMPONENT_ID = 'MainContent' as const;
  
  /**
   * Get a ComponentReference for safely accessing registered MainContent
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ComponentReference
   * @returns ComponentReference<MainContent> for lazy resolution
   * 
   * @example
   * ```typescript
   * const mainContentRef = MainContentRef.getRegisteredReference(layoutContext);
   * const mainContent = await mainContentRef.get(); // Returns MainContent | null
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ComponentReferenceConfig
  ): ComponentReference<MainContent> {
    return new ComponentReference<MainContent>(
      context,
      MainContentRef.COMPONENT_ID,
      () => context.getMainContent(),
      config
    );
  }
}

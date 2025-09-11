/**
 * MainContent Interface
 * Defines the contract for main content components
 */

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

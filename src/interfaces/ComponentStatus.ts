/**
 * Component Status Interface
 * Defines the structure for component technical status information
 * Used by DebugPage to display detailed component diagnostics
 */

export interface ComponentStatus {
  /**
   * Component identification
   */
  componentType: string;
  id: string; // Component ID
  
  /**
   * Initialization status
   */
  initialized: boolean;
  initTime?: number | null; // Timestamp when init completed
  uptime?: number; // Time since initialization in milliseconds
  
  /**
   * DOM integration - flexible structure
   */
  domElement?: {
    tagName?: string;
    id?: string;
    className?: string;
    childCount?: number;
    hasContent?: boolean;
    isVisible?: boolean;
    ariaLabel?: string;
    role?: string;
    dimensions?: {
      width: number;
      height: number;
      offsetTop: number;
      offsetLeft: number;
    };
  };
  
  /**
   * Event system integration - flexible structure
   */
  eventListeners?: Record<string, unknown>;
  
  /**
   * Configuration and state
   */
  configuration?: Record<string, unknown>;
  currentState?: Record<string, unknown>;
  
  /**
   * Performance metrics - flexible structure
   */
  performance?: Record<string, unknown>;
  
  /**
   * Issues - can be array or object
   */
  issues?: string[] | {
    errors: string[];
    warnings: string[];
  };
  
  /**
   * Additional component-specific data
   */
  customData?: Record<string, unknown>;
}

/**
 * Interface that components can implement to provide status information
 */
export interface ComponentWithStatus {
  /**
   * Get current technical status of the component
   */
  getStatus(): ComponentStatus;
}
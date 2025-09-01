/**
 * Layout Context Implementation - Manages sidebar dimensions and layout coordination
 * Provides a centralized event system for layout components
 */

import type { Dimensions, Sidebar } from '../components/Sidebar.js';
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

export class LayoutContextImpl implements LayoutContext {
  private static instance: LayoutContextImpl | null = null;
  private listeners: Map<LayoutEventType, Set<LayoutEventListener>> = new Map();
  private state: LayoutState;
  private responsiveMode: ResponsiveMode;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: number | null = null;
  private sidebarInstance: Sidebar | null = null;

  private constructor() {
    this.state = this.getInitialState();
    this.responsiveMode = this.getInitialResponsiveMode();
    this.setupViewportObserver();
    console.log('LayoutContext - Initialized with state:', this.state);
    console.log('LayoutContext - Initialized responsive mode:', this.responsiveMode);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LayoutContextImpl {
    if (!LayoutContextImpl.instance) {
      LayoutContextImpl.instance = new LayoutContextImpl();
    }
    return LayoutContextImpl.instance;
  }

  /**
   * Get initial layout state
   */
  private getInitialState(): LayoutState {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;

    return {
      viewport: {
        width,
        height,
        isMobile,
        isTablet,
        isDesktop
      },
      sidebar: {
        width: isMobile ? 0 : 280,  // Default sidebar width, 0 for mobile
        isVisible: !isMobile        // Hidden on mobile by default
      }
    };
  }

  /**
   * Setup viewport observer for responsive updates
   */
  private setupViewportObserver(): void {
    // Use ResizeObserver for better performance if available
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(entries => {
        this.handleViewportChange();
      });
      this.resizeObserver.observe(document.body);
    }

    // Fallback to resize event listener
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.handleViewportChange();
      }, 100);
    });
  }

  /**
   * Handle viewport changes - Pure event-driven approach
   */
  private handleViewportChange(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;

    const oldViewport = this.state.viewport;
    const newViewport = { width, height, isMobile, isTablet, isDesktop };

    // Check if viewport type changed (mobile/tablet/desktop)
    const viewportTypeChanged = 
      oldViewport.isMobile !== isMobile ||
      oldViewport.isTablet !== isTablet ||
      oldViewport.isDesktop !== isDesktop;

    // Update viewport state only
    this.state.viewport = newViewport;

    // Only log if viewport type changed, not every pixel change
    if (viewportTypeChanged) {
      console.log(`LayoutContext - Viewport type changed: ${width}x${height} (${
        isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
      })`);
    }

    // Update responsive mode first (this will trigger responsive-mode-change event only if type changed)
    this.updateResponsiveMode();

    // For mobile transitions, update CSS and emit events based on current sidebar instance state
    if (viewportTypeChanged) {
      const oldSidebarState = this.getSidebarDimensionsInternal();
      
      console.log('LayoutContext - Viewport type changed:', {
        from: `${oldViewport.isMobile ? 'mobile' : oldViewport.isTablet ? 'tablet' : 'desktop'}`,
        to: `${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`,
        sidebarState: oldSidebarState
      });
      
      // Update CSS Grid variables based on current sidebar state
      this.updateCSSGridVariables();
      
      // Get current sidebar dimensions after viewport change (might be different due to mobile/desktop differences)
      const newSidebarState = this.getSidebarDimensionsInternal();
      
      // Emit sidebar dimensions change if the calculated dimensions changed
      if (JSON.stringify(oldSidebarState) !== JSON.stringify(newSidebarState)) {
        console.log('LayoutContext - Sidebar dimensions changed due to viewport transition:', {
          old: oldSidebarState,
          new: newSidebarState
        });
        this.emit('sidebar-dimensions-change', newSidebarState);
      }
      
      // Emit layout mode change event when viewport type actually changes
      this.emitLayoutModeChange();
    }
  }

  /**
   * Subscribe to layout events
   */
  public subscribe(eventType: LayoutEventType, listener: LayoutEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    console.log(`LayoutContext - Subscribed to ${eventType} (${this.listeners.get(eventType)!.size} total listeners)`);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener);
        console.log(`LayoutContext - Unsubscribed from ${eventType} (${eventListeners.size} remaining)`);
      }
    };
  }

  /**
   * Emit layout event
   */
  public emit(eventType: LayoutEventType, data: any): void {
    const event: LayoutEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    const eventListeners = this.listeners.get(eventType);
    if (eventListeners && eventListeners.size > 0) {
      console.log(`LayoutContext - Emitting ${eventType} to ${eventListeners.size} listeners:`, data);
      
      eventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`LayoutContext - Error in ${eventType} listener:`, error);
        }
      });
    } else {
      // Only log on first occurrence or important events to reduce console noise
      if (eventType === 'layout-ready' || eventType === 'responsive-mode-change') {
        console.log(`LayoutContext - No listeners for ${eventType}, event ignored`);
      }
    }
  }

  /**
   * Notify that sidebar dimensions have changed (called by sidebar component)
   * This method triggers layout updates and events based on current sidebar instance state
   */
  public notifySidebarDimensionsChanged(): void {
    if (!this.sidebarInstance) {
      console.warn('LayoutContext - No sidebar instance registered, ignoring dimension change notification');
      return;
    }

    const currentDimensions = this.getSidebarDimensionsInternal();
    
    console.log('LayoutContext - Sidebar dimensions change notification received:', currentDimensions);

    // Update CSS Grid variables immediately based on current sidebar state
    this.updateCSSGridVariables();

    // Emit change event with current sidebar dimensions
    this.emit('sidebar-dimensions-change', currentDimensions);
    
    // Emit layout mode change event
    this.emitLayoutModeChange();
  }

  /**
   * Get current layout state
   */
  public getState(): LayoutState {
    return { ...this.state };
  }

  /**
   * Internal method to get current sidebar dimensions with fallback
   * Used internally by methods that need sidebar dimensions
   */
  private getSidebarDimensionsInternal(): SidebarDimensions {
    const sidebar = this.getSidebar();
    if (sidebar) {
      return sidebar.getDimensions();
    }
    
    // Fallback: calculate dimensions based on responsive mode and viewport
    const { viewport } = this.state;
    const isMobile = viewport.isMobile;
    
    if (isMobile) {
      return {
        width: 0,
        rightBorder: 0,
        isCompact: false,
        isMobile: true,
        isVisible: false
      };
    }
    
    // For desktop/tablet without registered sidebar, use responsive mode defaults
    const mode = this.responsiveMode;
    return {
      width: mode.sidebarBehavior.defaultWidth,
      rightBorder: mode.sidebarBehavior.defaultWidth,
      isCompact: false,
      isMobile: false,
      isVisible: mode.sidebarBehavior.isVisible
    };
  }

  /**
   * Get current viewport info
   */
  public getViewport() {
    return { ...this.state.viewport };
  }

  /**
   * Mark layout as ready (called when all components are initialized)
   */
  public markReady(): void {
    console.log('LayoutContext - Layout marked as ready');
    
    // Ensure CSS Grid variables are set correctly on initialization
    this.updateCSSGridVariables();
    
    // Emit initial layout mode
    this.emitLayoutModeChange();
    
    this.emit('layout-ready', this.state);
  }

  /**
   * Calculate layout dimensions for components
   */
  public calculateContentArea(): {
    left: number;
    width: number;
    availableWidth: number;
  } {
    const viewport = this.state.viewport;
    const sidebar = this.getSidebarDimensionsInternal();
    
    if (viewport.isMobile) {
      // Mobile: full width content
      return {
        left: 0,
        width: viewport.width,
        availableWidth: viewport.width
      };
    }

    // Desktop: account for sidebar
    return {
      left: sidebar.rightBorder,
      width: viewport.width - sidebar.rightBorder,
      availableWidth: viewport.width - sidebar.rightBorder
    };
  }

  /**
   * Destroy context and cleanup
   */
  public destroy(): void {
    console.log('LayoutContext - Destroying...');

    // Clear all listeners
    this.listeners.clear();

    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove window listeners
    // Note: In a real implementation, you'd want to track listeners to remove them properly

    LayoutContextImpl.instance = null;
    console.log('LayoutContext - Destroyed');
  }

  /**
   * Update CSS Grid variables to reflect current sidebar state
   */
  private updateCSSGridVariables(): void {
    const root = document.documentElement;
    const appLayout = document.querySelector('.app-layout') as HTMLElement;
    
    if (appLayout) {
      const viewport = this.state.viewport;
      const sidebar = this.getSidebarDimensionsInternal();
      
      if (viewport.isMobile) {
        // Mobile: sidebar is overlay, so grid should be single column
        appLayout.style.gridTemplateColumns = '1fr';
        appLayout.style.gridTemplateAreas = `
          "header"
          "content"
        `;
      } else {
        // Desktop: update sidebar width in grid using CSS variables
        const sidebarWidth = `${sidebar.width}px`;
        const compactWidth = `${sidebar.isCompact ? 
          this.getResponsiveMode().sidebarBehavior.compactWidth : 
          this.getResponsiveMode().sidebarBehavior.defaultWidth}px`;
        
        // Set CSS custom properties on the layout element (higher specificity than media queries)
        appLayout.style.setProperty('--sidebar-width', sidebarWidth);
        appLayout.style.setProperty('--sidebar-compact-width', compactWidth);
        appLayout.style.setProperty('--sidebar-right-border', `${sidebar.rightBorder}px`);
        
        // Also update root for other components
        root.style.setProperty('--sidebar-width', sidebarWidth);
        root.style.setProperty('--sidebar-right-border', `${sidebar.rightBorder}px`);
        
        // Let CSS handle grid template columns via variables
        appLayout.style.gridTemplateColumns = '';
        appLayout.style.gridTemplateAreas = `
          "sidebar header"
          "sidebar content"
        `;
      }
      
      // Update layout classes for CSS hooks
      appLayout.classList.toggle('sidebar-compact', sidebar.isCompact && !viewport.isMobile);
      appLayout.classList.toggle('mobile-layout', viewport.isMobile);
      
      console.log('LayoutContext - CSS Grid variables updated:', {
        sidebarWidth: sidebar.width,
        gridColumns: appLayout.style.gridTemplateColumns,
        isCompact: sidebar.isCompact,
        isMobile: viewport.isMobile
      });
    }
  }

  /**
   * Calculate current layout mode based on viewport and sidebar state
   */
  private calculateLayoutMode(): LayoutMode {
    const viewport = this.state.viewport;
    const sidebar = this.getSidebarDimensionsInternal();
    
    let type: LayoutModeType;
    if (viewport.isMobile) {
      type = 'mobile';
    } else if (viewport.isTablet) {
      type = 'tablet';
    } else if (viewport.isDesktop && sidebar.isCompact) {
      type = 'desktop-compact';
    } else {
      type = 'desktop';
    }
    
    return {
      type,
      isCompact: sidebar.isCompact,
      isMobile: viewport.isMobile,
      isTablet: viewport.isTablet,
      isDesktop: viewport.isDesktop,
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      sidebar: {
        width: sidebar.width,
        isVisible: sidebar.isVisible
      }
    };
  }

  /**
   * Emit layout mode change event
   */
  private emitLayoutModeChange(): void {
    const layoutMode = this.calculateLayoutMode();
    console.log('LayoutContext - Layout mode changed:', layoutMode);
    this.emit('layout-mode-change', layoutMode);
  }

  /**
   * Get current layout mode
   */
  public getLayoutMode(): LayoutMode {
    return this.calculateLayoutMode();
  }

  /**
   * Get initial responsive mode
   */
  private getInitialResponsiveMode(): ResponsiveMode {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;

    let type: ResponsiveModeType;
    if (isMobile) {
      type = 'mobile';
    } else if (isTablet) {
      type = 'tablet';
    } else {
      type = 'desktop';
    }

    return {
      type,
      isMobile,
      isTablet,
      isDesktop,
      viewport: { width, height },
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1025
      },
      sidebarBehavior: {
        isVisible: !isMobile, // Visible on both tablet and desktop
        canToggle: !isMobile, // Can toggle on both tablet and desktop
        defaultWidth: 280, // CSS strict width - consistent across all screen sizes
        compactWidth: 80 // CSS strict width - consistent across all screen sizes
      }
    };
  }

  /**
   * Update responsive mode when viewport changes
   */
  private updateResponsiveMode(): void {
    const oldMode = { ...this.responsiveMode };
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= this.responsiveMode.breakpoints.mobile;
    const isTablet = width > this.responsiveMode.breakpoints.mobile && width <= this.responsiveMode.breakpoints.tablet;
    const isDesktop = width > this.responsiveMode.breakpoints.tablet;

    let type: ResponsiveModeType;
    if (isMobile) {
      type = 'mobile';
    } else if (isTablet) {
      type = 'tablet';
    } else {
      type = 'desktop';
    }

    // Check if responsive mode type changed
    const modeTypeChanged = oldMode.type !== type;

    // Always update responsive mode (for viewport dimensions)
    this.responsiveMode = {
      ...this.responsiveMode,
      type,
      isMobile,
      isTablet,
      isDesktop,
      viewport: { width, height },
      sidebarBehavior: {
        isVisible: !isMobile, // Visible on both tablet and desktop
        canToggle: !isMobile, // Can toggle on both tablet and desktop
        defaultWidth: 280, // CSS strict width - consistent across all screen sizes
        compactWidth: 80 // CSS strict width - consistent across all screen sizes
      }
    };

    // Only emit responsive mode change event if the mode TYPE changed (mobile ↔ tablet ↔ desktop)
    if (modeTypeChanged) {
      console.log(`LayoutContext - Responsive mode TYPE changed: ${oldMode.type} → ${type}`);
      this.emit('responsive-mode-change', this.responsiveMode);
    }
    // Note: Viewport size changes within the same mode are tracked silently (no logging/events)
  }

  /**
   * Get current responsive mode
   */
  public getResponsiveMode(): ResponsiveMode {
    return { ...this.responsiveMode };
  }

  /**
   * Check if current mode is mobile
   */
  public isMobile(): boolean {
    return this.responsiveMode.isMobile;
  }

  /**
   * Check if current mode is tablet
   */
  public isTablet(): boolean {
    return this.responsiveMode.isTablet;
  }

  /**
   * Check if current mode is desktop
   */
  public isDesktop(): boolean {
    return this.responsiveMode.isDesktop;
  }

  /**
   * Get sidebar dimensions based on current responsive mode and compact state
   */
  public calculateSidebarDimensions(isCompact: boolean = false): { width: number; isVisible: boolean } {
    const mode = this.responsiveMode;
    
    if (!mode.sidebarBehavior.isVisible) {
      return { width: 0, isVisible: false };
    }

    return {
      width: isCompact ? mode.sidebarBehavior.compactWidth : mode.sidebarBehavior.defaultWidth,
      isVisible: true
    };
  }

  /**
   * Get responsive breakpoints
   */
  public getBreakpoints() {
    return { ...this.responsiveMode.breakpoints };
  }

  /**
   * Check if sidebar can toggle in current mode
   */
  public canSidebarToggle(): boolean {
    return this.responsiveMode.sidebarBehavior.canToggle;
  }

  // =================================================================================
  // Sidebar Instance Management
  // =================================================================================

  /**
   * Register a sidebar instance with the LayoutContext
   * This allows centralized access to the sidebar through the context
   * 
   * @param sidebar - The sidebar instance implementing ISidebar interface
   */
  public registerSidebar(sidebar: Sidebar): void {
    if (this.sidebarInstance && this.sidebarInstance !== sidebar) {
      console.warn('LayoutContext - Replacing existing sidebar instance. This might indicate a setup issue.');
    }
    
    this.sidebarInstance = sidebar;
    console.log('LayoutContext - Sidebar instance registered successfully');
  }

  /**
   * Unregister the current sidebar instance
   * Should be called during cleanup or when switching sidebars
   */
  public unregisterSidebar(): void {
    if (this.sidebarInstance) {
      console.log('LayoutContext - Unregistering sidebar instance');
      this.sidebarInstance = null;
    }
  }

  /**
   * Get the current sidebar instance
   * Provides centralized access to the sidebar through LayoutContext
   * 
   * @returns The registered sidebar instance or null if none is registered
   */
  public getSidebar(): Sidebar | null {
    return this.sidebarInstance;
  }

  /**
   * Check if a sidebar instance is currently registered
   * 
   * @returns True if a sidebar is registered, false otherwise
   */
  public hasSidebar(): boolean {
    return this.sidebarInstance !== null;
  }

  /**
   * Execute a method on the registered sidebar instance if available
   * This provides a safe way to interact with the sidebar without null checks
   * 
   * @param callback - Function that receives the sidebar instance
   * @returns The result of the callback, or null if no sidebar is registered
   */
  public withSidebar<T>(callback: (sidebar: Sidebar) => T): T | null {
    if (this.sidebarInstance) {
      try {
        return callback(this.sidebarInstance);
      } catch (error) {
        console.error('LayoutContext - Error executing sidebar callback:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get sidebar state information combining both dimensions and instance data
   * This provides a comprehensive view of the sidebar's current state
   * 
   * @returns Combined sidebar state or null if no sidebar is registered
   */
  public getSidebarState(): (SidebarDimensions & {
    isLocked: boolean;
    element: HTMLElement | null;
  }) | null {
    if (!this.sidebarInstance) {
      return null;
    }

    const dimensions = this.getSidebarDimensionsInternal();
    return {
      ...dimensions,
      isLocked: this.sidebarInstance.isLocked(),
      element: this.sidebarInstance.getElement()
    };
  }
}

export default LayoutContextImpl;

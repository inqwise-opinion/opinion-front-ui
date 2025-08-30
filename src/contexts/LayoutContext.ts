/**
 * Layout Context - Manages sidebar dimensions and layout coordination
 * Provides a centralized event system for layout components
 */

export interface SidebarDimensions {
  width: number;
  rightBorder: number;
  isCompact: boolean;
  isMobile: boolean;
  isVisible: boolean;
}

export interface LayoutState {
  sidebar: SidebarDimensions;
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
}

export type LayoutEventType = 'sidebar-dimensions-change' | 'layout-ready' | 'layout-mode-change' | 'responsive-mode-change';

export type ResponsiveModeType = 'mobile' | 'tablet' | 'desktop';

export type LayoutModeType = 'mobile' | 'tablet' | 'desktop' | 'desktop-compact';

export interface ResponsiveMode {
  type: ResponsiveModeType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
  };
  breakpoints: {
    mobile: number;    // ≤ 768px
    tablet: number;    // 769px - 1024px  
    desktop: number;   // > 1024px
  };
  sidebarBehavior: {
    isVisible: boolean;
    canToggle: boolean;
    defaultWidth: number;
    compactWidth: number;
  };
}

export interface LayoutMode {
  type: LayoutModeType;
  isCompact: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
  };
  sidebar: {
    width: number;
    isVisible: boolean;
  };
}

export interface LayoutEvent {
  type: LayoutEventType;
  data: any;
  timestamp: number;
}

export type LayoutEventListener = (event: LayoutEvent) => void;

export class LayoutContext {
  private static instance: LayoutContext | null = null;
  private listeners: Map<LayoutEventType, Set<LayoutEventListener>> = new Map();
  private state: LayoutState;
  private responsiveMode: ResponsiveMode;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: number | null = null;

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
  public static getInstance(): LayoutContext {
    if (!LayoutContext.instance) {
      LayoutContext.instance = new LayoutContext();
    }
    return LayoutContext.instance;
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

    // Calculate initial sidebar width based on viewport
    let sidebarWidth = 0;
    if (!isMobile) {
      sidebarWidth = isTablet ? 240 : 280; // Tablet uses smaller width
    }

    return {
      sidebar: {
        width: sidebarWidth,
        rightBorder: sidebarWidth,
        isCompact: false,
        isMobile,
        isVisible: !isMobile
      },
      viewport: {
        width,
        height,
        isMobile,
        isTablet,
        isDesktop
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
   * Handle viewport changes
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

    // Update viewport state
    this.state.viewport = newViewport;

    // Update sidebar state for viewport transitions
    if (viewportTypeChanged) {
      const oldSidebarState = { ...this.state.sidebar };
      
      // Handle mobile transitions
      if (isMobile && !oldViewport.isMobile) {
        // Any mode -> Mobile: Hide sidebar
        this.state.sidebar = {
          ...this.state.sidebar,
          width: 0,
          rightBorder: 0,
          isMobile: true,
          isVisible: false
        };
      } else if (!isMobile && oldViewport.isMobile) {
        // Mobile -> Non-mobile: Show sidebar with appropriate dimensions
        const compactWidth = isTablet ? 64 : 80; // Tablet uses smaller compact width
        const defaultWidth = isTablet ? 240 : 280; // Tablet uses smaller default width
        
        this.state.sidebar = {
          ...this.state.sidebar,
          width: this.state.sidebar.isCompact ? compactWidth : defaultWidth,
          rightBorder: this.state.sidebar.isCompact ? compactWidth : defaultWidth,
          isMobile: false,
          isVisible: true
        };
      } else if (!isMobile && !oldViewport.isMobile) {
        // Non-mobile -> Non-mobile (desktop ↔ tablet): Adjust sidebar dimensions
        const compactWidth = isTablet ? 64 : 80;
        const defaultWidth = isTablet ? 240 : 280;
        
        const newWidth = this.state.sidebar.isCompact ? compactWidth : defaultWidth;
        
        this.state.sidebar = {
          ...this.state.sidebar,
          width: newWidth,
          rightBorder: newWidth,
          isMobile: false,
          isVisible: true
        };
      }

      // Emit sidebar dimensions change if sidebar state changed
      if (JSON.stringify(oldSidebarState) !== JSON.stringify(this.state.sidebar)) {
        console.log('LayoutContext - Sidebar state changed for viewport transition:', {
          from: `${oldViewport.isMobile ? 'mobile' : oldViewport.isTablet ? 'tablet' : 'desktop'}`,
          to: `${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`,
          oldDimensions: oldSidebarState,
          newDimensions: this.state.sidebar
        });
        
        // Update CSS Grid variables when sidebar state changes due to viewport
        this.updateCSSGridVariables();
        this.emit('sidebar-dimensions-change', this.state.sidebar);
      }
    }

    // Update CSS Grid variables for viewport changes
    if (viewportTypeChanged) {
      this.updateCSSGridVariables();
    }

    // Update responsive mode
    this.updateResponsiveMode();

    console.log(`LayoutContext - Viewport changed: ${width}x${height} (${
      isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    })`);
    
    // Emit layout mode change event
    this.emitLayoutModeChange();
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
      console.log(`LayoutContext - No listeners for ${eventType}, event ignored:`, data);
    }
  }

  /**
   * Update sidebar dimensions (called by sidebar component)
   */
  public updateSidebarDimensions(dimensions: Partial<SidebarDimensions>): void {
    const oldDimensions = { ...this.state.sidebar };
    
    // Update sidebar state
    this.state.sidebar = {
      ...this.state.sidebar,
      ...dimensions
    };

    console.log('LayoutContext - Sidebar dimensions updated:', {
      old: oldDimensions,
      new: this.state.sidebar
    });

    // Update CSS Grid variables immediately
    this.updateCSSGridVariables();

    // Emit change event
    this.emit('sidebar-dimensions-change', this.state.sidebar);
    
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
   * Get current sidebar dimensions
   */
  public getSidebarDimensions(): SidebarDimensions {
    return { ...this.state.sidebar };
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
    const { sidebar, viewport } = this.state;
    
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

    LayoutContext.instance = null;
    console.log('LayoutContext - Destroyed');
  }

  /**
   * Update CSS Grid variables to reflect current sidebar state
   */
  private updateCSSGridVariables(): void {
    const root = document.documentElement;
    const appLayout = document.querySelector('.app-layout') as HTMLElement;
    
    if (appLayout) {
      const { sidebar, viewport } = this.state;
      
      if (viewport.isMobile) {
        // Mobile: sidebar is overlay, so grid should be single column
        appLayout.style.gridTemplateColumns = '1fr';
        appLayout.style.gridTemplateAreas = `
          "header"
          "content"
        `;
      } else {
        // Desktop: update sidebar width in grid
        const sidebarWidth = `${sidebar.width}px`;
        appLayout.style.gridTemplateColumns = `${sidebarWidth} 1fr`;
        appLayout.style.gridTemplateAreas = `
          "sidebar header"
          "sidebar content"
        `;
        
        // Update CSS custom properties for other components to use
        root.style.setProperty('--sidebar-width', sidebarWidth);
        root.style.setProperty('--sidebar-right-border', `${sidebar.rightBorder}px`);
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
    const { sidebar, viewport } = this.state;
    
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
        defaultWidth: isTablet ? 240 : 280, // Tablet uses smaller default width
        compactWidth: isTablet ? 64 : 80 // Tablet uses smaller compact width
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
        defaultWidth: 280,
        compactWidth: isTablet ? 64 : 80 // Smaller compact width on tablet
      }
    };

    // Only emit responsive mode change event if the mode TYPE changed (mobile ↔ tablet ↔ desktop)
    if (modeTypeChanged) {
      console.log(`LayoutContext - Responsive mode TYPE changed: ${oldMode.type} → ${type}`);
      this.emit('responsive-mode-change', this.responsiveMode);
    } else {
      // Just a viewport size change within the same mode - no event needed
      console.log(`LayoutContext - Viewport size changed within ${type} mode: ${width}x${height}`);
    }
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
}

export default LayoutContext;

/**
 * Responsive Sidebar Component
 * Professional mobile-first sidebar that adapts to all screen sizes
 * 
 * Features:
 * - Mobile: Overlay menu that slides in from left with backdrop
 * - Tablet: Collapsible sidebar with toggle
 * - Desktop: Full sidebar with optional compact mode
 * - Smooth animations and transitions
 * - Proper accessibility support
 * - Clean state management
 */

export enum ViewportMode {
  MOBILE = 'mobile',    // < 768px
  TABLET = 'tablet',    // 768px - 1023px  
  DESKTOP = 'desktop'   // >= 1024px
}

export enum SidebarState {
  HIDDEN = 'hidden',
  VISIBLE = 'visible',
  COMPACT = 'compact'
}

export interface ResponsiveSidebarConfig {
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  animations?: {
    duration: number;
    easing: string;
  };
  accessibility?: {
    focusTrap: boolean;
    announceStateChanges: boolean;
  };
}

export class ResponsiveSidebar {
  private config: Required<ResponsiveSidebarConfig>;
  private currentMode: ViewportMode = ViewportMode.DESKTOP;
  private currentState: SidebarState = SidebarState.VISIBLE;
  private isInitialized: boolean = false;
  
  // DOM Elements
  private sidebar: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private toggleButton: HTMLElement | null = null;
  private closeButton: HTMLElement | null = null;
  
  // Event Listeners Storage
  private eventListeners: (() => void)[] = [];
  
  constructor(config: ResponsiveSidebarConfig = {}) {
    console.log('ResponsiveSidebar - Creating professional responsive sidebar...');
    
    this.config = {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
        ...config.breakpoints
      },
      animations: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        ...config.animations
      },
      accessibility: {
        focusTrap: true,
        announceStateChanges: true,
        ...config.accessibility
      }
    };
    
    console.log('ResponsiveSidebar - Configuration:', this.config);
  }

  /**
   * Initialize the responsive sidebar
   */
  async init(): Promise<void> {
    console.log('ResponsiveSidebar - Initializing...');
    
    if (this.isInitialized) {
      console.warn('ResponsiveSidebar - Already initialized');
      return;
    }

    try {
      // Cache DOM elements
      this.cacheElements();
      
      // Create mobile overlay if it doesn't exist
      this.createMobileOverlay();
      
      // Setup responsive behavior
      this.setupResponsiveDetection();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Apply initial styles
      this.applyInitialStyles();
      
      // Set initial state based on viewport
      this.handleViewportChange();
      
      this.isInitialized = true;
      console.log('ResponsiveSidebar - ✅ Initialized successfully');
      
    } catch (error) {
      console.error('ResponsiveSidebar - ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    console.log('ResponsiveSidebar - Caching DOM elements...');
    
    this.sidebar = document.getElementById('app_sidebar');
    this.toggleButton = document.getElementById('mobile_menu_toggle');
    this.closeButton = document.getElementById('sidebar_mobile_close');
    
    if (!this.sidebar) {
      throw new Error('ResponsiveSidebar - Required sidebar element #app_sidebar not found');
    }
    
    console.log('ResponsiveSidebar - Elements cached:', {
      sidebar: !!this.sidebar,
      toggleButton: !!this.toggleButton,
      closeButton: !!this.closeButton
    });
  }

  /**
   * Create mobile overlay element
   */
  private createMobileOverlay(): void {
    // Remove existing overlay
    const existingOverlay = document.getElementById('responsive_sidebar_overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create new overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'responsive_sidebar_overlay';
    this.overlay.className = 'responsive-sidebar-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.setAttribute('role', 'presentation');
    
    // Insert overlay into DOM
    document.body.appendChild(this.overlay);
    
    console.log('ResponsiveSidebar - Mobile overlay created');
  }

  /**
   * Apply initial CSS styles
   */
  private applyInitialStyles(): void {
    console.log('ResponsiveSidebar - Applying initial styles...');
    
    // Inject CSS styles
    const styleId = 'responsive-sidebar-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      /* Responsive Sidebar Professional Styles */
      .responsive-sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        z-index: 1010;
        opacity: 0;
        visibility: hidden;
        transition: opacity ${this.config.animations.duration}ms ${this.config.animations.easing},
                    visibility ${this.config.animations.duration}ms ${this.config.animations.easing};
      }
      
      .responsive-sidebar-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      
      /* Mobile Mode Styles */
      @media (max-width: ${this.config.breakpoints.mobile - 1}px) {
        #app_sidebar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          height: 100vh !important;
          width: 320px !important;
          max-width: 90vw !important;
          z-index: 1020 !important;
          transform: translateX(-100%) !important;
          transition: transform ${this.config.animations.duration}ms ${this.config.animations.easing} !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-radius: 0 16px 16px 0 !important;
        }
        
        #app_sidebar.mobile-open {
          transform: translateX(0) !important;
        }
        
        #app_sidebar .sidebar-mobile-close {
          display: block !important;
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          width: 32px !important;
          height: 32px !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          font-size: 18px !important;
          line-height: 1 !important;
          backdrop-filter: blur(10px) !important;
          transition: all 200ms ease !important;
        }
        
        #app_sidebar .sidebar-mobile-close:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: scale(1.1) !important;
        }
        
        #app_sidebar .sidebar-compact-toggle {
          display: none !important;
        }
        
        /* Mobile menu content styling */
        #app_sidebar .sidebar-wrapper {
          padding: 60px 0 20px 0 !important;
          height: 100% !important;
          overflow-y: auto !important;
        }
        
        #app_sidebar .sidebar-header .brand-title {
          color: white !important;
          text-align: center !important;
          margin-bottom: 2rem !important;
        }
        
        #app_sidebar .nav-link {
          color: rgba(255, 255, 255, 0.8) !important;
          padding: 12px 24px !important;
          margin: 4px 16px !important;
          border-radius: 12px !important;
          transition: all 200ms ease !important;
        }
        
        #app_sidebar .nav-link:hover,
        #app_sidebar .nav-link-active {
          background: rgba(255, 255, 255, 0.15) !important;
          color: white !important;
          transform: translateX(4px) !important;
        }
      }
      
      /* Tablet Mode Styles */
      @media (min-width: ${this.config.breakpoints.mobile}px) and (max-width: ${this.config.breakpoints.tablet - 1}px) {
        #app_sidebar {
          position: relative !important;
          transform: none !important;
          width: 280px !important;
          transition: width ${this.config.animations.duration}ms ${this.config.animations.easing} !important;
        }
        
        #app_sidebar.compact {
          width: 80px !important;
        }
        
        .responsive-sidebar-overlay {
          display: none !important;
        }
        
        #app_sidebar .sidebar-mobile-close {
          display: none !important;
        }
      }
      
      /* Desktop Mode Styles */
      @media (min-width: ${this.config.breakpoints.tablet}px) {
        #app_sidebar {
          position: relative !important;
          transform: none !important;
          width: 280px !important;
          transition: width ${this.config.animations.duration}ms ${this.config.animations.easing} !important;
        }
        
        #app_sidebar.compact {
          width: 80px !important;
        }
        
        .responsive-sidebar-overlay {
          display: none !important;
        }
        
        #app_sidebar .sidebar-mobile-close {
          display: none !important;
        }
      }
      
      /* Focus and accessibility styles */
      #app_sidebar:focus-within {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }
      
      @media (prefers-reduced-motion: reduce) {
        #app_sidebar,
        .responsive-sidebar-overlay {
          transition: none !important;
        }
      }
    `;
    
    console.log('ResponsiveSidebar - ✅ Professional styles applied');
  }

  /**
   * Setup responsive viewport detection
   */
  private setupResponsiveDetection(): void {
    console.log('ResponsiveSidebar - Setting up responsive detection...');
    
    const handleResize = () => {
      this.handleViewportChange();
    };
    
    // Add resize listener with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    this.eventListeners.push(() => {
      window.removeEventListener('resize', debouncedResize);
    });
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    console.log('ResponsiveSidebar - Setting up event listeners...');
    
    // Toggle button (hamburger menu)
    if (this.toggleButton) {
      const toggleHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      };
      
      this.toggleButton.addEventListener('click', toggleHandler);
      this.eventListeners.push(() => {
        this.toggleButton?.removeEventListener('click', toggleHandler);
      });
    }
    
    // Close button
    if (this.closeButton) {
      const closeHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      };
      
      this.closeButton.addEventListener('click', closeHandler);
      this.eventListeners.push(() => {
        this.closeButton?.removeEventListener('click', closeHandler);
      });
    }
    
    // Overlay click to close
    if (this.overlay) {
      const overlayHandler = () => {
        if (this.currentMode === ViewportMode.MOBILE) {
          this.close();
        }
      };
      
      this.overlay.addEventListener('click', overlayHandler);
      this.eventListeners.push(() => {
        this.overlay?.removeEventListener('click', overlayHandler);
      });
    }
    
    // Keyboard shortcuts
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.currentMode === ViewportMode.MOBILE && this.currentState === SidebarState.VISIBLE) {
        this.close();
      }
    };
    
    document.addEventListener('keydown', keyHandler);
    this.eventListeners.push(() => {
      document.removeEventListener('keydown', keyHandler);
    });
    
    console.log('ResponsiveSidebar - ✅ Event listeners setup complete');
  }

  /**
   * Handle viewport size changes
   */
  private handleViewportChange(): void {
    const width = window.innerWidth;
    const previousMode = this.currentMode;
    
    // Determine current viewport mode
    if (width < this.config.breakpoints.mobile) {
      this.currentMode = ViewportMode.MOBILE;
    } else if (width < this.config.breakpoints.tablet) {
      this.currentMode = ViewportMode.TABLET;
    } else {
      this.currentMode = ViewportMode.DESKTOP;
    }
    
    console.log(`ResponsiveSidebar - Viewport change: ${width}px -> ${this.currentMode}`);
    
    // Handle mode transitions
    if (previousMode !== this.currentMode) {
      this.handleModeTransition(previousMode, this.currentMode);
    }
    
    // Update toggle button visibility
    if (this.toggleButton) {
      this.toggleButton.style.display = this.currentMode === ViewportMode.MOBILE ? 'block' : 'none';
    }
    
    // Update body class for CSS targeting
    document.body.className = document.body.className
      .replace(/\b(mobile|tablet|desktop)-layout\b/g, '')
      .trim() + ` ${this.currentMode}-layout`;
  }

  /**
   * Handle transitions between viewport modes
   */
  private handleModeTransition(from: ViewportMode, to: ViewportMode): void {
    console.log(`ResponsiveSidebar - Mode transition: ${from} -> ${to}`);
    
    // Close mobile menu when switching away from mobile
    if (from === ViewportMode.MOBILE && to !== ViewportMode.MOBILE) {
      this.close();
    }
    
    // Reset sidebar classes for new mode
    if (this.sidebar) {
      this.sidebar.classList.remove('mobile-open', 'compact');
      
      if (to === ViewportMode.MOBILE) {
        this.currentState = SidebarState.HIDDEN;
      } else {
        this.currentState = SidebarState.VISIBLE;
      }
    }
    
    this.announceStateChange();
  }

  /**
   * Toggle sidebar visibility
   */
  public toggle(): void {
    console.log(`ResponsiveSidebar - Toggle called in ${this.currentMode} mode`);
    
    if (this.currentMode === ViewportMode.MOBILE) {
      if (this.currentState === SidebarState.VISIBLE) {
        this.close();
      } else {
        this.open();
      }
    } else {
      // Toggle compact mode on tablet/desktop
      if (this.currentState === SidebarState.COMPACT) {
        this.expand();
      } else {
        this.compact();
      }
    }
  }

  /**
   * Open mobile menu
   */
  public open(): void {
    if (this.currentMode !== ViewportMode.MOBILE) {
      console.warn('ResponsiveSidebar - Open only available in mobile mode');
      return;
    }
    
    console.log('ResponsiveSidebar - Opening mobile menu...');
    
    if (this.sidebar) {
      this.sidebar.classList.add('mobile-open');
      this.currentState = SidebarState.VISIBLE;
    }
    
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    this.announceStateChange();
    console.log('ResponsiveSidebar - ✅ Mobile menu opened');
  }

  /**
   * Close mobile menu
   */
  public close(): void {
    console.log('ResponsiveSidebar - Closing mobile menu...');
    
    if (this.sidebar) {
      this.sidebar.classList.remove('mobile-open');
      this.currentState = this.currentMode === ViewportMode.MOBILE ? SidebarState.HIDDEN : SidebarState.VISIBLE;
    }
    
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    this.announceStateChange();
    console.log('ResponsiveSidebar - ✅ Mobile menu closed');
  }

  /**
   * Set sidebar to compact mode (tablet/desktop)
   */
  public compact(): void {
    if (this.currentMode === ViewportMode.MOBILE) {
      console.warn('ResponsiveSidebar - Compact mode not available in mobile');
      return;
    }
    
    console.log('ResponsiveSidebar - Setting compact mode...');
    
    if (this.sidebar) {
      this.sidebar.classList.add('compact');
      this.currentState = SidebarState.COMPACT;
    }
    
    this.announceStateChange();
  }

  /**
   * Expand sidebar from compact mode
   */
  public expand(): void {
    console.log('ResponsiveSidebar - Expanding from compact mode...');
    
    if (this.sidebar) {
      this.sidebar.classList.remove('compact');
      this.currentState = SidebarState.VISIBLE;
    }
    
    this.announceStateChange();
  }

  /**
   * Announce state changes for accessibility
   */
  private announceStateChange(): void {
    if (!this.config.accessibility.announceStateChanges) return;
    
    const message = `Sidebar ${this.currentState} in ${this.currentMode} mode`;
    
    // Create or update live region
    let liveRegion = document.getElementById('sidebar-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sidebar-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
    
    console.log(`ResponsiveSidebar - Announced: ${message}`);
  }

  /**
   * Get current state information
   */
  public getState(): { mode: ViewportMode; state: SidebarState; isOpen: boolean } {
    return {
      mode: this.currentMode,
      state: this.currentState,
      isOpen: this.currentState === SidebarState.VISIBLE && this.currentMode === ViewportMode.MOBILE
    };
  }

  /**
   * Destroy the responsive sidebar
   */
  public destroy(): void {
    console.log('ResponsiveSidebar - Destroying...');
    
    // Remove all event listeners
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners = [];
    
    // Remove overlay
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    // Remove styles
    const styleElement = document.getElementById('responsive-sidebar-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // Remove live region
    const liveRegion = document.getElementById('sidebar-live-region');
    if (liveRegion) {
      liveRegion.remove();
    }
    
    // Reset body classes and styles
    document.body.className = document.body.className
      .replace(/\b(mobile|tablet|desktop)-layout\b/g, '')
      .trim();
    document.body.style.overflow = '';
    
    // Clear references
    this.sidebar = null;
    this.toggleButton = null;
    this.closeButton = null;
    this.isInitialized = false;
    
    console.log('ResponsiveSidebar - ✅ Destroyed successfully');
  }
}

export default ResponsiveSidebar;

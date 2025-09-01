/**
 * Layout Controller
 * Manages all master page components (Header, Sidebar, Footer) and their coordination
 */

import AppHeader, { HeaderUser } from './AppHeader';
import AppFooter, { FooterConfig } from './AppFooter';
// Import layout context
import LayoutContext, { LayoutEvent, LayoutMode, LayoutModeType } from '../contexts/LayoutContext.js';

export interface LayoutConfig {
  header?: {
    enabled?: boolean;
    brandTitle?: string;
    brandHref?: string;
  };
  sidebar?: {
    enabled?: boolean;
  };
  footer?: FooterConfig & {
    enabled?: boolean;
  };
}

export class Layout {
  private header: AppHeader;
  private footer: AppFooter;
  private config: LayoutConfig;
  private isInitialized: boolean = false;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];

  constructor(config: LayoutConfig = {}) {
    this.config = {
      header: {
        enabled: true,
        brandTitle: 'Opinion',
        brandHref: '/dashboard',
        ...config.header
      },
      sidebar: {
        enabled: true,
        ...config.sidebar
      },
      footer: {
        enabled: true,
        showCopyright: true,
        copyrightText: '© 2024 Inqwise Ltd',
        showNavigation: true,
        ...config.footer
      }
    };

    // Initialize layout context
    this.layoutContext = LayoutContext.getInstance();
    
    // Initialize components
    this.header = new AppHeader();
    this.footer = new AppFooter(this.config.footer);
  }

  /**
   * Initialize the layout and all components
   */
  async init(): Promise<void> {
    console.log('🏢 LAYOUT - init() START');

    try {
      console.log('🏢 LAYOUT - Starting layout initialization...');
      
      // Initialize header
      if (this.config.header?.enabled) {
        console.log('🏢 LAYOUT - Header enabled, initializing...');
        await this.header.init();
        console.log('✅ LAYOUT - Header initialized successfully');
        
        // Update brand if configured
        if (this.config.header.brandTitle) {
          console.log('🏢 LAYOUT - Updating header brand...');
          this.header.updateBrand(
            this.config.header.brandTitle,
            this.config.header.brandHref
          );
          console.log('✅ LAYOUT - Header brand updated');
        }
      } else {
        console.log('⚠️ LAYOUT - Header disabled in config');
      }

      // Note: Sidebar is now managed by the page component, not by Layout
      console.log('🏢 LAYOUT - Sidebar management delegated to page component');

      // Initialize footer
      if (this.config.footer?.enabled) {
        console.log('🏢 LAYOUT - Footer enabled, initializing...');
        await this.footer.init();
        console.log('✅ LAYOUT - Footer initialized successfully');
      } else {
        console.log('⚠️ LAYOUT - Footer disabled in config');
      }

      // Setup component coordination
      console.log('🏢 LAYOUT - Setting up component coordination...');
      this.setupComponentCoordination();
      console.log('✅ LAYOUT - Component coordination setup complete');

      // Setup responsive behavior
      console.log('🏢 LAYOUT - Setting up responsive behavior...');
      this.setupResponsiveBehavior();
      console.log('✅ LAYOUT - Responsive behavior setup complete');
      
      // Subscribe to layout context events
      console.log('🏢 LAYOUT - Subscribing to layout context events...');
      this.subscribeToLayoutContext();
      console.log('✅ LAYOUT - Layout context subscription complete');
      
      // Mark layout as ready
      this.layoutContext.markReady();

      this.isInitialized = true;
      console.log('✅ LAYOUT - Layout initialization completed successfully!');
    } catch (error) {
      console.error('❌ LAYOUT - Layout initialization failed:', error);
      console.error('❌ LAYOUT - Error stack:', error.stack);
      throw error;
    }
    
    console.log('🏢 LAYOUT - init() END');
  }

  /**
   * Setup coordination between components
   */
  private setupComponentCoordination(): void {
    // Note: Component coordination is now handled by the layout context
    // All components subscribe to layout context events for coordination
    console.log('Layout - Component coordination delegated to layout context');
  }

  /**
   * Setup responsive behavior for the entire layout
   */
  private setupResponsiveBehavior(): void {
    // Subscribe to layout context responsive mode changes
    this.layoutContext.subscribe('responsive-mode-change', (event) => {
      this.handleResponsiveModeChange(event.data);
    });

    // Initial responsive setup based on current mode
    const currentMode = this.layoutContext.getResponsiveMode();
    this.handleResponsiveModeChange(currentMode);
  }

  /**
   * Handle responsive mode changes from LayoutContext
   */
  private handleResponsiveModeChange(mode: any): void {
    console.log(`Layout - Responsive mode changed to: ${mode.type}`, mode);
    
    // Update body classes for CSS targeting
    document.body.classList.toggle('mobile-layout', mode.isMobile);
    document.body.classList.toggle('tablet-layout', mode.isTablet);
    document.body.classList.toggle('desktop-layout', mode.isDesktop);
    
    // Update components based on responsive mode
    if (this.config.header?.enabled) {
      // Header might need responsive updates
      console.log('Layout - Updating header for responsive mode');
    }
    
    if (this.config.footer?.enabled) {
      // Footer might need responsive updates
      console.log('Layout - Updating footer for responsive mode');
    }
    
    console.log(`Layout - Responsive mode update complete for ${mode.type}`);
  }

  /**
   * Get header component reference
   */
  getHeader(): AppHeader {
    return this.header;
  }
  
  /**
   * Get footer component reference
   */
  getFooter(): AppFooter {
    return this.footer;
  }

  /**
   * Update user information across all components
   */
  updateUser(user: HeaderUser): void {
    if (this.config.header?.enabled) {
      this.header.updateUser(user);
    }
    
    console.log('Layout - User updated across components');
  }

  /**
   * Update layout configuration
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };

    // Update header config
    if (config.header) {
      if (config.header.brandTitle || config.header.brandHref) {
        this.header.updateBrand(
          config.header.brandTitle || this.config.header?.brandTitle || 'Opinion',
          config.header.brandHref || this.config.header?.brandHref || '/dashboard'
        );
      }
    }

    // Update footer config
    if (config.footer) {
      this.footer.updateConfig(config.footer);
    }
  }

  /**
   * Show/hide header
   */
  showHeader(show: boolean): void {
    this.header.setVisible(show);
    this.config.header!.enabled = show;
  }

  /**
   * Show/hide footer
   */
  showFooter(show: boolean): void {
    this.footer.setVisible(show);
    this.config.footer!.enabled = show;
  }

  /**
   * Show/hide sidebar
   */
  showSidebar(show: boolean): void {
    // Note: Sidebar visibility is now managed by the page component
    this.config.sidebar!.enabled = show;
  }

  /**
   * Get component references (duplicate methods removed)
   */
  getSidebar(): any | null {
    // Note: Sidebar is now managed by the page component, not Layout
    return null;
  }

  /**
   * Check if layout is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current layout state
   */
  getLayoutState(): {
    headerVisible: boolean;
    footerVisible: boolean;
    sidebarEnabled: boolean;
    viewport: 'mobile' | 'tablet' | 'desktop';
  } {
    const width = window.innerWidth;
    const isMobile = width <= 768;
    const isTablet = width <= 1024;
    
    return {
      headerVisible: this.config.header?.enabled || false,
      footerVisible: this.config.footer?.enabled || false,
      sidebarEnabled: this.config.sidebar?.enabled || false,
      viewport: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    };
  }

  /**
   * Update copyright text across components
   */
  updateCopyrightText(text: string): void {
    // Update footer copyright
    this.footer.updateCopyrightText(text);

    // Update sidebar copyright (if it exists)
    const sidebarCopyright = document.querySelector('.sidebar-footer .copyright-text') as HTMLElement;
    if (sidebarCopyright) {
      sidebarCopyright.textContent = text;
    }

    console.log('Layout - Copyright text updated:', text);
  }
  
  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log('Layout - Subscribing to layout context events...');
    
    // Subscribe to layout ready events
    const layoutReadyUnsubscribe = this.layoutContext.subscribe(
      'layout-ready',
      this.handleLayoutReady.bind(this)
    );
    this.layoutUnsubscribers.push(layoutReadyUnsubscribe);
    
    // Subscribe to sidebar dimension changes for coordination
    const sidebarDimensionsUnsubscribe = this.layoutContext.subscribe(
      'sidebar-dimensions-change',
      this.handleSidebarDimensionsChange.bind(this)
    );
    this.layoutUnsubscribers.push(sidebarDimensionsUnsubscribe);
    
    // Subscribe to layout mode changes for CSS class management
    const layoutModeUnsubscribe = this.layoutContext.subscribe(
      'layout-mode-change',
      this.handleLayoutModeChange.bind(this)
    );
    this.layoutUnsubscribers.push(layoutModeUnsubscribe);
    
    console.log('Layout - Successfully subscribed to layout context events ✅');
  }
  
  /**
   * Handle layout ready event
   */
  private handleLayoutReady(event: any): void {
    console.log('Layout - Layout context marked as ready:', event.data);
    
    // Perform any final coordination between components
    this.finalizeComponentCoordination();
  }
  
  /**
   * Handle sidebar dimension changes for global coordination
   */
  private handleSidebarDimensionsChange(event: any): void {
    const dimensions = event.data;
    console.log('Layout - Received sidebar dimensions change for coordination:', dimensions);
    
    // Layout component can perform any global coordination here
    // Individual components already handle their own layout updates
    
    // Example: Could update global CSS variables or dispatch custom events
    document.documentElement.style.setProperty('--sidebar-width', `${dimensions.width}px`);
    document.documentElement.style.setProperty('--content-margin-left', `${dimensions.rightBorder}px`);
  }
  
  /**
   * Finalize component coordination after layout is ready
   */
  private finalizeComponentCoordination(): void {
    console.log('Layout - Finalizing component coordination...');
    
    // Ensure all components are properly positioned
    const layoutState = this.layoutContext.getState();
    
    // Set global CSS variables for consistent layout
    const root = document.documentElement;
    root.style.setProperty('--sidebar-width', `${layoutState.sidebar.width}px`);
    root.style.setProperty('--sidebar-right-border', `${layoutState.sidebar.rightBorder}px`);
    root.style.setProperty('--viewport-width', `${layoutState.viewport.width}px`);
    root.style.setProperty('--viewport-height', `${layoutState.viewport.height}px`);
    
    console.log('Layout - Component coordination finalized ✅');
  }
  
  /**
   * Handle layout mode changes and update component CSS classes
   */
  private handleLayoutModeChange(event: LayoutEvent): void {
    const layoutMode = event.data as LayoutMode;
    console.log('Layout - Received layout mode change:', layoutMode);
    
    this.updateComponentCSSClasses(layoutMode);
  }
  
  /**
   * Update CSS classes for all layout components based on layout mode
   */
  private updateComponentCSSClasses(layoutMode: LayoutMode): void {
    const { type, isCompact, isMobile, isTablet, isDesktop } = layoutMode;
    
    console.log(`Layout - Updating component CSS classes for mode: ${type}`);
    
    // Get all layout components
    const components = {
      layout: document.querySelector('.app-layout') as HTMLElement,
      sidebar: document.querySelector('.app-sidebar') as HTMLElement,
      header: document.querySelector('.app-header') as HTMLElement,
      content: document.querySelector('.app-content-scroll, .app-main') as HTMLElement,
      footer: document.querySelector('.app-footer') as HTMLElement
    };
    
    // Define CSS class mappings for each mode
    const modeClasses = {
      mobile: 'layout-mode-mobile',
      tablet: 'layout-mode-tablet',
      desktop: 'layout-mode-desktop',
      'desktop-compact': 'layout-mode-desktop-compact'
    };
    
    const stateClasses = {
      compact: 'layout-compact',
      mobile: 'layout-mobile',
      tablet: 'layout-tablet',
      desktop: 'layout-desktop'
    };
    
    // Remove all existing layout mode classes and add current ones
    Object.values(components).forEach(element => {
      if (element) {
        // Remove all previous layout mode classes
        Object.values(modeClasses).forEach(className => {
          element.classList.remove(className);
        });
        Object.values(stateClasses).forEach(className => {
          element.classList.remove(className);
        });
        
        // Add current layout mode class
        element.classList.add(modeClasses[type]);
        
        // Add state-based classes
        if (isCompact) element.classList.add(stateClasses.compact);
        if (isMobile) element.classList.add(stateClasses.mobile);
        if (isTablet) element.classList.add(stateClasses.tablet);
        if (isDesktop) element.classList.add(stateClasses.desktop);
      }
    });
    
    // Update body classes for global CSS targeting
    const body = document.body;
    Object.values(modeClasses).forEach(className => {
      body.classList.remove(className);
    });
    Object.values(stateClasses).forEach(className => {
      body.classList.remove(className);
    });
    
    body.classList.add(modeClasses[type]);
    if (isCompact) body.classList.add(stateClasses.compact);
    if (isMobile) body.classList.add(stateClasses.mobile);
    if (isTablet) body.classList.add(stateClasses.tablet);
    if (isDesktop) body.classList.add(stateClasses.desktop);
    
    // Set CSS custom properties for mode-specific styling
    const root = document.documentElement;
    root.style.setProperty('--layout-mode', type);
    root.style.setProperty('--is-compact', isCompact ? '1' : '0');
    root.style.setProperty('--is-mobile', isMobile ? '1' : '0');
    root.style.setProperty('--is-tablet', isTablet ? '1' : '0');
    root.style.setProperty('--is-desktop', isDesktop ? '1' : '0');
    
    console.log('Layout - CSS classes updated:', {
      mode: type,
      addedClasses: [
        modeClasses[type],
        ...(isCompact ? [stateClasses.compact] : []),
        ...(isMobile ? [stateClasses.mobile] : []),
        ...(isTablet ? [stateClasses.tablet] : []),
        ...(isDesktop ? [stateClasses.desktop] : [])
      ],
      components: Object.keys(components).filter(key => components[key as keyof typeof components] !== null)
    });
    
    // Dispatch custom event for other parts of the application
    const customEvent = new CustomEvent('layout-mode-updated', {
      detail: {
        layoutMode,
        components
      }
    });
    document.dispatchEvent(customEvent);
  }

  /**
   * Cleanup when layout is destroyed
   */
  destroy(): void {
    console.log('Layout - Destroying...');
    
    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Layout - Error unsubscribing from layout context:', error);
      }
    });
    this.layoutUnsubscribers = [];

    // Destroy all components
    if (this.header) {
      this.header.destroy();
    }

    if (this.footer) {
      this.footer.destroy();
    }

    // Note: Sidebar destruction is now handled by the page component

    // Clean up global CSS variables
    const root = document.documentElement;
    root.style.removeProperty('--sidebar-width');
    root.style.removeProperty('--sidebar-right-border');
    root.style.removeProperty('--content-margin-left');
    root.style.removeProperty('--viewport-width');
    root.style.removeProperty('--viewport-height');
    root.style.removeProperty('--layout-mode');
    root.style.removeProperty('--is-compact');
    root.style.removeProperty('--is-mobile');
    root.style.removeProperty('--is-tablet');
    root.style.removeProperty('--is-desktop');
    
    // Clean up layout mode classes from body
    const layoutModeClasses = [
      'layout-mode-mobile', 'layout-mode-tablet', 'layout-mode-desktop', 'layout-mode-desktop-compact',
      'layout-compact', 'layout-mobile', 'layout-tablet', 'layout-desktop'
    ];
    layoutModeClasses.forEach(className => {
      document.body.classList.remove(className);
    });

    // Remove window event listeners
    // Note: In a real app, you'd want to keep track of listeners to remove them properly
    
    this.isInitialized = false;
    console.log('Layout - Destroyed');
  }
}

export default Layout;

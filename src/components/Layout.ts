/**
 * Layout Controller
 * Manages all master page components (Header, Sidebar, Footer) and their coordination
 */

import AppHeader, { HeaderUser } from './AppHeader';
import AppFooter, { FooterConfig } from './AppFooter';

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
        this.header.init();
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
        this.footer.init();
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
    // Note: Sidebar coordination is now handled by the page component
    // The Layout only manages header and footer coordination
    console.log('Layout - Component coordination setup complete');
  }

  /**
   * Setup responsive behavior for the entire layout
   */
  private setupResponsiveBehavior(): void {
    let resizeTimeout: NodeJS.Timeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 100);
    });

    // Initial resize handling
    this.handleResize();
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    const width = window.innerWidth;
    const isMobile = width <= 768;
    const isTablet = width <= 1024;

    // Update body classes for CSS targeting
    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('tablet-layout', isTablet && !isMobile);
    document.body.classList.toggle('desktop-layout', !isTablet);

    console.log(`Layout - Responsive update: ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} (${width}px)`);
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
   * Get component references
   */
  getHeader(): AppHeader {
    return this.header;
  }

  getFooter(): AppFooter {
    return this.footer;
  }

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
   * Cleanup when layout is destroyed
   */
  destroy(): void {
    console.log('Layout - Destroying...');

    // Destroy all components
    if (this.header) {
      this.header.destroy();
    }

    if (this.footer) {
      this.footer.destroy();
    }

    // Note: Sidebar destruction is now handled by the page component

    // Remove window event listeners
    // Note: In a real app, you'd want to keep track of listeners to remove them properly
    
    this.isInitialized = false;
    console.log('Layout - Destroyed');
  }
}

export default Layout;

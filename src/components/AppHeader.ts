/**
 * App Header Component - Clean CSS Grid Integration
 * Basic header functionality with clean layout integration
 */

// Import component-scoped CSS
import '../assets/styles/components/header.css';

// Import required components
import { UserMenu } from './UserMenu.js';
import { Sidebar } from './Sidebar.js';
// Import layout context
import LayoutContext, { LayoutEvent, SidebarDimensions } from '../contexts/LayoutContext.js';

export interface HeaderUser {
  username: string;
  email?: string;
  avatar?: string;
}

export class AppHeader {
  private container: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private currentPageTitle: string = 'Dashboard';
  private currentUser: HeaderUser | null = null;
  private userMenu: UserMenu | null = null;
  private sidebar: Sidebar | null = null;
  private user: HeaderUser | null = null;
  private resizeTimeout: number | null = null;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];

  constructor() {
    console.log('AppHeader - Creating clean header...');
    this.layoutContext = LayoutContext.getInstance();
  }

  /**
   * Initialize the header component
   */
  async init(): Promise<void> {
    console.log('AppHeader - Initializing...');
    
    try {
      // Initialize sidebar component FIRST so header can be positioned correctly
      await this.initSidebar();
      
      // Create header after sidebar exists
      this.createHeader();
      
      // Wait for DOM to be ready and elements to be available
      await this.waitForDOMReady();
      
      console.log(`AppHeader - Current viewport: ${window.innerWidth}px`);
      
      // Initialize user menu component (desktop only)
      await this.initUserMenu();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Header is now fully CSS-based - no dynamic layout subscriptions needed
      // this.subscribeToLayoutContext();
      
      console.log('AppHeader - Ready');
    } catch (error) {
      console.error('AppHeader - Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Use existing header element and populate content
   */
  private createHeader(): void {
    // Find existing header element
    this.container = document.getElementById('app-header');
    
    if (!this.container) {
      throw new Error('AppHeader: Could not find existing #app-header element');
    }
    
    console.log('AppHeader - Using existing element');
    
    // Populate the existing structure with dynamic content
    this.populateContent();
    
    console.log('AppHeader - Content populated successfully');
  }
  
  /**
   * Populate header content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.container) return;
    
    // Find header container
    const headerContainer = this.container.querySelector('.header-container');
    if (!headerContainer) return;
    
    // Populate header content
    headerContainer.innerHTML = `
      <!-- Left section: Mobile toggle button -->
      <div class="header-left">
        <button class="mobile-menu-toggle" id="mobile_menu_toggle" style="
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          color: #212529;
          transition: all 0.2s ease;
          font-size: 16px;
          line-height: 1;
        " aria-label="Toggle Menu" title="Toggle Menu">
          <span class="menu-icon" style="
            display: block;
            width: 18px;
            height: 18px;
            position: relative;
          ">
            <span style="
              display: block;
              position: absolute;
              height: 2px;
              width: 100%;
              background: currentColor;
              border-radius: 1px;
              opacity: 1;
              left: 0;
              transform: rotate(0deg);
              transition: .25s ease-in-out;
              top: 2px;
            "></span>
            <span style="
              display: block;
              position: absolute;
              height: 2px;
              width: 100%;
              background: currentColor;
              border-radius: 1px;
              opacity: 1;
              left: 0;
              transform: rotate(0deg);
              transition: .25s ease-in-out;
              top: 8px;
            "></span>
            <span style="
              display: block;
              position: absolute;
              height: 2px;
              width: 100%;
              background: currentColor;
              border-radius: 1px;
              opacity: 1;
              left: 0;
              transform: rotate(0deg);
              transition: .25s ease-in-out;
              top: 14px;
            "></span>
          </span>
        </button>
      </div>
      
      <!-- Center section: Enhanced breadcrumbs and page title -->
      <div class="header-center" style="${window.innerWidth <= 767 ? 'padding-left: 16px;' : 'padding-left: 0;'}">
        <nav class="header-breadcrumbs" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <!-- Current Page (Menu Item) -->
            <li class="breadcrumb-item breadcrumb-current" aria-current="page">
              <span class="breadcrumb-text" id="current_page_title">Dashboard</span>
            </li>
            
            <!-- Separator (for future sub-pages) -->
            <li class="breadcrumb-separator" aria-hidden="true" id="breadcrumb_separator" style="display: none;">
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L4.5 5L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </li>
            
            <!-- Sub-page (dynamically added when needed) -->
            <li class="breadcrumb-item breadcrumb-subpage" id="breadcrumb_subpage" style="display: none;">
              <span class="breadcrumb-text" id="subpage_title"></span>
            </li>
          </ol>
        </nav>
      </div>
      
      <!-- Right section: User menu only -->
      <div class="header-right">
        <!-- User Menu -->
        <div id="user_menu_container"></div>
      </div>
    `;
  }

  /**
   * Initialize user menu component (responsive - works on both mobile and desktop)
   */
  private async initUserMenu(): Promise<void> {
    const userMenuContainer = await this.waitForElement('#user_menu_container');
    if (userMenuContainer) {
      this.userMenu = new UserMenu(userMenuContainer);
      await this.userMenu.init();
      console.log('AppHeader - UserMenu component initialized (responsive)');
    } else {
      console.warn('AppHeader - User menu container not found');
    }
  }

  /**
   * Initialize sidebar component
   */
  private async initSidebar(): Promise<void> {
    this.sidebar = new Sidebar();
    await this.sidebar.init();
    
    console.log('AppHeader - Sidebar component initialized');
  }

  /**
   * Setup event listeners for header interactions
   */
  private setupEventListeners(): void {
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Handle data-action based interactions
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const actionElement = target.closest('[data-action]') as HTMLElement;
      if (actionElement && this.container?.contains(actionElement)) {
        const action = actionElement.getAttribute('data-action');
        this.handleAction(action, actionElement);
      }
    });
    
    // Header positioning is now fully CSS-based - no dynamic resize handling needed
  }
  
  /**
   * Handle window resize events with debouncing for better performance
   */
  private handleResizeDebounced(): void {
    // Clear previous timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Debounce resize handling to improve performance
    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 100); // 100ms debounce
  }
  
  /**
   * Handle window resize events to update header styling and position
   */
  private handleResize(): void {
    const currentWidth = window.innerWidth;
    const headerCenter = this.container?.querySelector('.header-center') as HTMLElement;
    
    console.log(`🪟 AppHeader - handleResize triggered for ${currentWidth}px viewport`);
    
    if (headerCenter) {
      // Apply mobile styles only on phone screens, desktop/tablet get no padding
      if (currentWidth <= 767) {
        headerCenter.style.cssText = 'padding-left: 16px;'; // Mobile padding for header-left space
      } else {
        headerCenter.style.cssText = 'padding-left: 0;'; // No padding on tablet/desktop
      }
      console.log(`📐 AppHeader - Updated header-center styling for ${currentWidth}px viewport`);
    }
    
    // Update header position based on current sidebar state
    console.log(`🔄 AppHeader - Updating position due to resize...`);
    this.updatePosition();
  }
  
  /**
   * Recreate header with updated structure based on current viewport
   */
  private recreateHeader(): void {
    if (!this.container) return;
    
    // Store current page title
    const currentTitle = document.getElementById('current_page_title')?.textContent || 'Dashboard';
    
    // Remove existing header
    this.container.remove();
    
    // Create new header with current viewport structure
    this.createHeader();
    
    // Restore page title
    this.updatePageTitle(currentTitle);
    
    // Restore user if available
    if (this.user) {
      // Wait a moment for DOM to be ready, then reinitialize user menu
      setTimeout(async () => {
        await this.initUserMenu();
        if (this.user) {
          this.updateUser(this.user);
        }
      }, 100);
    }
  }


  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Close user menu if open - delegate to UserMenu component
      if (this.userMenu) {
        this.userMenu.close();
      }
    }
  }

  /**
   * Handle data-action based interactions
   */
  private handleAction(action: string | null, element: HTMLElement): void {
    if (!action) return;

    switch (action) {
      case 'feedback':
        this.showFeedbackModal();
        break;
      default:
        console.warn(`Unknown header action: ${action}`);
    }
  }

  /**
   * Show feedback modal
   */
  private showFeedbackModal(): void {
    const message = 
      'Thank you for your interest in providing feedback!\n\n' +
      'This would typically open a feedback form or modal dialog ' +
      'where you could submit your comments and suggestions.';

    if (confirm(message + '\n\nWould you like to be redirected to our feedback page?')) {
      console.log('Redirecting to feedback page...');
      // In a real implementation, this would redirect to the actual feedback page
    }
  }

  /**
   * Update user information in header
   */
  updateUser(user: HeaderUser): void {
    this.user = user;
    
    console.log(`AppHeader - updateUser called: ${user.username}`);

    // Always use UserMenu - it will handle responsive display via CSS
    if (this.userMenu) {
      this.userMenu.updateUser({
        username: user.username,
        email: user.email,
        avatar: user.avatar
      });
      console.log('AppHeader - User updated via UserMenu');
    } else {
      console.warn('AppHeader - UserMenu not available for user update');
    }
  }

  /**
   * Update logo/brand link
   */
  updateBrand(title: string, href: string = '/dashboard'): void {
    const logo = this.container?.querySelector('.logo') as HTMLAnchorElement;
    if (logo) {
      logo.textContent = title;
      logo.href = href;
    }
  }

  /**
   * Update page title in header breadcrumb
   */
  updatePageTitle(title: string): void {
    const pageTitleElement = document.getElementById('current_page_title');
    if (pageTitleElement) {
      pageTitleElement.textContent = title;
      console.log('AppHeader - Page title updated:', title);
    } else {
      console.warn('AppHeader - Page title element not found');
    }
  }

  /**
   * Update breadcrumbs with main page and optional sub-page
   * @param mainPage - The main menu item (e.g., "Dashboard", "Surveys")
   * @param subPage - Optional sub-page (e.g., "Settings", "Create Survey")
   */
  updateBreadcrumbs(mainPage: string, subPage?: string): void {
    const mainPageElement = document.getElementById('current_page_title');
    const separator = document.getElementById('breadcrumb_separator');
    const subPageContainer = document.getElementById('breadcrumb_subpage');
    const subPageElement = document.getElementById('subpage_title');

    if (mainPageElement) {
      mainPageElement.textContent = mainPage;
    }

    if (subPage && separator && subPageContainer && subPageElement) {
      // Show separator and sub-page
      separator.style.display = 'flex';
      subPageContainer.style.display = 'flex';
      subPageElement.textContent = subPage;
      
      // Update document title
      document.title = `${subPage} - ${mainPage} - Opinion`;
      
      console.log(`AppHeader - Breadcrumbs updated: ${mainPage} > ${subPage}`);
    } else {
      // Hide separator and sub-page
      if (separator) separator.style.display = 'none';
      if (subPageContainer) subPageContainer.style.display = 'none';
      
      // Update document title
      document.title = `${mainPage} - Opinion`;
      
      console.log(`AppHeader - Breadcrumbs updated: ${mainPage}`);
    }
  }

  /**
   * Show/hide header
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Get header container
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Get sidebar instance for external access
   */
  getSidebar(): Sidebar | null {
    return this.sidebar;
  }

  /**
   * Simulate user loading - uses UserMenu for both mobile and desktop
   */
  simulateUserLoading(): void {
    console.log('🔄 AppHeader - simulateUserLoading() called');
    console.log(`📊 Viewport: ${window.innerWidth}px (UserMenu handles responsive display)`);
    
    if (!this.userMenu) {
      console.warn('❌ AppHeader - UserMenu not available for loading simulation');
      return;
    }
    
    console.log('⏳ AppHeader - Setting loading state...');
    const loadingUser = { username: 'Loading...', email: 'Please wait...' };
    this.updateUser(loadingUser);
    
    // Simulate loading with actual user data
    const mockUsers = [
      { username: 'John Doe', email: 'john.doe@company.com', avatar: '👤' },
      { username: 'Sarah Wilson', email: 'sarah.w@company.com', avatar: '👩' },
      { username: 'Mike Johnson', email: 'mike.johnson@company.com', avatar: '👨' },
      { username: 'Emma Davis', email: 'emma.davis@company.com', avatar: '👩‍💼' },
      { username: 'Alex Chen', email: 'alex.chen@company.com', avatar: '👨‍💼' }
    ];
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    
    console.log(`🎯 AppHeader - Will load user: ${randomUser.username}`);
    
    // Use Promise-based simulation instead of timer
    this.simulateAsyncUserLoad(randomUser).then(() => {
      console.log('✅ AppHeader - Loading complete, updating user...');
      this.updateUser(randomUser);
      console.log('🎉 AppHeader - User updated successfully!');
    });
  }

  /**
   * Wait for DOM to be ready
   */
  private async waitForDOMReady(): Promise<void> {
    if (document.readyState === 'loading') {
      return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });
    }
    return Promise.resolve();
  }

  /**
   * Wait for a specific element to be available in the DOM
   */
  private async waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement | null> {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }

    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Simulate async user loading using requestAnimationFrame for better performance
   */
  private async simulateAsyncUserLoad(user: HeaderUser): Promise<void> {
    // Use requestAnimationFrame for smooth animation-based delays
    return new Promise((resolve) => {
      let frames = 0;
      const targetFrames = 90; // ~1.5 seconds at 60fps
      
      const animate = () => {
        frames++;
        if (frames >= targetFrames) {
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log('AppHeader - Subscribing to layout context events...');

    // Subscribe to sidebar dimension changes
    const sidebarDimensionsUnsubscribe = this.layoutContext.subscribe(
      'sidebar-dimensions-change',
      this.handleSidebarDimensionsChange.bind(this)
    );
    this.layoutUnsubscribers.push(sidebarDimensionsUnsubscribe);

    // Note: No longer subscribing to viewport-change - sidebar-dimensions-change is sufficient
    // The sidebar dimensions already encode all the viewport information we need

    // Set initial position based on current layout state
    const currentState = this.layoutContext.getState();
    this.updateHeaderLayout(currentState.sidebar);

    console.log('AppHeader - Successfully subscribed to layout context events ✅');
  }


  /**
   * Handle sidebar dimension changes from layout context
   */
  private handleSidebarDimensionsChange(event: LayoutEvent): void {
    const dimensions = event.data as SidebarDimensions;
    console.log('AppHeader - Received sidebar dimensions change:', dimensions);
    this.updateHeaderLayout(dimensions);
  }


  /**
   * Update header layout based on sidebar dimensions
   */
  private updateHeaderLayout(dimensions: SidebarDimensions): void {
    if (!this.container) {
      console.warn('AppHeader - Cannot update layout: container not available');
      return;
    }

    console.log(`🎯 AppHeader - Updating layout for sidebar dimensions:`, dimensions);

    // Remove all positioning inline styles - let CSS handle layout
    this.container.style.left = '';
    this.container.style.width = '';
    this.container.style.right = '';

    // Update CSS classes based on sidebar state
    this.container.classList.toggle('header-sidebar-compact', dimensions.isCompact && !dimensions.isMobile);
    this.container.classList.toggle('header-sidebar-normal', !dimensions.isCompact && !dimensions.isMobile);
    this.container.classList.toggle('header-mobile', dimensions.isMobile);

    // Dispatch custom event for other components
    const event = new CustomEvent('header-layout-updated', {
      detail: {
        dimensions,
        headerElement: this.container
      }
    });
    document.dispatchEvent(event);

    console.log(`✅ AppHeader - Layout updated:`, {
      dimensions,
      cssClasses: Array.from(this.container.classList).filter(cls => cls.startsWith('header-'))
    });
  }

  /**
   * Handle sidebar compact mode changes (event-driven)
   * @deprecated - Use layout context instead
   * This method is called whenever the sidebar compact mode state changes
   * @param isCompact - The new compact mode state from the sidebar event
   */
  private handleSidebarCompactModeChange(isCompact: boolean): void {
    if (!this.container) {
      console.warn('AppHeader - Cannot update position: container not available');
      return;
    }

    console.log(`🎯 AppHeader - Handling compact mode change event: ${isCompact ? 'COMPACT' : 'NORMAL'}`);

    // Calculate sidebar dimensions and position based on the event data
    const sidebarInfo = this.calculateSidebarDimensions(isCompact);
    
    // Update header position based on sidebar right border coordinates
    this.updateHeaderPosition(sidebarInfo);
    
    console.log(`✅ AppHeader - Position updated for ${isCompact ? 'compact' : 'normal'} sidebar:`, {
      rightBorder: sidebarInfo.rightBorder,
      headerLeft: this.container.style.left,
      headerWidth: this.container.style.width,
      cssClasses: Array.from(this.container.classList).filter(cls => cls.startsWith('header-'))
    });
  }

  /**
   * Calculate sidebar dimensions and coordinates
   */
  private calculateSidebarDimensions(isCompact: boolean): {
    width: number;
    rightBorder: number;
    isCompact: boolean;
    isMobile: boolean;
  } {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, sidebar is overlay/hidden, so header should be full width
      return {
        width: 0,
        rightBorder: 0,
        isCompact: false, // Compact mode doesn't apply on mobile
        isMobile: true
      };
    }

    // Get responsive sidebar dimensions from layout context
    const responsiveMode = this.layoutContext.getResponsiveMode();
    const normalWidth = responsiveMode.sidebarBehavior.defaultWidth;  // 240px for tablet, 280px for desktop
    const compactWidth = responsiveMode.sidebarBehavior.compactWidth;  // 64px for tablet, 80px for desktop
    const currentWidth = isCompact ? compactWidth : normalWidth;
    
    console.log(`📏 AppHeader - Using responsive dimensions: ${normalWidth}px normal, ${compactWidth}px compact (${responsiveMode.type} mode)`);
    let actualRightBorder = currentWidth;
    
    // Get actual sidebar element for precise measurements if available
    const sidebarElement = document.getElementById('app_sidebar');
    
    if (sidebarElement) {
      try {
        const rect = sidebarElement.getBoundingClientRect();
        
        // Only use actual measurements if rect exists and values seem valid (not zero)
        if (rect && (rect.right > 0 || rect.width > 0)) {
          // If sidebar is positioned from left edge (rect.left === 0), use its width
          // Otherwise use its right coordinate
          actualRightBorder = rect.left === 0 ? rect.width : rect.right;
          
          // Fallback to calculated width if the measured value seems incorrect
          if (actualRightBorder <= 0) {
            actualRightBorder = currentWidth;
          }
        }
      } catch (error) {
        // getBoundingClientRect failed, use calculated width
        console.warn('AppHeader - getBoundingClientRect failed, using calculated width:', error);
        actualRightBorder = currentWidth;
      }
    }

    return {
      width: currentWidth,
      rightBorder: actualRightBorder,
      isCompact,
      isMobile: false
    };
  }

  /**
   * Update header position based on sidebar coordinates
   */
  private updateHeaderPosition(sidebarInfo: {
    width: number;
    rightBorder: number;
    isCompact: boolean;
    isMobile: boolean;
  }): void {
    if (!this.container) return;

    const { isCompact, isMobile } = sidebarInfo;

    // Remove all inline positioning styles - let CSS handle layout
    this.container.style.left = '';
    this.container.style.width = '';
    this.container.style.right = '';

    // Add CSS class for styling hooks - CSS will handle width: 100%
    this.container.classList.toggle('header-sidebar-compact', isCompact && !isMobile);
    this.container.classList.toggle('header-sidebar-normal', !isCompact && !isMobile);
    this.container.classList.toggle('header-mobile', isMobile);

    // Trigger custom event for other components that might need to know
    const event = new CustomEvent('header-position-updated', {
      detail: {
        sidebarInfo,
        isCompact,
        isMobile
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Get current sidebar information (useful for other components)
   */
  public getSidebarInfo(): {
    width: number;
    rightBorder: number;
    isCompact: boolean;
    isMobile: boolean;
  } | null {
    if (!this.sidebar) return null;
    
    const isCompact = this.sidebar.isCompactMode();
    return this.calculateSidebarDimensions(isCompact);
  }

  /**
   * Get current header position information
   */
  public getHeaderPosition(): {
    left: number;
    width: number;
    right: number;
  } | null {
    if (!this.container) return null;
    
    const rect = this.container.getBoundingClientRect();
    return {
      left: rect.left,
      width: rect.width,
      right: rect.right
    };
  }

  /**
   * Force update header position (useful after window resize)
   * Uses current layout context state instead of deprecated sidebar querying
   */
  public updatePosition(): void {
    console.log('🔄 AppHeader - Force updating position (manual trigger)');
    
    // Use current layout context state instead of querying sidebar directly
    const currentSidebarDimensions = this.layoutContext.getSidebarDimensions();
    console.log(`🔄 AppHeader - Using layout context dimensions:`, currentSidebarDimensions);
    
    // Update header layout using the current sidebar dimensions from layout context
    this.updateHeaderLayout(currentSidebarDimensions);
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log('AppHeader - Destroying...');
    
    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('AppHeader - Error unsubscribing from layout context:', error);
      }
    });
    this.layoutUnsubscribers = [];
    
    // Destroy user menu component
    if (this.userMenu) {
      this.userMenu.destroy();
      this.userMenu = null;
    }
    
    // Destroy sidebar component
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
    }
    
    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Remove event listeners and cleanup resources
    if (this.container) {
      this.container.remove();
    }
    
    this.container = null;
    this.user = null;
  }
}

export default AppHeader;

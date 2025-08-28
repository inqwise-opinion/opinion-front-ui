/**
 * App Header Component
 * Manages the application header, user menu, and related functionality
 */

import UserMenu, { User } from './UserMenu';
import SimpleMobileMenu from './SimpleMobileMenu';

export interface HeaderUser {
  username: string;
  email?: string;
  avatar?: string;
}

export class AppHeader {
  private container: HTMLElement | null = null;
  private user: HeaderUser | null = null;
  private userMenu: UserMenu | null = null;
  private mobileMenu: SimpleMobileMenu | null = null;

  /**
   * Initialize the header component
   */
  async init(): Promise<void> {
    console.log('AppHeader - Initializing...');
    
    try {
      // Create header if it doesn't exist
      this.createHeader();
      
      // Wait for DOM to be ready and elements to be available
      await this.waitForDOMReady();
      
      console.log(`AppHeader - Current viewport: ${window.innerWidth}px`);
      
      // Initialize user menu component (desktop only)
      await this.initUserMenu();
      
      // Initialize mobile menu component
      await this.initMobileMenu();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('AppHeader - Ready');
    } catch (error) {
      console.error('AppHeader - Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create the header HTML structure
   */
  private createHeader(): void {
    // Check if header already exists
    let existingHeader = document.querySelector('.app-header');
    if (existingHeader) {
      this.container = existingHeader as HTMLElement;
      return;
    }

    // Create header element
    const header = document.createElement('header');
    header.className = 'app-header';
    header.id = 'app_header';

    // Always include mobile toggle container for DOM consistency
    // CSS will handle visibility and sizing based on viewport
    
    header.innerHTML = `
      <div class="header-container">
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
      </div>
    `;

    // Insert header into page
    const body = document.body;
    const wrapper = body.querySelector('.wrapper-constructed .wrapper-content');
    if (wrapper) {
      wrapper.insertBefore(header, wrapper.firstChild);
    } else {
      // Fallback: insert after body opening
      body.insertBefore(header, body.firstChild);
    }

    this.container = header;
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
   * Initialize mobile menu component
   */
  private async initMobileMenu(): Promise<void> {
    this.mobileMenu = new SimpleMobileMenu();
    await this.mobileMenu.init();
    console.log('AppHeader - MobileMenu component initialized');
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
    
    // Handle window resize to update header structure
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Handle window resize events to update header styling
   */
  private handleResize(): void {
    const currentWidth = window.innerWidth;
    const headerCenter = this.container?.querySelector('.header-center') as HTMLElement;
    
    if (headerCenter) {
      // Apply mobile styles only on phone screens, desktop/tablet get no padding
      if (currentWidth <= 767) {
        headerCenter.style.cssText = 'padding-left: 16px;'; // Mobile padding for header-left space
      } else {
        headerCenter.style.cssText = 'padding-left: 0;'; // No padding on tablet/desktop
      }
      console.log(`AppHeader - Updated header-center styling for ${currentWidth}px viewport`);
    }
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
   * Get mobile menu instance for external access
   */
  getMobileMenu(): SimpleMobileMenu | null {
    return this.mobileMenu;
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
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log('AppHeader - Destroying...');
    
    // Destroy user menu component
    if (this.userMenu) {
      this.userMenu.destroy();
      this.userMenu = null;
    }
    
    // Destroy mobile menu component
    if (this.mobileMenu) {
      this.mobileMenu.destroy();
      this.mobileMenu = null;
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

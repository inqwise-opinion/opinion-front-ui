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
  init(): void {
    console.log('AppHeader - Initializing...');
    
    // Create header if it doesn't exist
    this.createHeader();
    
    // Add slight delay to ensure proper viewport detection and DOM readiness
    setTimeout(() => {
      console.log(`AppHeader - Current viewport: ${window.innerWidth}px`);
      
      // Initialize user menu component (desktop only)
      this.initUserMenu();
      
      // Initialize mobile menu component
      this.initMobileMenu();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('AppHeader - Ready');
    }, 100);
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
        <div class="header-center">
          <nav class="header-breadcrumbs" aria-label="Breadcrumb">
            <ol class="breadcrumb-list">
              <!-- Brand/App Title -->
              <li class="breadcrumb-item breadcrumb-brand">
                <a href="/dashboard" class="breadcrumb-brand-link">
                  <span class="brand-icon">🏢</span>
                  <span class="brand-text">Opinion</span>
                </a>
              </li>
              
              <!-- Separator -->
              <li class="breadcrumb-separator" aria-hidden="true">
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L4.5 5L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </li>
              
              <!-- Current Page -->
              <li class="breadcrumb-item breadcrumb-current" aria-current="page">
                <span class="breadcrumb-text" id="current_page_title">Dashboard</span>
              </li>
            </ol>
          </nav>
        </div>
        
        <!-- Right section: Enhanced actions and user menu -->
        <div class="header-right">
          <!-- Quick Actions -->
          <div class="header-actions">
            <button class="header-action-btn" id="search_toggle" title="Search" aria-label="Open Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.75 15.75L12.4875 12.4875" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            
            <button class="header-action-btn" id="notifications_toggle" title="Notifications" aria-label="View Notifications">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.75 15.75C6.75 16.9926 7.75736 18 9 18C10.2426 18 11.25 16.9926 11.25 15.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.25 12.75C2.25 12.75 3.75 12.75 3.75 9C3.75 6.51472 5.76472 4.5 8.25 4.5H9.75C12.2353 4.5 14.25 6.51472 14.25 9C14.25 12.75 15.75 12.75 15.75 12.75H2.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 2.25V3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
          </div>
          
          <!-- Divider -->
          <div class="header-divider"></div>
          
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
  private initUserMenu(): void {
    const userMenuContainer = document.getElementById('user_menu_container');
    if (userMenuContainer) {
      this.userMenu = new UserMenu(userMenuContainer);
      this.userMenu.init();
      console.log('AppHeader - UserMenu component initialized (responsive)');
    } else {
      console.warn('AppHeader - User menu container not found');
    }
  }

  /**
   * Initialize mobile menu component
   */
  private initMobileMenu(): void {
    this.mobileMenu = new SimpleMobileMenu();
    this.mobileMenu.init();
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
    
    // Handle header action buttons
    this.setupHeaderActionButtons();
  }
  
  
  /**
   * Setup header action button event listeners
   */
  private setupHeaderActionButtons(): void {
    const searchButton = document.getElementById('search_toggle');
    const notificationsButton = document.getElementById('notifications_toggle');
    
    if (searchButton) {
      searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSearchToggle();
      });
    }
    
    if (notificationsButton) {
      notificationsButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleNotificationsToggle();
      });
    }
  }
  
  /**
   * Handle search toggle action
   */
  private handleSearchToggle(): void {
    console.log('AppHeader - Search toggle clicked');
    
    // Placeholder for search functionality
    // In a real implementation, this would open a search modal or focus a search input
    const message = 'Search functionality would be implemented here.\n\n' +
                   'This could open a search modal, focus a search input field, or ' +
                   'navigate to a dedicated search page.';
    
    alert(message);
  }
  
  /**
   * Handle notifications toggle action
   */
  private handleNotificationsToggle(): void {
    console.log('AppHeader - Notifications toggle clicked');
    
    // Placeholder for notifications functionality
    // In a real implementation, this would open a notifications dropdown or panel
    const message = 'Notifications panel would open here.\n\n' +
                   'This could show a dropdown with recent notifications, ' +
                   'mark them as read, or navigate to a notifications page.\n\n' +
                   'Current notifications: 3';
    
    alert(message);
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
    
    setTimeout(() => {
      console.log('✅ AppHeader - Loading complete, updating user...');
      this.updateUser(randomUser);
      console.log('🎉 AppHeader - User updated successfully!');
    }, 1500);
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

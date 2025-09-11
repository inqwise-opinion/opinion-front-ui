/**
 * Dashboard Page Component
 * 
 * Handles all UI interactions and behaviors specific to the dashboard page:
 * - Sidebar management (toggle, compact mode, responsive behavior)
 * - User menu dropdown functionality
 * - Copyright text positioning
 * - Navigation state management
 * - Keyboard navigation and accessibility
 * - Mobile/desktop responsive behaviors
 */

import { PageComponent, PageComponentConfig } from '../components/PageComponent';
import Layout from '../components/Layout';

export interface DashboardPageConfig extends PageComponentConfig {
  layout?: Layout;
  enableCompactMode?: boolean;
  enableResponsive?: boolean;
}

export class DashboardPageComponent extends PageComponent {
  private layout: Layout | null = null;
  private compactMode: boolean = false;
  private isMobileView: boolean = false;
  private resizeTimeout: NodeJS.Timeout | null = null;

  // UI Elements
  private sidebar: HTMLElement | null = null;
  private sidebarToggle: HTMLElement | null = null;
  private compactToggle: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private userMenuTrigger: HTMLElement | null = null;
  private userMenuDropdown: HTMLElement | null = null;
  private copyrightText: HTMLElement | null = null;

  constructor(config: DashboardPageConfig = {}) {
    super({
      pageTitle: 'Dashboard - Opinion',
      autoInit: false, // We'll initialize manually to control timing
      ...config
    });

    this.layout = config.layout || null;
  }

  /**
   * Initialize dashboard-specific functionality
   */
  protected async onInit(): Promise<void> {
    // Cache DOM elements
    this.cacheElements();
    
    // Initialize layout if provided
    if (this.layout) {
      await this.layout.init();
    }
    
    // Initialize responsive behavior
    this.initializeResponsive();
    
    // Initialize copyright positioning
    this.initializeCopyrightPositioning();
    
    // Set initial states
    this.updateNavigationState();
    
    console.log('DashboardPageComponent: Initialized');
  }

  /**
   * Post-initialization hook
   */
  protected async onPostInit(): Promise<void> {
    // Load initial data
    await this.loadUserData();
    await this.loadSurveyData();
    
    // Trigger initial responsive check
    this.handleResize();
  }

  /**
   * Set up dashboard-specific event listeners
   */
  protected setupEventListeners(): void {
    // Set up event delegation for data-action attributes
    this.setupEventDelegation();
    
    // Sidebar toggle events
    if (this.sidebarToggle) {
      this.addEventListener(this.sidebarToggle, 'click', () => this.toggleSidebar());
    }
    
    // Compact toggle events  
    if (this.compactToggle) {
      this.addEventListener(this.compactToggle, 'click', () => this.toggleCompactMode());
    }
    
    // User menu events
    if (this.userMenuTrigger) {
      this.addEventListener(this.userMenuTrigger, 'click', (e) => this.toggleUserMenu(e));
    }
    
    // Overlay click to close sidebar
    if (this.overlay) {
      this.addEventListener(this.overlay, 'click', () => this.closeSidebarOverlay());
    }
    
    // Responsive behavior is now handled by LayoutContext centrally
    // this.addEventListener(window, 'resize', () => this.debounceResize());
    
    // Close user menu when clicking outside
    this.addEventListener(document, 'click', (e) => this.handleDocumentClick(e));
  }

  /**
   * Handle keyboard shortcuts - now managed by HotkeyProvider
   * Only keeping base class behavior
   */
  protected handleKeydown(event: KeyboardEvent): void {
    super.handleKeydown(event);
    // Dashboard-specific shortcuts now handled via getPageHotkeys()
  }

  /**
   * Handle Escape key - now managed by HotkeyProvider
   * Only keeping base class behavior
   */
  protected handleEscape(event: KeyboardEvent): void {
    super.handleEscape(event);
    // Dashboard-specific Escape behavior now handled via getPageHotkeys()
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    this.sidebar = this.getElement('#app_sidebar', false) as HTMLElement;
    this.sidebarToggle = this.getElement('#sidebar_toggle', false) as HTMLElement;
    this.compactToggle = this.getElement('#sidebar_compact_toggle', false) as HTMLElement;
    this.overlay = this.getElement('#sidebar_overlay', false) as HTMLElement;
    this.userMenuTrigger = this.getElement('#user_menu_trigger', false) as HTMLElement;
    this.userMenuDropdown = this.getElement('#user_menu_dropdown', false) as HTMLElement;
    this.copyrightText = this.getElement('.copyright-text', false) as HTMLElement;
  }

  /**
   * Toggle sidebar visibility
   */
  private toggleSidebar(): void {
    if (this.isMobileView) {
      this.toggleMobileSidebar();
    } else {
      this.toggleDesktopSidebar();
    }
  }

  /**
   * Toggle mobile sidebar (overlay mode)
   */
  private toggleMobileSidebar(): void {
    const isOpen = document.body.classList.contains('sidebar-open');
    
    if (isOpen) {
      this.closeSidebarOverlay();
    } else {
      document.body.classList.add('sidebar-open');
      document.body.classList.remove('sidebar-closed');
      this.overlay?.classList.add('active');
    }
  }

  /**
   * Toggle desktop sidebar (collapse mode)
   */
  private toggleDesktopSidebar(): void {
    if (!this.sidebar) return;
    
    const isCollapsed = this.sidebar.classList.contains('sidebar-collapsed');
    
    if (isCollapsed) {
      this.sidebar.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-closed');
    } else {
      this.sidebar.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-closed');
    }
  }

  /**
   * Close sidebar overlay (mobile)
   */
  private closeSidebarOverlay(): void {
    document.body.classList.remove('sidebar-open');
    document.body.classList.add('sidebar-closed');
    this.overlay?.classList.remove('active');
  }

  /**
   * Toggle compact mode
   */
  private toggleCompactMode(): void {
    if (!this.sidebar) return;
    
    this.compactMode = !this.compactMode;
    this.sidebar.classList.toggle('sidebar-compact', this.compactMode);
    
    // Update body data attribute for CSS selectors
    if (this.compactMode) {
      document.body.setAttribute('data-sidebar-state', 'compact');
    } else {
      document.body.removeAttribute('data-sidebar-state');
    }
    
    // Footer layout is now handled automatically by the layout context
    // No manual footer updates needed - CSS Grid handles responsive layout
    
    // Update copyright positioning
    this.updateCopyrightPosition();
    
    console.log('Compact mode:', this.compactMode ? 'ON' : 'OFF');
  }

  /**
   * Toggle user menu dropdown
   */
  private toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.userMenuDropdown || !this.userMenuTrigger) return;
    
    const isVisible = this.userMenuDropdown.style.display === 'block';
    
    if (isVisible) {
      this.closeUserMenu();
    } else {
      this.openUserMenu();
    }
  }

  /**
   * Open user menu
   */
  private openUserMenu(): void {
    if (!this.userMenuDropdown || !this.userMenuTrigger) return;
    
    this.userMenuDropdown.style.display = 'block';
    this.userMenuDropdown.classList.add('show');
    this.userMenuDropdown.classList.remove('hide');
    this.userMenuTrigger.classList.add('active');
  }

  /**
   * Close user menu
   */
  private closeUserMenu(): void {
    if (!this.userMenuDropdown || !this.userMenuTrigger) return;
    
    this.userMenuDropdown.style.display = 'none';
    this.userMenuDropdown.classList.remove('show');
    this.userMenuDropdown.classList.add('hide');
    this.userMenuTrigger.classList.remove('active');
  }

  /**
   * Handle document clicks (close user menu when clicking outside)
   */
  private handleDocumentClick(event: Event): void {
    const target = event.target as Element;
    
    if (this.userMenuDropdown && this.userMenuTrigger &&
        !this.userMenuTrigger.contains(target) &&
        !this.userMenuDropdown.contains(target)) {
      this.closeUserMenu();
    }
  }

  /**
   * Initialize responsive behavior
   */
  private initializeResponsive(): void {
    this.updateResponsiveState();
  }

  /**
   * Handle window resize with debouncing
   */
  private debounceResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 100);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.updateResponsiveState();
    this.updateCopyrightPosition();
  }

  /**
   * Update responsive state
   */
  private updateResponsiveState(): void {
    const wasMobile = this.isMobileView;
    this.isMobileView = window.innerWidth <= 1024;
    
    if (wasMobile !== this.isMobileView) {
      this.handleResponsiveChange();
    }
  }

  /**
   * Handle responsive state change
   */
  private handleResponsiveChange(): void {
    if (this.isMobileView) {
      // Switching to mobile
      this.sidebar?.classList.add('sidebar-collapsed');
      this.closeSidebarOverlay();
    } else {
      // Switching to desktop
      this.sidebar?.classList.remove('sidebar-collapsed');
      this.overlay?.classList.remove('active');
      document.body.classList.remove('sidebar-open', 'sidebar-closed');
    }
  }

  /**
   * Initialize copyright text positioning
   */
  private initializeCopyrightPositioning(): void {
    this.updateCopyrightPosition();
  }

  /**
   * Update copyright text position based on compact/mobile state
   */
  private updateCopyrightPosition(): void {
    if (!this.copyrightText) return;
    
    if (this.compactMode || this.isMobileView) {
      // Move copyright to main footer
      const mainFooter = document.querySelector('.wrapper-footer .footer-copyright-section');
      if (mainFooter) {
        this.copyrightText.style.display = 'block';
        // You might want to move the element or show/hide different copies
      }
    } else {
      // Keep copyright in sidebar
      this.copyrightText.style.display = 'block';
    }
  }

  /**
   * Update navigation active state
   */
  private updateNavigationState(): void {
    const currentPath = window.location.pathname;
    const navLinks = this.getElements('.nav-link, .nav-sublink');
    
    navLinks.forEach(link => {
      const linkPath = (link as HTMLElement).getAttribute('href');
      if (linkPath === currentPath) {
        link.classList.add('nav-link-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('nav-link-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Load user data (mock implementation)
   */
  private async loadUserData(): Promise<void> {
    // Mock user data loading
    const usernameElements = this.getElements('#label_username, #user_menu_name');
    usernameElements.forEach(el => {
      (el as HTMLElement).textContent = 'Demo User';
    });
  }

  /**
   * Load survey data (mock implementation)
   */
  private async loadSurveyData(): Promise<void> {
    // Mock survey data loading
    const surveyCountElement = this.getElement('#total_surveys_count', false);
    if (surveyCountElement) {
      (surveyCountElement as HTMLElement).textContent = '5';
    }
    
    // Initialize date range
    const dateRangeValue = this.getElement('#datepicker_date_range_value', false);
    if (dateRangeValue) {
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      (dateRangeValue as HTMLElement).textContent = today;
    }
  }

  /**
   * Handle data-action events
   */
  protected handleFeedback(element: Element, event: Event): void {
    const message = 'Thank you for your interest in providing feedback!\n\n' +
                   'This would typically open a feedback form or modal dialog ' +
                   'where you could submit your comments and suggestions.';
    
    if (confirm(message + '\n\nWould you like to be redirected to our feedback page?')) {
      console.log('Redirecting to feedback page...');
      // In a real implementation, this would redirect to the actual feedback page
    }
  }

  /**
   * Clear timers
   */
  protected clearTimers(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  /**
   * Cleanup dashboard-specific functionality
   */
  protected onDestroy(): void {
    // Clear timers
    this.clearTimers();
    
    // Reset DOM states
    document.body.classList.remove('sidebar-open', 'sidebar-closed');
    this.overlay?.classList.remove('active');
    
    // Cleanup layout
    if (this.layout) {
      this.layout.destroy();
    }
    
    console.log('DashboardPageComponent: Destroyed');
  }

  // Public API

  /**
   * Get current sidebar state
   */
  public get sidebarState(): { compact: boolean, collapsed: boolean, mobile: boolean } {
    return {
      compact: this.compactMode,
      collapsed: this.sidebar?.classList.contains('sidebar-collapsed') || false,
      mobile: this.isMobileView
    };
  }

  /**
   * Programmatically set compact mode
   */
  public setCompactMode(enabled: boolean): void {
    if (this.compactMode !== enabled) {
      this.toggleCompactMode();
    }
  }

  /**
   * Get layout instance
   */
  public getLayout(): Layout | null {
    return this.layout;
  }
  
  // =================================================================================
  // HotkeyProvider Implementation (Override PageComponent defaults)
  // =================================================================================
  
  /**
   * Override to provide dashboard-specific hotkeys
   */
  getPageHotkeys(): Map<string, (event: KeyboardEvent) => void | boolean> {
    const hotkeys = new Map();
    
    // Dashboard-specific hotkeys
    hotkeys.set('Ctrl+s', (event: KeyboardEvent) => {
      console.log('Dashboard: Ctrl+S pressed - Toggle sidebar');
      event.preventDefault();
      this.toggleSidebar();
      return false; // prevent default & stop propagation
    });
    
    hotkeys.set('Meta+s', (event: KeyboardEvent) => {
      // Mac Cmd+S
      console.log('Dashboard: Cmd+S pressed - Toggle sidebar');
      event.preventDefault();
      this.toggleSidebar();
      return false;
    });
    
    hotkeys.set('Ctrl+c', (event: KeyboardEvent) => {
      console.log('Dashboard: Ctrl+C pressed - Toggle compact mode');
      event.preventDefault();
      this.toggleCompactMode();
      return false;
    });
    
    hotkeys.set('Meta+c', (event: KeyboardEvent) => {
      // Mac Cmd+C
      console.log('Dashboard: Cmd+C pressed - Toggle compact mode');
      event.preventDefault();
      this.toggleCompactMode();
      return false;
    });
    
    hotkeys.set('Escape', (event: KeyboardEvent) => {
      console.log('Dashboard: Escape pressed - Close mobile menus');
      // Dashboard-specific escape behavior
      this.handleDashboardEscape(event);
      // Don't return false - let other Escape handlers also run
    });
    
    return hotkeys;
  }
  
  /**
   * Component identifier for hotkey management
   */
  getHotkeyComponentId(): string {
    return 'DashboardPage';
  }
  
  /**
   * Handle dashboard-specific Escape key behavior
   */
  private handleDashboardEscape(event: KeyboardEvent): void {
    // Close user menu if open
    if (this.userMenuDropdown?.style.display === 'block') {
      this.closeUserMenu();
    }
    
    // Close sidebar on mobile if open
    if (this.isMobileView && !document.body.classList.contains('sidebar-closed')) {
      this.closeSidebarOverlay();
    }
  }
}

export default DashboardPageComponent;

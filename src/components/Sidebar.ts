/**
 * Sidebar Component - Clean CSS Grid Integration
 * Basic sidebar functionality with clean layout integration
 */

// Import component-scoped CSS
import '../assets/styles/components/sidebar.css';
// Import layout context
import LayoutContext from '../contexts/LayoutContext.js';

export interface NavigationItem {
  id: string;
  text: string;
  icon: string;
  href: string;
  caption?: string; // Optional caption/description for menu items
  badge?: string;
  active?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  children?: NavigationItem[];
}

export class Sidebar {
  private sidebar: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private navigationItems: NavigationItem[] = [];
  private compactMode: boolean = false;
  private compactModeListeners: Array<(isCompact: boolean) => void> = [];
  private layoutContext: LayoutContext;
  private responsiveUnsubscribers: Array<() => void> = [];

  constructor() {
    console.log('Sidebar - Creating basic sidebar...');
    this.layoutContext = LayoutContext.getInstance();
    this.setupDefaultNavigation();
  }

  /**
   * Initialize the sidebar
   */
  init(): void {
    console.log('Sidebar - Initializing...');
    
    if (this.isInitialized) {
      console.warn('Sidebar - Already initialized');
      return;
    }

    // Create the sidebar structure
    this.createSidebar();
    
    // Setup basic event listeners
    this.setupEventListeners();
    
    // Setup responsive mode subscriptions
    this.setupResponsiveSubscriptions();
    
    // Initialize based on current responsive mode (no events, just read state)
    this.initializeFromResponsiveMode();
    
    // Initialize layout context with current sidebar dimensions (silent - no events during init)
    this.publishDimensionsToContext(false);
    
    this.isInitialized = true;
    console.log('Sidebar - Ready ✅');
  }

  /**
   * Setup default navigation items with captions
   */
  private setupDefaultNavigation(): void {
    this.navigationItems = [
      {
        id: 'dashboard',
        text: 'Dashboard',
        icon: 'dashboard',
        href: '/dashboard',
        caption: 'View analytics, reports and key metrics',
        active: false
      },
      {
        id: 'surveys',
        text: 'Surveys',
        icon: 'poll',
        href: '/surveys',
        caption: 'Create and manage survey questionnaires'
      },
      {
        id: 'debug',
        text: 'Debug',
        icon: 'bug_report',
        href: '/',
        caption: 'Development tools and troubleshooting',
        active: true  // Debug is active since root path shows DebugPage
      }
    ];
  }

  /**
   * Use existing sidebar element and populate content
   */
  private createSidebar(): void {
    // Find existing sidebar element
    this.sidebar = document.getElementById('app-sidebar');
    
    if (!this.sidebar) {
      throw new Error('Sidebar: Could not find existing #app-sidebar element');
    }
    
    console.log('Sidebar - Using existing element');
    
    // Populate the existing structure with dynamic content
    this.populateContent();
    
    console.log('Sidebar - Content populated successfully');
  }
  
  /**
   * Populate sidebar content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.sidebar) return;
    
    // Update brand title link and add compact toggle button
    const sidebarHeader = this.sidebar.querySelector('.sidebar-header');
    if (sidebarHeader) {
      sidebarHeader.innerHTML = `
        <div class="sidebar-brand">
          <a href="/dashboard" class="brand-title-link">
            <h1 class="brand-title">Opinion</h1>
          </a>
        </div>
        <div class="sidebar-controls">
          <button class="compact-toggle-btn" 
                  type="button" 
                  title="${this.compactMode ? 'Expand sidebar' : 'Compact sidebar'}"
                  aria-label="${this.compactMode ? 'Expand sidebar' : 'Compact sidebar'}"
                  data-compact="${this.compactMode}">
            <span class="material-icons compact-icon">
              ${this.compactMode ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        </div>
      `;
    }
    
    // Populate navigation
    const navigationContainer = this.sidebar.querySelector('.sidebar-navigation');
    if (navigationContainer) {
      navigationContainer.innerHTML = `
        <ul class="nav-list" role="menubar">
          ${this.renderNavigationItems(this.navigationItems)}
        </ul>
      `;
    }
    
    // Populate footer
    const footerContainer = this.sidebar.querySelector('.sidebar-footer');
    if (footerContainer) {
      footerContainer.innerHTML = `
        <p class="copyright-text">&copy; 2024 Opinion</p>
      `;
    }
  }

  /**
   * Render navigation items HTML
   */
  private renderNavigationItems(items: NavigationItem[]): string {
    return items.map(item => {
      const isActive = item.active ? 'nav-link-active' : '';
      const ariaCurrent = item.active ? 'aria-current="page"' : '';
      const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
      
      if (item.expandable && item.children) {
        // Create expandable item title with caption if available
        const expandableTitle = item.caption ? `${item.text} - ${item.caption}` : item.text;
        
        return `
          <li class="nav-item nav-item-expandable">
            <button class="nav-link nav-link-expandable ${isActive}" 
                    data-nav-id="${item.id}"
                    data-expandable="true"
                    aria-expanded="${item.expanded ? 'true' : 'false'}"
                    role="menuitem"
                    tabindex="0"
                    title="${expandableTitle}">
              <span class="nav-icon material-icons" data-icon="${item.icon}">${item.icon}</span>
              <span class="nav-text">${item.text}</span>
              ${badge}
              <span class="nav-arrow material-icons">expand_more</span>
            </button>
            <ul class="nav-submenu" aria-expanded="${item.expanded ? 'true' : 'false'}" role="menu">
              ${item.children.map(child => {
                const childTitle = child.caption ? `${child.text} - ${child.caption}` : child.text;
                return `
                  <li class="nav-subitem">
                    <a class="nav-sublink ${child.active ? 'nav-sublink-active' : ''}" 
                       href="${child.href}"
                       data-nav-id="${child.id}"
                       role="menuitem"
                       title="${childTitle}"
                       ${child.active ? 'aria-current="page"' : ''}>
                      <span class="nav-subicon material-icons">${child.icon}</span>
                      <span class="nav-subtext">${child.text}</span>
                    </a>
                  </li>
                `;
              }).join('')}
            </ul>
          </li>
        `;
      } else {
        const captionHtml = item.caption ? `<span class="nav-caption">${item.caption}</span>` : '';
        
        // Create tooltip content - show caption if available, otherwise just title
        const tooltipContent = item.caption ? `${item.text} - ${item.caption}` : item.text;
        // Create title attribute content (for native tooltips)
        const titleContent = item.caption ? `${item.text} - ${item.caption}` : item.text;
        
        return `
          <li class="nav-item">
            <a class="nav-link ${isActive}" 
               href="${item.href}"
               data-nav-id="${item.id}"
               data-title="${item.text}"
               data-tooltip="${tooltipContent}"
               title="${titleContent}"
               role="menuitem"
               ${ariaCurrent}
               tabindex="0">
              <span class="nav-icon material-icons" data-icon="${item.icon}">${item.icon}</span>
              <div class="nav-content">
                <span class="nav-text">${item.text}</span>
                ${captionHtml}
              </div>
              ${badge}
            </a>
          </li>
        `;
      }
    }).join('');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.sidebar) return;

    // Handle expandable navigation items
    this.sidebar.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const expandableButton = target.closest('[data-expandable="true"]') as HTMLElement;
      
      if (expandableButton) {
        event.preventDefault();
        this.toggleExpandable(expandableButton);
      }
    });


    // Handle compact toggle button clicks
    this.sidebar.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const toggleButton = target.closest('.compact-toggle-btn') as HTMLButtonElement;
      
      if (toggleButton) {
        event.preventDefault();
        event.stopPropagation();
        
        // Check if sidebar is locked in expanded mode
        if (this.isLocked() && !this.compactMode) {
          console.log('Sidebar - Toggle blocked: sidebar is locked in expanded mode');
          return;
        }
        
        this.toggleCompactMode();
        return;
      }
    });

    // Handle navigation clicks for SPA routing
    this.sidebar.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const navLink = target.closest('a[href]') as HTMLAnchorElement;
      
      if (navLink && navLink.href.startsWith(window.location.origin)) {
        // This is an internal link - could be handled by SPA router
        console.log('Sidebar - Navigation clicked:', navLink.href);
        this.setActiveItem(navLink.getAttribute('data-nav-id') || '');
      }
    });
  }

  /**
   * Toggle expandable navigation item
   */
  private toggleExpandable(button: HTMLElement): void {
    const navId = button.getAttribute('data-nav-id');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const submenu = button.nextElementSibling as HTMLElement;

    if (submenu) {
      button.setAttribute('aria-expanded', (!isExpanded).toString());
      submenu.setAttribute('aria-expanded', (!isExpanded).toString());

      // Update the navigation item state
      const navItem = this.navigationItems.find(item => item.id === navId);
      if (navItem) {
        navItem.expanded = !isExpanded;
      }

      console.log(`Sidebar - Toggled ${navId} expandable: ${!isExpanded}`);
    }
  }


  /**
   * Set active navigation item
   */
  private setActiveItem(navId: string): void {
    if (!this.sidebar) return;

    // Remove all active classes
    this.sidebar.querySelectorAll('.nav-link-active, .nav-sublink-active').forEach(el => {
      el.classList.remove('nav-link-active', 'nav-sublink-active');
      el.removeAttribute('aria-current');
    });

    // Find and activate the clicked item
    const targetLink = this.sidebar.querySelector(`[data-nav-id="${navId}"]`);
    if (targetLink) {
      if (targetLink.classList.contains('nav-link')) {
        targetLink.classList.add('nav-link-active');
        targetLink.setAttribute('aria-current', 'page');
      } else if (targetLink.classList.contains('nav-sublink')) {
        targetLink.classList.add('nav-sublink-active');
        targetLink.setAttribute('aria-current', 'page');
      }

      // Update navigation state
      this.navigationItems.forEach(item => {
        item.active = item.id === navId;
        if (item.children) {
          item.children.forEach(child => {
            child.active = child.id === navId;
          });
        }
      });

      console.log(`Sidebar - Set active item: ${navId}`);
    }
  }

  /**
   * Update navigation items
   */
  public updateNavigation(items: NavigationItem[]): void {
    this.navigationItems = items;
    
    if (this.sidebar && this.isInitialized) {
      const navList = this.sidebar.querySelector('.nav-list');
      if (navList) {
        navList.innerHTML = this.renderNavigationItems(this.navigationItems);
        console.log('Sidebar - Navigation updated');
      }
    }
  }

  /**
   * Set active page programmatically
   */
  public setActivePage(navId: string): void {
    this.setActiveItem(navId);
  }

  /**
   * Get sidebar element
   */
  public getElement(): HTMLElement | null {
    return this.sidebar;
  }

  /**
   * Check if sidebar is in compact mode
   */
  public isCompactMode(): boolean {
    return this.compactMode;
  }

  /**
   * Set compact mode state
   */
  public setCompactMode(compact: boolean): void {
    if (this.compactMode !== compact) {
      // Log the dimension change start
      const previousDimensions = this.getCurrentDimensions();
      console.log(`🔄 Sidebar - Compact mode changing: ${this.compactMode ? 'compact' : 'expanded'} → ${compact ? 'compact' : 'expanded'}`);
      
      this.compactMode = compact;
      
      // Update sidebar CSS class
      if (this.sidebar) {
        if (compact) {
          this.sidebar.classList.add('sidebar-compact');
        } else {
          this.sidebar.classList.remove('sidebar-compact');
        }
      }
      
      // Update app layout for grid adjustments
      const appLayout = document.querySelector('.app-layout');
      if (appLayout) {
        if (compact) {
          appLayout.classList.add('sidebar-compact');
        } else {
          appLayout.classList.remove('sidebar-compact');
        }
      }
      
      // Update toggle button
      this.updateCompactToggleButton();
      
      // Log dimension changes after DOM updates
      this.logDimensionChange(previousDimensions, compact);
      
      // Notify listeners (DEPRECATED - direct callbacks)
      console.log(`🔔 Sidebar - Firing direct compact mode callbacks to ${this.compactModeListeners.length} listeners`);
      this.notifyCompactModeChange(compact);
      
      // Publish dimension changes to layout context (CURRENT - event system)
      console.log(`📡 Sidebar - Publishing to LayoutContext event system`);
      // Publish expected dimensions immediately for responsive layout
      this.publishExpectedDimensions();
      
      console.log(`✅ Sidebar - Compact mode ${compact ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Subscribe to compact mode changes
   */
  public onCompactModeChange(callback: (isCompact: boolean) => void): () => void {
    this.compactModeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.compactModeListeners.indexOf(callback);
      if (index > -1) {
        this.compactModeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of compact mode changes
   */
  private notifyCompactModeChange(isCompact: boolean): void {
    this.compactModeListeners.forEach(listener => {
      try {
        listener(isCompact);
      } catch (error) {
        console.error('Sidebar - Error in compact mode listener:', error);
      }
    });
  }

  /**
   * Toggle compact mode
   */
  public toggleCompactMode(): void {
    this.setCompactMode(!this.compactMode);
  }

  /**
   * Expand sidebar (ensure it's not in compact mode)
   */
  public expandSidebar(): void {
    if (this.compactMode) {
      this.setCompactMode(false);
      console.log('Sidebar - Expanded to full width');
    } else {
      console.log('Sidebar - Already expanded');
    }
  }

  /**
   * Compact sidebar (ensure it's in compact mode)
   */
  public compactSidebar(): void {
    if (!this.compactMode) {
      this.setCompactMode(true);
      console.log('Sidebar - Compacted to narrow width');
    } else {
      console.log('Sidebar - Already compact');
    }
  }

  /**
   * Lock sidebar in expanded mode (prevents auto-compact)
   * This is useful when you want to ensure sidebar stays expanded
   */
  public lockExpanded(): void {
    this.expandSidebar();
    // Add a data attribute to indicate locked state
    if (this.sidebar) {
      this.sidebar.setAttribute('data-locked-expanded', 'true');
      console.log('Sidebar - Locked in expanded mode');
    }
  }

  /**
   * Unlock sidebar (allows normal compact/expand behavior)
   */
  public unlockSidebar(): void {
    if (this.sidebar) {
      this.sidebar.removeAttribute('data-locked-expanded');
      console.log('Sidebar - Unlocked, normal toggle behavior restored');
    }
  }

  /**
   * Check if sidebar is locked in expanded mode
   */
  public isLocked(): boolean {
    return this.sidebar?.hasAttribute('data-locked-expanded') ?? false;
  }

  /**
   * Log detailed dimension changes when compact mode changes
   */
  private logDimensionChange(previousDimensions: any, newCompactMode: boolean): void {
    if (!this.sidebar) return;
    
    // Get new dimensions after DOM update
    const currentDimensions = this.getCurrentDimensions();
    
    if (!previousDimensions || !currentDimensions) {
      console.log('📐 Sidebar - Unable to calculate dimension changes (null dimensions)');
      return;
    }
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768
    };
    
    // Calculate changes
    const widthChange = currentDimensions.width - (previousDimensions.width || 0);
    const rightBorderChange = currentDimensions.rightBorder - (previousDimensions.rightBorder || 0);
    
    console.log('📐 Sidebar - Dimension Changes:');
    console.log(`   Mode: ${previousDimensions.isCompact ? 'Compact' : 'Expanded'} → ${newCompactMode ? 'Compact' : 'Expanded'}`);
    console.log(`   Width: ${previousDimensions.width}px → ${currentDimensions.width}px (${widthChange >= 0 ? '+' : ''}${widthChange}px)`);
    console.log(`   Right Border: ${previousDimensions.rightBorder}px → ${currentDimensions.rightBorder}px (${rightBorderChange >= 0 ? '+' : ''}${rightBorderChange}px)`);
    console.log(`   Viewport: ${viewport.width}x${viewport.height} (${viewport.isMobile ? 'Mobile' : 'Desktop'})`);
    console.log(`   Visible: ${previousDimensions.isVisible} → ${currentDimensions.isVisible}`);
    
    // Calculate space impact
    const contentAreaWidthChange = -widthChange; // Content area changes opposite to sidebar
    if (contentAreaWidthChange !== 0) {
      console.log(`   📊 Content Area Impact: ${contentAreaWidthChange >= 0 ? '+' : ''}${contentAreaWidthChange}px ${contentAreaWidthChange > 0 ? 'more' : 'less'} space`);
    }
    
    // Log performance metrics if transition is animated
    if (widthChange !== 0) {
      console.log(`   ⚡ Transition: ${Math.abs(widthChange)}px change with CSS animation`);
    }
    
    // Log grid layout impact
    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
      const hasCompactClass = appLayout.classList.contains('sidebar-compact');
      console.log(`   🎯 Layout Grid: ${hasCompactClass ? 'Compact' : 'Standard'} mode applied`);
    }
    
    // Log if this affects other components
    if (!viewport.isMobile) {
      console.log(`   🔄 Layout Context: Publishing dimensions to ${this.compactModeListeners.length} listeners`);
    }
    
    console.log('📐 Sidebar - Dimension change complete\n');
  }

  /**
   * Update the compact toggle button appearance
   */
  private updateCompactToggleButton(): void {
    if (!this.sidebar) return;
    
    const toggleButton = this.sidebar.querySelector('.compact-toggle-btn') as HTMLButtonElement;
    const toggleIcon = this.sidebar.querySelector('.compact-icon') as HTMLElement;
    
    if (toggleButton && toggleIcon) {
      // Update button attributes
      toggleButton.setAttribute('data-compact', this.compactMode.toString());
      toggleButton.setAttribute('title', this.compactMode ? 'Expand sidebar' : 'Compact sidebar');
      toggleButton.setAttribute('aria-label', this.compactMode ? 'Expand sidebar' : 'Compact sidebar');
      
      // Update icon
      toggleIcon.textContent = this.compactMode ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';
      
      console.log(`Sidebar - Toggle button updated for ${this.compactMode ? 'compact' : 'normal'} mode`);
    }
  }

  /**
   * Publish dimensions to layout context with optional silent mode for initialization
   */
  private publishDimensionsToContext(emitEvents: boolean = true): void {
    if (emitEvents) {
      // Normal mode - emit events to other components
      this.publishCurrentDimensions();
    } else {
      // Silent mode - just update context state without events (for initialization)
      this.updateContextStateOnly();
    }
  }

  /**
   * Update layout context state only (no events) - used during initialization
   */
  private updateContextStateOnly(): void {
    if (!this.sidebar) return;

    const responsiveMode = this.layoutContext.getResponsiveMode();
    let width = 0;
    let rightBorder = 0;
    
    // Use responsive mode to determine if sidebar should be visible
    if (responsiveMode.sidebarBehavior.isVisible) {
      const compactWidth = responsiveMode.sidebarBehavior.compactWidth;
      const defaultWidth = responsiveMode.sidebarBehavior.defaultWidth;
      width = this.compactMode ? compactWidth : defaultWidth;
      rightBorder = width;
    }

    const dimensions = {
      width,
      rightBorder,
      isCompact: this.compactMode,
      isMobile: responsiveMode.isMobile,
      isVisible: responsiveMode.sidebarBehavior.isVisible
    };

    console.log('🔇 Sidebar - Silent initialization: updating context state without events');
    console.log(`   Width: ${dimensions.width}px, Visible: ${dimensions.isVisible}, Mode: ${dimensions.isCompact ? 'Compact' : 'Expanded'}`);
    
    // Update context state directly without triggering events
    this.layoutContext.updateSidebarDimensions(dimensions);
  }

  /**
   * Publish current dimensions to layout context
   */
  private publishCurrentDimensions(): void {
    if (!this.sidebar) return;

    const responsiveMode = this.layoutContext.getResponsiveMode();
    const rect = this.sidebar.getBoundingClientRect();
    
    // Calculate expected dimensions based on responsive mode and current state
    let width = 0;
    let rightBorder = 0;
    
    if (responsiveMode.sidebarBehavior.isVisible) {
      // Use responsive mode dimensions - handles tablet/desktop differences
      const compactWidth = responsiveMode.sidebarBehavior.compactWidth;
      const defaultWidth = responsiveMode.sidebarBehavior.defaultWidth;
      const expectedWidth = this.compactMode ? compactWidth : defaultWidth;
      width = expectedWidth;
      rightBorder = width; // For left-aligned sidebar, right border = width
      
      // Only use DOM measurements if they seem reasonable and match expected state
      if (rect.width > 0) {
        const tolerance = 20; // Allow some tolerance for CSS transitions
        
        // If DOM width is close to expected width, use it. Otherwise stick with calculated.
        if (Math.abs(rect.width - expectedWidth) <= tolerance) {
          width = Math.round(rect.width);
          rightBorder = rect.left === 0 ? width : Math.round(rect.right);
          console.log(`   📍 Using DOM measurements: ${width}px (matches expected ${expectedWidth}px)`);
        } else {
          console.log(`   🧮 Using calculated dimensions: DOM shows ${rect.width.toFixed(1)}px but expected ${expectedWidth}px (${responsiveMode.type} mode)`);
        }
      }
    }

    const dimensions = {
      width,
      rightBorder,
      isCompact: this.compactMode,
      isMobile: responsiveMode.isMobile,
      isVisible: responsiveMode.sidebarBehavior.isVisible
    };

    console.log('📡 Sidebar - Publishing dimensions to layout context:');
    console.log(`   Width: ${dimensions.width}px`);
    console.log(`   Right Border: ${dimensions.rightBorder}px`);
    console.log(`   Mode: ${dimensions.isCompact ? 'Compact' : 'Expanded'}`);
    console.log(`   Responsive Mode: ${responsiveMode.type}`);
    console.log(`   Visible: ${dimensions.isVisible}`);
    console.log(`   Actual DOM Rect: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)} at (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)})`);
    
    this.layoutContext.updateSidebarDimensions(dimensions);
  }

  /**
   * Publish expected dimensions immediately based on current state
   * This provides instant layout response without waiting for CSS transitions
   */
  private publishExpectedDimensions(): void {
    const responsiveMode = this.layoutContext.getResponsiveMode();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: responsiveMode.isMobile
    };
    
    // Calculate expected dimensions based on current state (not DOM measurements)
    let width = 0;
    let rightBorder = 0;
    
    // Use responsive mode to determine if sidebar should be visible
    if (responsiveMode.sidebarBehavior.isVisible) {
      // Use responsive mode dimensions - tablet and desktop both get sidebar
      const compactWidth = responsiveMode.sidebarBehavior.compactWidth;
      const defaultWidth = responsiveMode.sidebarBehavior.defaultWidth;
      width = this.compactMode ? compactWidth : defaultWidth;
      rightBorder = width; // For left-aligned sidebar, right border = width
    }

    const dimensions = {
      width,
      rightBorder,
      isCompact: this.compactMode,
      isMobile: responsiveMode.isMobile,
      isVisible: responsiveMode.sidebarBehavior.isVisible
    };

    console.log('📡 Sidebar - Publishing expected dimensions immediately:');
    console.log(`   Expected Width: ${dimensions.width}px`);
    console.log(`   Expected Right Border: ${dimensions.rightBorder}px`);
    console.log(`   Mode: ${dimensions.isCompact ? 'Compact' : 'Expanded'}`);
    console.log(`   Viewport: ${viewport.width}x${viewport.height} (${viewport.isMobile ? 'Mobile' : 'Desktop'})`);
    console.log(`   Visible: ${dimensions.isVisible}`);
    console.log(`   🚀 Instant layout response - no waiting for CSS transitions`);
    
    this.layoutContext.updateSidebarDimensions(dimensions);
  }

  /**
   * Wait for CSS transition completion before publishing dimensions
   */
  private waitForTransitionAndPublish(): void {
    if (!this.sidebar) {
      // Fallback: publish immediately if no sidebar element
      this.publishCurrentDimensions();
      return;
    }

    // Check if sidebar has width transition defined
    const computedStyle = getComputedStyle(this.sidebar);
    const transitionProperty = computedStyle.transitionProperty;
    const transitionDuration = computedStyle.transitionDuration;
    
    // If width transitions are defined and duration > 0
    if (transitionProperty.includes('width') && parseFloat(transitionDuration) > 0) {
      console.log(`   ⏳ Waiting for sidebar width transition (${transitionDuration}) to complete...`);
      
      // Listen for transitionend event
      const handleTransitionEnd = (event: TransitionEvent) => {
        // Only handle width transitions on the sidebar itself
        if (event.target === this.sidebar && event.propertyName === 'width') {
          console.log('   ✅ Sidebar width transition completed');
          this.sidebar!.removeEventListener('transitionend', handleTransitionEnd);
          this.publishCurrentDimensions();
        }
      };
      
      // Add event listener
      this.sidebar.addEventListener('transitionend', handleTransitionEnd);
      
      // Fallback timeout in case transitionend doesn't fire (shouldn't happen with proper CSS)
      setTimeout(() => {
        this.sidebar!.removeEventListener('transitionend', handleTransitionEnd);
        console.log('   ⚠️ Fallback: Publishing dimensions after transition timeout');
        this.publishCurrentDimensions();
      }, parseFloat(transitionDuration) * 1000 + 100); // Add 100ms buffer
    } else {
      // No transition defined, publish immediately
      console.log('   ⚡ No width transition defined, publishing dimensions immediately');
      this.publishCurrentDimensions();
    }
  }


  /**
   * Get current sidebar dimensions for layout context
   */
  public getCurrentDimensions() {
    if (!this.sidebar) return null;

    const responsiveMode = this.layoutContext.getResponsiveMode();
    const rect = this.sidebar.getBoundingClientRect();
    
    let width = 0;
    if (responsiveMode.sidebarBehavior.isVisible) {
      width = this.compactMode ? responsiveMode.sidebarBehavior.compactWidth : responsiveMode.sidebarBehavior.defaultWidth;
    }
    
    return {
      width,
      rightBorder: responsiveMode.isMobile ? 0 : rect.right,
      isCompact: this.compactMode,
      isMobile: responsiveMode.isMobile,
      isVisible: responsiveMode.sidebarBehavior.isVisible
    };
  }

  /**
   * Setup responsive mode subscriptions
   */
  private setupResponsiveSubscriptions(): void {
    console.log('Sidebar - Setting up responsive mode subscriptions...');
    
    // Subscribe to responsive mode changes only (not viewport changes)
    // Sidebar only cares about mode transitions (mobile ↔ tablet ↔ desktop), not pixel-level viewport changes
    const responsiveModeUnsubscribe = this.layoutContext.subscribe('responsive-mode-change', (event) => {
      this.handleResponsiveModeChange(event.data);
    });
    this.responsiveUnsubscribers.push(responsiveModeUnsubscribe);
    
    console.log('Sidebar - Responsive subscriptions setup complete');
  }

  /**
   * Initialize sidebar based on current responsive mode
   */
  private initializeFromResponsiveMode(): void {
    const currentMode = this.layoutContext.getResponsiveMode();
    console.log('Sidebar - Initializing from current responsive mode:', currentMode.type);
    
    this.updateSidebarForResponsiveMode(currentMode);
  }

  /**
   * Handle responsive mode changes
   */
  private handleResponsiveModeChange(mode: any): void {
    console.log(`Sidebar - Responsive mode changed to: ${mode.type}`, mode);
    this.updateSidebarForResponsiveMode(mode);
  }


  /**
   * Update sidebar visibility and style based on responsive mode
   */
  private updateSidebarForResponsiveMode(mode: any): void {
    if (!this.sidebar) return;
    
    console.log(`Sidebar - Updating for ${mode.type} mode:`);
    console.log(`  - Visible: ${mode.sidebarBehavior.isVisible}`);
    console.log(`  - Can Toggle: ${mode.sidebarBehavior.canToggle}`);
    console.log(`  - Default Width: ${mode.sidebarBehavior.defaultWidth}px`);
    console.log(`  - Compact Width: ${mode.sidebarBehavior.compactWidth}px`);
    
    // Update sidebar visibility
    if (mode.sidebarBehavior.isVisible) {
      this.sidebar.style.display = 'flex';
      this.sidebar.classList.remove('sidebar-hidden');
    } else {
      this.sidebar.style.display = 'none';
      this.sidebar.classList.add('sidebar-hidden');
    }
    
    // Update toggle button availability
    const toggleButton = this.sidebar.querySelector('.compact-toggle-btn') as HTMLButtonElement;
    if (toggleButton) {
      if (mode.sidebarBehavior.canToggle) {
        toggleButton.style.display = 'flex';
        toggleButton.disabled = false;
        toggleButton.classList.remove('disabled');
      } else {
        toggleButton.style.display = 'none';
        toggleButton.disabled = true;
        toggleButton.classList.add('disabled');
      }
    }
    
    // Update CSS classes for responsive mode
    this.sidebar.classList.toggle('sidebar-mobile', mode.isMobile);
    this.sidebar.classList.toggle('sidebar-tablet', mode.isTablet);
    this.sidebar.classList.toggle('sidebar-desktop', mode.isDesktop);
    
    // Update CSS custom properties for responsive dimensions
    if (mode.sidebarBehavior.isVisible) {
      const currentWidth = this.compactMode ? mode.sidebarBehavior.compactWidth : mode.sidebarBehavior.defaultWidth;
      this.sidebar.style.setProperty('--sidebar-default-width', `${mode.sidebarBehavior.defaultWidth}px`);
      this.sidebar.style.setProperty('--sidebar-compact-width', `${mode.sidebarBehavior.compactWidth}px`);
      this.sidebar.style.setProperty('--sidebar-current-width', `${currentWidth}px`);
    }
    
    // Publish updated dimensions based on new responsive mode
    // Only emit events if sidebar is fully initialized (not during initial setup)
    if (this.isInitialized) {
      this.publishExpectedDimensions();
    } else {
      // During initialization, just update context state silently
      this.updateContextStateOnly();
    }
    
    console.log(`Sidebar - Updated for ${mode.type} mode complete`);
  }

  /**
   * Destroy the sidebar and cleanup
   */
  public destroy(): void {
    console.log('Sidebar - Destroying...');
    
    // Unsubscribe from responsive mode events
    this.responsiveUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Sidebar - Error unsubscribing from responsive events:', error);
      }
    });
    this.responsiveUnsubscribers = [];
    
    // Clear all compact mode listeners
    this.compactModeListeners = [];
    
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
    
    this.isInitialized = false;
    console.log('Sidebar - Destroyed');
  }
}

export default Sidebar;

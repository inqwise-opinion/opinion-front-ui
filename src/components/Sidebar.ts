/**
 * Sidebar Component
 * Professional sidebar with proper navigation structure
 * Designed to work with existing SCSS styles and SimpleMobileMenu
 */

export interface NavigationItem {
  id: string;
  text: string;
  icon: string;
  href: string;
  badge?: string;
  active?: boolean;
  children?: NavigationItem[];
  expandable?: boolean;
  expanded?: boolean;
}

export class Sidebar {
  private sidebar: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private navigationItems: NavigationItem[] = [];

  constructor() {
    console.log('Sidebar - Creating...');
    this.setupDefaultNavigation();
  }

  /**
   * Initialize the sidebar with proper structure
   */
  init(): void {
    console.log('Sidebar - Initializing...');
    
    if (this.isInitialized) {
      console.warn('Sidebar - Already initialized');
      return;
    }

    // Remove any existing minimal sidebar
    const existingSidebar = document.getElementById('app_sidebar');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Create the proper sidebar structure
    this.createSidebar();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('Sidebar - Ready ✅');
  }

  /**
   * Setup default navigation items
   */
  private setupDefaultNavigation(): void {
    this.navigationItems = [
      {
        id: 'dashboard',
        text: 'Dashboard',
        icon: 'dashboard',
        href: '/dashboard',
        active: false
      },
      {
        id: 'surveys',
        text: 'Surveys',
        icon: 'poll',
        href: '/surveys'
      },
      {
        id: 'debug',
        text: 'Debug',
        icon: 'bug_report',
        href: '/',
        active: true  // Debug is active since root path shows DebugPage
      }
    ];
  }

  /**
   * Create the sidebar HTML structure
   */
  private createSidebar(): void {
    // Create sidebar element
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'app_sidebar';
    this.sidebar.className = 'app-sidebar';
    
    // Create sidebar structure
    this.sidebar.innerHTML = `
      <div class="sidebar-wrapper">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <a href="/dashboard" class="brand-title-link">
              <h1 class="brand-title">Opinion</h1>
            </a>
          </div>
          <div class="sidebar-controls">
            <button class="sidebar-compact-toggle" id="sidebar_compact_toggle" title="Toggle Compact View" aria-label="Toggle Compact View">
              <span class="compact-icon">⟨⟩</span>
            </button>
          </div>
        </div>

        <!-- Sidebar Navigation -->
        <div class="sidebar-navigation">
          <nav class="nav-section" aria-label="Main navigation">
            <ul class="nav-list" role="menubar">
              ${this.renderNavigationItems(this.navigationItems)}
            </ul>
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <p class="copyright-text">&copy; 2024 Opinion</p>
        </div>

        <!-- Mobile close button (will be shown/hidden by SimpleMobileMenu CSS) -->
        <button id="sidebar_mobile_close" class="sidebar-mobile-close" aria-label="Close Menu" title="Close Menu">
          &times;
        </button>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.sidebar);
    console.log('Sidebar - Created with proper structure');
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
        return `
          <li class="nav-item nav-item-expandable">
            <button class="nav-link nav-link-expandable ${isActive}" 
                    data-nav-id="${item.id}"
                    data-expandable="true"
                    aria-expanded="${item.expanded ? 'true' : 'false'}"
                    role="menuitem"
                    tabindex="0">
              <span class="nav-icon material-icons" data-icon="${item.icon}">${item.icon}</span>
              <span class="nav-text">${item.text}</span>
              ${badge}
              <span class="nav-arrow material-icons">expand_more</span>
            </button>
            <ul class="nav-submenu" aria-expanded="${item.expanded ? 'true' : 'false'}" role="menu">
              ${item.children.map(child => `
                <li class="nav-subitem">
                  <a class="nav-sublink ${child.active ? 'nav-sublink-active' : ''}" 
                     href="${child.href}"
                     data-nav-id="${child.id}"
                     role="menuitem"
                     ${child.active ? 'aria-current="page"' : ''}>
                    <span class="nav-subicon material-icons">${child.icon}</span>
                    <span class="nav-subtext">${child.text}</span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </li>
        `;
      } else {
        return `
          <li class="nav-item">
            <a class="nav-link ${isActive}" 
               href="${item.href}"
               data-nav-id="${item.id}"
               data-title="${item.text}"
               role="menuitem"
               ${ariaCurrent}
               tabindex="0">
              <span class="nav-icon material-icons" data-icon="${item.icon}">${item.icon}</span>
              <span class="nav-text">${item.text}</span>
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

    // Handle compact toggle
    const compactToggle = this.sidebar.querySelector('#sidebar_compact_toggle');
    if (compactToggle) {
      compactToggle.addEventListener('click', (event) => {
        event.preventDefault();
        this.toggleCompact();
      });
    }

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
   * Toggle compact mode
   */
  private toggleCompact(): void {
    if (!this.sidebar) return;

    const isCompact = this.sidebar.classList.contains('sidebar-compact');
    
    if (isCompact) {
      this.sidebar.classList.remove('sidebar-compact');
      console.log('Sidebar - Compact mode disabled');
    } else {
      this.sidebar.classList.add('sidebar-compact');
      console.log('Sidebar - Compact mode enabled');
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
   * Destroy the sidebar
   */
  public destroy(): void {
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
    this.isInitialized = false;
    console.log('Sidebar - Destroyed');
  }
}

export default Sidebar;

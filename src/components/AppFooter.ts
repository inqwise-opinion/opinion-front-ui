/**
 * App Footer Component
 * Manages the application footer and copyright functionality
 */

export interface FooterConfig {
  showCopyright?: boolean;
  copyrightText?: string;
  showNavigation?: boolean;
  navigationLinks?: FooterLink[];
}

export interface FooterLink {
  href: string;
  title: string;
  text: string;
}

export class AppFooter {
  private container: HTMLElement | null = null;
  private config: FooterConfig;
  private elements: {
    navigationPanel?: HTMLElement;
    copyrightSection?: HTMLElement;
    copyrightText?: HTMLElement;
  } = {};

  constructor(config: FooterConfig = {}) {
    this.config = {
      showCopyright: true,
      copyrightText: 'created by inqwise',
      showNavigation: true,
      navigationLinks: [
        { href: '/create-bug-report', title: 'Report a Bug', text: 'Report a Bug' }
      ],
      ...config
    };
  }

  /**
   * Initialize the footer component
   */
  init(): void {
    console.log('AppFooter - Initializing...');
    
    // Create footer if it doesn't exist
    this.createFooter();
    
    // Cache DOM elements
    this.cacheElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('AppFooter - Ready');
  }

  /**
   * Create the footer HTML structure
   */
  private createFooter(): void {
    // Check if footer already exists
    let existingFooter = document.querySelector('.app-footer');
    if (existingFooter) {
      this.container = existingFooter as HTMLElement;
      return;
    }

    // Create footer element
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.id = 'app_footer';

    // Build footer content with wrapper structure to match expected CSS
    const footerHtml = this.buildFooterHtml();
    footer.innerHTML = footerHtml;

    // Insert footer at the bottom of the wrapper-constructed, after wrapper-content
    const wrapperConstructed = document.querySelector('.wrapper-constructed');
    
    if (wrapperConstructed) {
      // Insert as the last child of wrapper-constructed (after wrapper-content)
      wrapperConstructed.appendChild(footer);
      console.log('AppFooter - Inserted at bottom of .wrapper-constructed');
    } else {
      // Fallback: try wrapper-content
      const wrapperContent = document.querySelector('.wrapper-content');
      if (wrapperContent) {
        wrapperContent.appendChild(footer);
        console.log('AppFooter - Fallback: Inserted into .wrapper-content');
      } else {
        // Last resort: append to body
        document.body.appendChild(footer);
        console.log('AppFooter - Last resort: Inserted into body');
      }
    }
    console.log('AppFooter - Footer inserted successfully', footer);
    this.container = footer;
  }

  /**
   * Build complete footer HTML with wrapper structure
   */
  private buildFooterHtml(): string {
    const navigationHtml = this.config.showNavigation ? this.buildNavigationHtml() : '';
    const copyrightHtml = this.config.showCopyright ? this.buildCopyrightHtml() : '';
    
    return `
      <div class="footer-container">
        <div class="footer-content">
          ${navigationHtml}
          ${copyrightHtml}
        </div>
      </div>
    `;
  }

  /**
   * Build navigation HTML
   */
  private buildNavigationHtml(): string {
    if (!this.config.navigationLinks?.length) return '';

    const linksHtml = this.config.navigationLinks
      .map(link => `
        <li class="first-item last-item">
          <a href="${link.href}" title="${link.title}">${link.text}</a>
        </li>
      `).join('');

    return `
      <div class="footer-navigation-left-panel">
        <ul class="ld">
          ${linksHtml}
        </ul>
      </div>
      <div class="footer-navigation-right-panel"></div>
    `;
  }

  /**
   * Build copyright HTML
   */
  private buildCopyrightHtml(): string {
    return `
      <div class="footer-copyright-section">
        <small class="footer-copyright-text" id="footer_copyright_text">${this.config.copyrightText}</small>
      </div>
    `;
  }

  /**
   * Cache frequently used DOM elements
   */
  private cacheElements(): void {
    this.elements = {
      navigationPanel: this.container?.querySelector('.footer-navigation-left-panel') as HTMLElement,
      copyrightSection: this.container?.querySelector('.footer-copyright-section') as HTMLElement,
      copyrightText: this.container?.querySelector('.footer-copyright-text') as HTMLElement,
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Handle navigation link clicks
    if (this.elements.navigationPanel) {
      this.elements.navigationPanel.addEventListener('click', (e) => {
        const target = e.target as HTMLAnchorElement;
        if (target.tagName === 'A') {
          this.handleNavigationClick(target, e);
        }
      });
    }
  }

  /**
   * Handle navigation link clicks
   */
  private handleNavigationClick(link: HTMLAnchorElement, event: Event): void {
    const href = link.getAttribute('href');
    
    // Special handling for certain links
    if (href === '/create-bug-report') {
      // Could open a modal instead of navigating
      console.log('Footer navigation: Report a Bug clicked');
    }

    // Allow default navigation behavior
    // event.preventDefault() could be used here to override default behavior
  }

  /**
   * Update footer configuration
   */
  updateConfig(config: Partial<FooterConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Recreate footer with new config
    if (this.container) {
      this.container.remove();
      this.createFooter();
      this.cacheElements();
      this.setupEventListeners();
    }
  }

  /**
   * Show/hide copyright text
   */
  showCopyright(show: boolean): void {
    if (this.elements.copyrightText) {
      this.elements.copyrightText.style.display = show ? 'block' : 'none';
      console.log(`AppFooter - Copyright ${show ? 'shown' : 'hidden'}`);
    }
  }

  /**
   * Update copyright text
   */
  updateCopyrightText(text: string): void {
    if (this.elements.copyrightText) {
      this.elements.copyrightText.textContent = text;
      this.config.copyrightText = text;
    }
  }

  /**
   * Add navigation link
   */
  addNavigationLink(link: FooterLink): void {
    if (!this.config.navigationLinks) {
      this.config.navigationLinks = [];
    }
    
    this.config.navigationLinks.push(link);
    
    // Recreate navigation section
    this.updateNavigation();
  }

  /**
   * Remove navigation link
   */
  removeNavigationLink(href: string): void {
    if (this.config.navigationLinks) {
      this.config.navigationLinks = this.config.navigationLinks.filter(link => link.href !== href);
      this.updateNavigation();
    }
  }

  /**
   * Update navigation section
   */
  private updateNavigation(): void {
    if (this.elements.navigationPanel && this.config.showNavigation) {
      const footerHtml = this.buildFooterHtml();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = footerHtml;
      const newFooterContent = tempDiv.firstElementChild;
      
      if (newFooterContent && this.container) {
        this.container.innerHTML = '';
        this.container.appendChild(newFooterContent);
        this.cacheElements();
        this.setupEventListeners();
      }
    }
  }

  /**
   * Show/hide footer
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Update footer position/layout based on sidebar state
   */
  updateLayout(sidebarState: { compact: boolean, collapsed: boolean, mobile: boolean }): void {
    if (!this.container) return;
    
    // Add CSS classes based on sidebar state for proper positioning
    this.container.classList.toggle('footer-sidebar-compact', sidebarState.compact);
    this.container.classList.toggle('footer-sidebar-collapsed', sidebarState.collapsed);
    this.container.classList.toggle('footer-mobile', sidebarState.mobile);
    
    // Always show copyright text (not just on mobile anymore)
    if (this.elements.copyrightText) {
      this.elements.copyrightText.style.display = 'block';
    }
    
    console.log('AppFooter - Layout updated for sidebar state:', sidebarState);
    console.log('AppFooter - Copyright always visible');
  }

  /**
   * Get footer container
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Get copyright element (for external management by sidebar)
   */
  getCopyrightElement(): HTMLElement | null {
    return this.elements.copyrightText || null;
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log('AppFooter - Destroying...');
    
    // Remove event listeners and cleanup resources
    if (this.container) {
      this.container.remove();
    }
    
    this.container = null;
    this.elements = {};
  }
}

export default AppFooter;

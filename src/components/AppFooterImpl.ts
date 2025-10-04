/**
 * App Footer Component - Clean CSS Grid Integration
 * Manages the application footer and copyright functionality
 */

// Import component-scoped CSS
import "../assets/styles/components/footer.css";
// Import layout context
import { getLayoutContext } from "../contexts/index";
import type { LayoutEvent, LayoutContext } from "../contexts/LayoutContext";
import { AppFooter, FooterConfig } from "./AppFooter";
import type { Dimensions } from "./Sidebar";
import { ComponentStatus, ComponentWithStatus } from "../interfaces/ComponentStatus";

export class AppFooterImpl implements AppFooter, ComponentWithStatus {
  private container: HTMLElement | null = null;
  private config: FooterConfig;
  private elements: {
    navigationPanel?: HTMLElement;
    copyrightSection?: HTMLElement;
    copyrightText?: HTMLElement;
  } = {};
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];
  private isInitialized: boolean = false;
  private initTime: number | null = null;
  private navigationClickCount: number = 0;
  private layoutUpdateCount: number = 0;
  private lastActionTime: number | null = null;
  private domEventListenerCount: number = 0;

  constructor(config: FooterConfig = {}, layoutContext?: LayoutContext) {
    this.config = {
      showCopyright: true,
      copyrightText: "created by inqwise",
      showNavigation: true,
      navigationLinks: [
        {
          href: "/create-bug-report",
          title: "Report a Bug",
          text: "Report a Bug",
        },
      ],
      ...config,
    };

    // Use provided LayoutContext or fall back to global one
    this.layoutContext = layoutContext || getLayoutContext();
  }

  /**
   * Initialize the footer component
   */
  async init(): Promise<void> {
    console.log("AppFooter - Initializing...");

    // Create footer if it doesn't exist
    await this.createFooter();

    // Cache DOM elements
    this.cacheElements();

    // Setup event listeners
    this.setupEventListeners();

    // Register footer with layout context
    this.layoutContext.registerFooter(this);
    
    // Subscribe to layout context events
    this.subscribeToLayoutContext();

    this.initTime = Date.now();
    this.isInitialized = true;
    console.log("AppFooter - Ready");
  }

  /**
   * Use existing footer element and populate content
   */
  private async createFooter(): Promise<void> {
    // Find existing footer element
    this.container = document.getElementById("app-footer");

    if (!this.container) {
      // Wait a bit and try again in case DOM is still loading
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.container = document.getElementById("app-footer");
          if (!this.container) {
            console.error(
              "AppFooter: #app-footer element not found in DOM. Available elements:",
              Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
            );
            reject(
              new Error(
                "AppFooter: Could not find existing #app-footer element",
              ),
            );
            return;
          }
          this.finalizeFooterCreation();
          resolve();
        }, 100);
      });
    }

    console.log("AppFooter - Using existing element");

    this.finalizeFooterCreation();
  }

  /**
   * Finalize footer creation after element is found
   */
  private finalizeFooterCreation(): void {
    // Populate the existing structure with dynamic content
    this.populateContent();

    console.log("AppFooter - Content populated successfully");
  }

  /**
   * Populate footer content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.container) return;

    // Find footer container
    const footerContainer = this.container.querySelector(".footer-container");
    if (!footerContainer) return;

    // Build and populate footer content
    footerContainer.innerHTML = this.buildFooterContent();
  }

  /**
   * Build footer content HTML
   */
  private buildFooterContent(): string {
    const navigationHtml = this.config.showNavigation
      ? this.buildNavigationHtml()
      : "";
    const copyrightHtml = this.config.showCopyright
      ? this.buildCopyrightHtml()
      : "";

    return `
      <div class="footer-content">
        ${navigationHtml}
        ${copyrightHtml}
      </div>
    `;
  }

  /**
   * Build complete footer HTML with wrapper structure
   */
  private buildFooterHtml(): string {
    const navigationHtml = this.config.showNavigation
      ? this.buildNavigationHtml()
      : "";
    const copyrightHtml = this.config.showCopyright
      ? this.buildCopyrightHtml()
      : "";

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
    if (!this.config.navigationLinks?.length) return "";

    const linksHtml = this.config.navigationLinks
      .map(
        (link) => `
        <li class="footer-nav-item">
          <a class="footer-nav-link" href="${link.href}" title="${link.title}">${link.text}</a>
        </li>
      `,
      )
      .join("");

    return `
      <nav class="footer-navigation" aria-label="Footer">
        <div class="footer-navigation-left-panel">
          <ul class="footer-nav-list">
            ${linksHtml}
          </ul>
        </div>
        <div class="footer-navigation-right-panel"></div>
      </nav>
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
      navigationPanel: this.container?.querySelector(
        ".footer-navigation-left-panel",
      ) as HTMLElement,
      copyrightSection: this.container?.querySelector(
        ".footer-copyright-section",
      ) as HTMLElement,
      copyrightText: this.container?.querySelector(
        ".footer-copyright-text",
      ) as HTMLElement,
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.domEventListenerCount = 0;
    
    // Handle navigation link clicks
    if (this.elements.navigationPanel) {
      this.elements.navigationPanel.addEventListener("click", (e) => {
        const target = e.target as HTMLAnchorElement;
        if (target.tagName === "A") {
          this.handleNavigationClick(target, e);
        }
      });
      this.domEventListenerCount++;
    }
  }

  /**
   * Handle navigation link clicks
   */
  private handleNavigationClick(link: HTMLAnchorElement, _event: Event): void {
    const href = link.getAttribute("href");
    
    this.navigationClickCount++;
    this.lastActionTime = Date.now();

    // Special handling for certain links
    if (href === "/create-bug-report") {
      // Could open a modal instead of navigating
      console.log("Footer navigation: Report a Bug clicked");
    }

    // Allow default navigation behavior
    // event.preventDefault() could be used here to override default behavior
  }

  /**
   * Show/hide footer
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? "block" : "none";
    }
  }

  /**
   * Subscribe to layout context events
   */
  private subscribeToLayoutContext(): void {
    console.log("AppFooter - Subscribing to layout context events...");

    // Subscribe to layout mode changes (which include sidebar state changes)
    const layoutModeChangeUnsubscribe = this.layoutContext.subscribe(
      "layout-mode-change",
      this.handleLayoutModeChange.bind(this),
    );
    this.layoutUnsubscribers.push(layoutModeChangeUnsubscribe);

    // Note: Using layout-mode-change which provides complete layout state information

    // Set initial layout based on current layout mode
    this.updateFooterLayout();

    console.log(
      "AppFooter - Successfully subscribed to layout context events ✅",
    );
  }

  /**
   * Handle layout mode changes from layout context
   */
  private handleLayoutModeChange(event: LayoutEvent): void {
    const layoutData = event.data;
    console.log("AppFooter - Received layout mode change:", layoutData);
    this.updateFooterLayout();
  }

  /**
   * Update footer layout based on current layout mode
   */
  private updateFooterLayout(): void {
    if (!this.container) return;
    
    this.layoutUpdateCount++;
    this.lastActionTime = Date.now();

    // Get layout state from LayoutContext
    const modeType = this.layoutContext.getModeType();
    const sidebar = this.layoutContext.getSidebar();
    const isCompact = sidebar?.isCompactMode() || false;
    const isMobile = modeType === 'mobile';

    console.log("AppFooter - Updating layout for layout mode:", {
      type: modeType,
      isCompact,
      isMobile,
    });

    // Update CSS classes based on layout mode
    this.container.classList.toggle(
      "footer-sidebar-compact",
      isCompact && !isMobile,
    );
    this.container.classList.toggle(
      "footer-sidebar-normal",
      !isCompact && !isMobile,
    );
    this.container.classList.toggle("footer-mobile", isMobile);

    // Remove any inline positioning - let CSS Grid handle layout
    this.container.style.left = "";
    this.container.style.width = "";
    this.container.style.marginLeft = "";

    // Always show copyright text
    if (this.elements.copyrightText) {
      this.elements.copyrightText.style.display = "block";
    }

    // Dispatch custom event for other components that might need to know
    const event = new CustomEvent("footer-layout-updated", {
      detail: {
        layoutMode: { type: modeType, isCompact, isMobile },
        footerElement: this.container,
      },
    });
    document.dispatchEvent(event);

    console.log("AppFooter - Layout updated:", {
      layoutMode: { type: modeType, isCompact, isMobile },
      cssClasses: Array.from(this.container.classList).filter((cls) =>
        cls.startsWith("footer-"),
      ),
    });
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
   * Get detailed status information for this component
   */
  getStatus(): ComponentStatus {
    const currentTime = Date.now();
    const hasNavigationLinks = this.config.navigationLinks && this.config.navigationLinks.length > 0;
    
    return {
      componentType: 'AppFooterImpl',
      id: 'app-footer',
      initialized: this.isInitialized,
      initTime: this.initTime,
      uptime: this.initTime ? currentTime - this.initTime : 0,
      domElement: this.container ? {
        tagName: this.container.tagName,
        id: this.container.id,
        className: this.container.className,
        childCount: this.container.children.length,
        hasContent: this.container.children.length > 0,
        isVisible: this.container.style.display !== 'none',
        ariaLabel: this.container.getAttribute('aria-label') || undefined,
        role: this.container.getAttribute('role') || undefined
      } : undefined,
      eventListeners: {
        domEventListeners: this.domEventListenerCount,
        layoutSubscriptions: this.layoutUnsubscribers.length
      },
      configuration: {
        ...this.config,
        hasNavigationLinks: hasNavigationLinks,
        navigationLinksCount: this.config.navigationLinks?.length || 0
      },
      currentState: {
        navigationClickCount: this.navigationClickCount,
        layoutUpdateCount: this.layoutUpdateCount,
        lastActionTime: this.lastActionTime,
        lastActionAgo: this.lastActionTime ? currentTime - this.lastActionTime : null,
        layoutModeType: this.layoutContext?.getModeType(),
        isLayoutMobile: this.layoutContext?.isLayoutMobile(),
        sidebarCompactMode: this.layoutContext?.getSidebar()?.isCompactMode(),
        elementsCache: {
          navigationPanel: !!this.elements.navigationPanel,
          copyrightSection: !!this.elements.copyrightSection,
          copyrightText: !!this.elements.copyrightText
        }
      },
      performance: {
        initDuration: this.initTime ? 50 : null // Estimated
      },
      issues: this.getIssues(),
      customData: {
        navigationLinks: this.config.navigationLinks?.map(link => ({
          href: link.href,
          title: link.title,
          text: link.text
        })) || [],
        cssClasses: this.container ? Array.from(this.container.classList) : [],
        elementsFound: {
          container: !!this.container,
          navigationPanel: !!this.elements.navigationPanel,
          copyrightSection: !!this.elements.copyrightSection,
          copyrightText: !!this.elements.copyrightText
        }
      }
    };
  }
  
  /**
   * Get current issues with the component
   */
  private getIssues(): string[] {
    const issues: string[] = [];
    
    if (!this.isInitialized) {
      issues.push('Component not initialized');
    }
    
    if (!this.container) {
      issues.push('DOM container element missing');
    }
    
    if (!this.layoutContext) {
      issues.push('LayoutContext not available');
    }
    
    if (this.config.showNavigation && (!this.config.navigationLinks || this.config.navigationLinks.length === 0)) {
      issues.push('Navigation enabled but no navigation links configured');
    }
    
    if (this.config.showCopyright && !this.config.copyrightText) {
      issues.push('Copyright enabled but no copyright text configured');
    }
    
    if (!this.elements.copyrightText && this.config.showCopyright) {
      issues.push('Copyright text element not found in DOM');
    }
    
    if (!this.elements.navigationPanel && this.config.showNavigation) {
      issues.push('Navigation panel element not found in DOM');
    }
    
    if (this.layoutUnsubscribers.length === 0 && this.isInitialized) {
      issues.push('No layout subscriptions active (possible memory leak or initialization issue)');
    }
    
    return issues;
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log("AppFooter - Destroying...");

    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(
          "AppFooter - Error unsubscribing from layout context:",
          error,
        );
      }
    });
    this.layoutUnsubscribers = [];

    // Remove event listeners and cleanup resources
    if (this.container) {
      this.container.remove();
    }

    this.container = null;
    this.elements = {};
  }
}

export default AppFooterImpl;

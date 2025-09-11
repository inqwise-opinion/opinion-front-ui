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

export class AppFooterImpl implements AppFooter {
  private container: HTMLElement | null = null;
  private config: FooterConfig;
  private elements: {
    navigationPanel?: HTMLElement;
    copyrightSection?: HTMLElement;
    copyrightText?: HTMLElement;
  } = {};
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];

  constructor(config: FooterConfig = {}) {
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

    this.layoutContext = getLayoutContext();
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
    // Handle navigation link clicks
    if (this.elements.navigationPanel) {
      this.elements.navigationPanel.addEventListener("click", (e) => {
        const target = e.target as HTMLAnchorElement;
        if (target.tagName === "A") {
          this.handleNavigationClick(target, e);
        }
      });
    }
  }

  /**
   * Handle navigation link clicks
   */
  private handleNavigationClick(link: HTMLAnchorElement, event: Event): void {
    const href = link.getAttribute("href");

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

    // Subscribe to sidebar dimension changes
    const sidebarDimensionsUnsubscribe = this.layoutContext.subscribe(
      "sidebar-dimensions-change",
      this.handleSidebarDimensionsChange.bind(this),
    );
    this.layoutUnsubscribers.push(sidebarDimensionsUnsubscribe);

    // Note: No longer subscribing to viewport-change - sidebar-dimensions-change is sufficient
    // The sidebar dimensions already encode all the viewport information we need

    // Set initial layout based on current layout mode
    this.updateFooterLayout();

    console.log(
      "AppFooter - Successfully subscribed to layout context events ✅",
    );
  }

  /**
   * Handle sidebar dimension changes from layout context
   */
  private handleSidebarDimensionsChange(event: LayoutEvent): void {
    const dimensions = event.data as Dimensions;
    console.log("AppFooter - Received sidebar dimensions change:", dimensions);
    this.updateFooterLayout();
  }

  /**
   * Update footer layout based on current layout mode
   */
  private updateFooterLayout(): void {
    if (!this.container) return;

    // Get layout state directly from LayoutContext
    const layoutMode = this.layoutContext.getLayoutMode();
    const { isCompact, isMobile } = layoutMode;

    console.log("AppFooter - Updating layout for layout mode:", {
      type: layoutMode.type,
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
        layoutMode: { type: layoutMode.type, isCompact, isMobile },
        footerElement: this.container,
      },
    });
    document.dispatchEvent(event);

    console.log("AppFooter - Layout updated:", {
      layoutMode: { type: layoutMode.type, isCompact, isMobile },
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

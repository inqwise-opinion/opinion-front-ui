/**
 * App Header Component Implementation - Clean CSS Grid Integration
 * Basic header functionality with clean layout integration
 */

// Import component-scoped CSS
import "../assets/styles/components/header.css";

// Import required components
import { UserMenu } from "./UserMenu";
import type { UserMenuItem } from "./Layout";

// Type-only import for the interface
import { Dimensions } from "./Sidebar";
// Import layout context
import { getLayoutContext } from "../contexts/index";
import type { LayoutEvent, LayoutContext } from "../contexts/LayoutContext";
import { AppHeader, HeaderUser } from "./AppHeader";

export interface HeaderConfig {
  brandTitle?: string; // Header brand/logo title (default: "Opinion")
  brandHref?: string; // Header brand/logo link (default: "/dashboard")
  showMobileToggle?: boolean; // Show mobile menu toggle (default: true)
  showBreadcrumbs?: boolean; // Show breadcrumb navigation (default: true)
  showUserMenu?: boolean; // Show user menu (default: true)
}

export class AppHeaderImpl implements AppHeader {
  private userMenuHandler?: (userMenu: UserMenu) => void;
  private container: HTMLElement | null = null;
  private userMenu: UserMenu | null = null;
  private user: HeaderUser | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private layoutContext: LayoutContext;
  private layoutUnsubscribers: Array<() => void> = [];
  private config: Required<HeaderConfig>;

  constructor(config: HeaderConfig = {}) {
    // Apply configuration with defaults
    this.config = {
      brandTitle: config.brandTitle ?? "Opinion",
      brandHref: config.brandHref ?? "/",
      showMobileToggle: config.showMobileToggle ?? true,
      showBreadcrumbs: config.showBreadcrumbs ?? true,
      showUserMenu: config.showUserMenu ?? true,
    };

    console.log(
      "AppHeaderImpl - Creating clean header with config:",
      this.config,
    );
    this.layoutContext = getLayoutContext();
  }

  public setUserMenuHandler(handler: (userMenu: UserMenu) => void): void {
    this.userMenuHandler = handler;
  }

  /**
   * Initialize the header component
   */
  async init(): Promise<void> {
    console.log("AppHeaderImpl - Initializing...");

    try {
      // Create header first - it should exist independently
      await this.createHeader();

      // Wait for DOM to be ready and elements to be available
      await this.waitForDOMReady();

      console.log(`AppHeaderImpl - Current viewport: ${window.innerWidth}px`);

      // Initialize user menu component (desktop only)
      await this.initUserMenu();

      // Setup event listeners
      this.setupEventListeners();

      this.layoutContext.registerHeader(this);

      console.log("AppHeaderImpl - Ready");
    } catch (error) {
      console.error("AppHeaderImpl - Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Use existing header element and populate content
   */
  private async createHeader(): Promise<void> {
    // Find existing header element
    this.container = document.getElementById("app-header");

    if (!this.container) {
      // Wait a bit and try again in case DOM is still loading
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.container = document.getElementById("app-header");
          if (!this.container) {
            console.error(
              "AppHeaderImpl: #app-header element not found in DOM. Available elements:",
              Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
            );
            reject(
              new Error(
                "AppHeaderImpl: Could not find existing #app-header element",
              ),
            );
            return;
          }
          this.finalizeHeaderCreation();
          resolve();
        }, 100);
      });
    }

    console.log("AppHeaderImpl - Using existing element");

    this.finalizeHeaderCreation();
  }

  /**
   * Finalize header creation after element is found
   */
  private finalizeHeaderCreation(): void {
    // Populate the existing structure with dynamic content
    this.populateContent();

    console.log("AppHeaderImpl - Content populated successfully");
  }

  /**
   * Populate header content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.container) return;

    // Find header container
    const headerContainer = this.container.querySelector(".header-container");
    if (!headerContainer) return;

    // Populate header content using configuration
    const mobileToggleHtml = this.config.showMobileToggle
      ? `
        <button class="mobile-menu-toggle" id="mobile_menu_toggle" aria-label="Toggle Menu" title="Toggle Menu">
          <div class="hamburger-icon">
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
          </div>
        </button>
    `
      : "";

    const breadcrumbsHtml = this.config.showBreadcrumbs
      ? `
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
    `
      : "";

    const userMenuHtml = this.config.showUserMenu
      ? `
        <!-- User Menu -->
        <div id="user_menu_container"></div>
    `
      : "";

    headerContainer.innerHTML = `
      <!-- Left section: Mobile toggle button -->
      <div class="header-left">
        ${mobileToggleHtml}
      </div>

      <!-- Center section: Enhanced breadcrumbs and page title -->
      <div class="header-center" style="${window.innerWidth <= 767 ? "padding-left: 16px;" : "padding-left: 0;"}">
        ${breadcrumbsHtml}
      </div>

      <!-- Right section: User menu only -->
      <div class="header-right">
        ${userMenuHtml}
      </div>
    `;
  }

  /**
   * Initialize user menu component (responsive - works on both mobile and desktop)
   */
  private async initUserMenu(): Promise<void> {
    if (!this.config.showUserMenu) {
      console.log(
        "AppHeaderImpl - User menu disabled in config, skipping initialization",
      );
      return;
    }

    const userMenuContainer = await this.waitForElement("#user_menu_container");
    if (userMenuContainer) {
      this.userMenu = new UserMenu(userMenuContainer);
      if (this.userMenuHandler) {
        this.userMenuHandler(this.userMenu);
      }
      await this.userMenu.init();
      console.log(
        "AppHeaderImpl - UserMenu component initialized (responsive)",
      );
    } else {
      console.warn("AppHeaderImpl - User menu container not found");
    }
  }

  /**
   * Setup event listeners for header interactions
   */
  private setupEventListeners(): void {
    // Handle keyboard navigation
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Handle data-action based interactions
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const actionElement = target.closest("[data-action]") as HTMLElement;
      if (actionElement && this.container?.contains(actionElement)) {
        const action = actionElement.getAttribute("data-action");
        this.handleAction(action, actionElement);
      }
    });

    // Mobile menu toggle handler
    this.setupMobileMenuHandler();

    // Header positioning is now fully CSS-based - no dynamic resize handling needed
  }

  /**
   * Handle window resize events to update header styling and position
   */
  private handleResize(): void {
    const currentWidth = window.innerWidth;
    const headerCenter = this.container?.querySelector(
      ".header-center",
    ) as HTMLElement;

    console.log(
      `🪟 AppHeaderImpl - handleResize triggered for ${currentWidth}px viewport`,
    );

    if (headerCenter) {
      // Apply mobile styles only on phone screens, desktop/tablet get no padding
      if (currentWidth <= 767) {
        headerCenter.style.cssText = "padding-left: 16px;"; // Mobile padding for header-left space
      } else {
        headerCenter.style.cssText = "padding-left: 0;"; // No padding on tablet/desktop
      }
      console.log(
        `📐 AppHeaderImpl - Updated header-center styling for ${currentWidth}px viewport`,
      );
    }

    // Update header position based on current sidebar state
    console.log(`🔄 AppHeaderImpl - Updating position due to resize...`);
    this.updatePosition();
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      // Close user menu if open - delegate to UserMenu component
      if (this.userMenu) {
        this.userMenu.close();
      }
    }
  }

  /**
   * Setup mobile menu toggle handler
   */
  private setupMobileMenuHandler(): void {
    if (!this.config.showMobileToggle) {
      console.log(
        "AppHeaderImpl - Mobile toggle disabled in config, skipping handler setup",
      );
      return;
    }

    const mobileMenuToggle = document.getElementById("mobile_menu_toggle");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("📱 AppHeaderImpl - Mobile menu toggle clicked");

        // Check if we're in mobile mode
        const isMobile = this.layoutContext.isLayoutMobile();
        if (!isMobile) {
          console.log(
            "⚠️ AppHeaderImpl - Not in mobile mode, ignoring mobile menu click",
          );
          return;
        }

        // Toggle mobile sidebar visibility via LayoutContext
        const sidebar = this.layoutContext.getSidebar();
        if (sidebar) {
          console.log(
            "🔄 AppHeaderImpl - Triggering sidebar mobile toggle via LayoutContext...",
          );
          sidebar.toggleMobileVisibility();
        } else {
          console.warn(
            "❌ AppHeaderImpl - No sidebar registered in LayoutContext for mobile toggle",
          );
        }
      });

      console.log(
        "✅ AppHeaderImpl - Mobile menu toggle handler setup complete",
      );
    } else {
      console.warn("⚠️ AppHeaderImpl - Mobile menu toggle button not found");
    }
  }

  /**
   * Handle data-action based interactions
   */
  private handleAction(action: string | null, element: HTMLElement): void {
    if (!action) return;

    switch (action) {
      case "feedback":
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
      "Thank you for your interest in providing feedback!\n\n" +
      "This would typically open a feedback form or modal dialog " +
      "where you could submit your comments and suggestions.";

    if (
      confirm(
        message + "\n\nWould you like to be redirected to our feedback page?",
      )
    ) {
      console.log("Redirecting to feedback page...");
      // In a real implementation, this would redirect to the actual feedback page
    }
  }

  /**
   * Update user information in header
   */
  updateUser(user: HeaderUser): void {
    this.user = user;

    console.log(`AppHeaderImpl - updateUser called: ${user.username}`);

    // Always use UserMenu - it will handle responsive display via CSS
    if (this.userMenu) {
      this.userMenu.updateUser({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
      console.log("AppHeaderImpl - User updated via UserMenu");
    } else {
      console.warn("AppHeaderImpl - UserMenu not available for user update");
    }
  }

  /**
   * Update logo/brand link
   */
  updateBrand(title?: string, href?: string): void {
    const finalTitle = title ?? this.config.brandTitle;
    const finalHref = href ?? this.config.brandHref;

    const logo = this.container?.querySelector(".logo") as HTMLAnchorElement;
    if (logo) {
      logo.textContent = finalTitle;
      logo.href = finalHref;
      console.log(
        `AppHeaderImpl - Brand updated: "${finalTitle}" -> ${finalHref}`,
      );
    }
  }

  /**
   * Update page title in header breadcrumb
   */
  updatePageTitle(title: string): void {
    const pageTitleElement = document.getElementById("current_page_title");
    if (pageTitleElement) {
      pageTitleElement.textContent = title;
      console.log("AppHeaderImpl - Page title updated:", title);
    } else {
      console.warn("AppHeaderImpl - Page title element not found");
    }
  }

  /**
   * Update breadcrumbs with main page and optional sub-page
   * @param mainPage - The main menu item (e.g., "Dashboard", "Surveys")
   * @param subPage - Optional sub-page (e.g., "Settings", "Create Survey")
   */
  updateBreadcrumbs(mainPage: string, subPage?: string): void {
    const mainPageElement = document.getElementById("current_page_title");
    const separator = document.getElementById("breadcrumb_separator");
    const subPageContainer = document.getElementById("breadcrumb_subpage");
    const subPageElement = document.getElementById("subpage_title");

    if (mainPageElement) {
      mainPageElement.textContent = mainPage;
    }

    if (subPage && separator && subPageContainer && subPageElement) {
      // Show separator and sub-page
      separator.style.display = "flex";
      subPageContainer.style.display = "flex";
      subPageElement.textContent = subPage;

      // Update document title
      document.title = `${subPage} - ${mainPage} - Opinion`;

      console.log(
        `AppHeaderImpl - Breadcrumbs updated: ${mainPage} > ${subPage}`,
      );
    } else {
      // Hide separator and sub-page
      if (separator) separator.style.display = "none";
      if (subPageContainer) subPageContainer.style.display = "none";

      // Update document title
      document.title = `${mainPage} - Opinion`;

      console.log(`AppHeaderImpl - Breadcrumbs updated: ${mainPage}`);
    }
  }

  /**
   * Show/hide header
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? "block" : "none";
    }
  }

  /**
   * Get header configuration
   */
  public getConfig(): Required<HeaderConfig> {
    return { ...this.config };
  }

  /**
   * Wait for DOM to be ready
   */
  private async waitForDOMReady(): Promise<void> {
    if (document.readyState === "loading") {
      return new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), {
          once: true,
        });
      });
    }
    return Promise.resolve();
  }

  /**
   * Wait for a specific element to be available in the DOM
   */
  private async waitForElement(
    selector: string,
    timeout: number = 5000,
  ): Promise<HTMLElement | null> {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      return element;
    }

    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Update header layout based on current layout mode
   */
  private updateHeaderLayout(ctx: LayoutContext): void {
    if (!this.container) {
      console.warn(
        "AppHeaderImpl - Cannot update layout: container not available",
      );
      return;
    }

    // Remove all positioning inline styles - let CSS handle layout
    this.container.style.left = "";
    this.container.style.width = "";
    this.container.style.right = "";

    // Update CSS classes based on layout mode
    this.container.classList.toggle(
      "header-sidebar-compact",
      ctx.isCompact() && !ctx.isLayoutMobile(),
    );
    this.container.classList.toggle(
      "header-sidebar-normal",
      ctx.isCompact() && !ctx.isLayoutMobile(),
    );
    this.container.classList.toggle("header-mobile", ctx.isLayoutMobile());

    // Dispatch custom event for other components
    const event = new CustomEvent("header-layout-updated", {
      detail: {
        layoutContext: ctx,
      },
    });
    document.dispatchEvent(event);

    console.log(`✅ AppHeaderImpl - Layout updated`);
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
      right: rect.right,
    };
  }

  /**
   * Force update header position (useful after window resize)
   * Uses current layout context state instead of deprecated sidebar querying
   */
  public updatePosition(): void {
    console.log("🔄 AppHeaderImpl - Force updating position (manual trigger)");

    // Update header layout using current layout mode from layout context
    this.updateHeaderLayout(this.layoutContext);
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy(): void {
    console.log("AppHeaderImpl - Destroying...");

    // Unsubscribe from layout context events
    this.layoutUnsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(
          "AppHeaderImpl - Error unsubscribing from layout context:",
          error,
        );
      }
    });
    this.layoutUnsubscribers = [];

    // Destroy user menu component
    if (this.userMenu) {
      this.userMenu.destroy();
      this.userMenu = null;
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

export default AppHeaderImpl;

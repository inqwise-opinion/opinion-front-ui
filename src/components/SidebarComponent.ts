/**
 * Sidebar Component - Clean CSS Grid Integration
 * Basic sidebar functionality with clean layout integration
 */

// Import component-scoped CSS
import "../assets/styles/components/sidebar.css";
// Import layout context
import { getLayoutContext, type LayoutContext } from "../contexts/index";
// Import sidebar interfaces and types
import { Dimensions, NavigationItem, Sidebar, SidebarConfig } from "./Sidebar";
// Import layout event factory for typed events
import { LayoutEventFactory } from "../contexts/LayoutEventFactory";
// Import hotkey interfaces
import {
  ChainHotkeyProvider,
  ChainHotkeyHandler,
  HotkeyExecutionContext,
} from "../hotkeys/HotkeyChainSystem";
import { ComponentStatus, ComponentWithStatus } from "../interfaces/ComponentStatus";

export class SidebarComponent implements Sidebar, ChainHotkeyProvider, ComponentWithStatus {
  private sidebar: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private navigationItems: NavigationItem[] = [];
  private compactMode: boolean = false;
  private compactModeListeners: Array<(isCompact: boolean) => void> = [];
  private layoutContext: LayoutContext;
  private toggleCompactModeHandler?: (compactMode: boolean) => void;
  private chainProviderUnsubscriber: (() => void) | null = null;
  private initTime: number | null = null;
  private navigationUpdateCount: number = 0;
  private compactModeToggleCount: number = 0;
  private mobileMenuToggleCount: number = 0;
  private lastActionTime: number | null = null;
  private domEventListenerCount: number = 0;

  // Configuration
  private config: Required<SidebarConfig>;

  constructor(config: SidebarConfig = {}, layoutContext?: LayoutContext) {
    // Apply configuration with hardcoded defaults
    this.config = {
      defaultWidth: config.defaultWidth ?? 280,
      compactWidth: config.compactWidth ?? 80,
      footer: {
        text: config.footer?.text ?? "© 2025 Opinion",
        showFooter: config.footer?.showFooter ?? true,
      },
    };

    console.log("Sidebar - Creating sidebar with config:", this.config);

    // Use provided LayoutContext or fallback to singleton (for backwards compatibility)
    this.layoutContext = layoutContext || getLayoutContext();
    this.setupDefaultNavigation();
  }

  public isVisible(): boolean {
    return !this.layoutContext.isLayoutMobile() || this.isLocked();
  }
  /**
   * Set the toggle compact mode handler
   */
  public setToggleCompactModeHandler(
    handler?: (compactMode: boolean) => void,
  ): void {
    this.toggleCompactModeHandler = handler;
  }

  /**
   * Get sidebar configuration with width settings
   */
  public getConfig(): Required<SidebarConfig> {
    return { ...this.config };
  }

  /**
   * Initialize the sidebar
   */
  async init(): Promise<void> {
    console.log("Sidebar - Initializing...");

    if (this.isInitialized) {
      console.warn("Sidebar - Already initialized");
      return;
    }

    // Create the sidebar structure
    this.createSidebar();

    // Setup basic event listeners
    this.setupEventListeners();

    // Setup layout mode subscriptions
    this.setupLayoutModeSubscriptions();

    // Initialize based on current layout mode (no events, just read state)
    this.initializeFromLayoutMode();

    // Register the sidebar with the layout context
    this.layoutContext.registerSidebar(this);
    
    // Register as chain hotkey provider for mobile ESC handling
    this.chainProviderUnsubscriber = this.layoutContext.registerChainProvider(this);

    this.initTime = Date.now();
    this.isInitialized = true;
    console.log("Sidebar - Ready ✅");
  }

  /**
   * Setup default navigation items with captions
   */
  private setupDefaultNavigation(): void {
    this.navigationItems = [
      {
        id: "dashboard",
        text: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
        caption: "View analytics, reports and key metrics",
        active: false,
      },
      {
        id: "surveys",
        text: "Surveys",
        icon: "poll",
        href: "/surveys",
        caption: "Create and manage survey questionnaires",
      },
      {
        id: "debug",
        text: "Debug",
        icon: "bug_report",
        href: "/",
        caption: "Development tools and troubleshooting",
        active: true, // Debug is active since root path shows DebugPage
      },
    ];
  }

  /**
   * Use existing sidebar element and populate content
   */
  private createSidebar(): void {
    // Find existing sidebar element
    this.sidebar = document.getElementById("app-sidebar");

    if (!this.sidebar) {
      // Wait a bit and try again in case DOM is still loading
      //setTimeout(() => {
      this.sidebar = document.getElementById("app-sidebar");
      if (!this.sidebar) {
        console.error(
          "Sidebar: #app-sidebar element not found in DOM. Available elements:",
          Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
        );
        throw new Error(
          "Sidebar: Could not find existing #app-sidebar element",
        );
      }
      this.finalizeSidebarCreation();
      //}, 100);
      return;
    }

    console.log("Sidebar - Using existing element");

    this.finalizeSidebarCreation();
  }

  /**
   * Finalize sidebar creation after element is found
   */
  private finalizeSidebarCreation(): void {
    // Populate the existing structure with dynamic content
    this.populateContent();

    console.log("Sidebar - Content populated successfully");
  }

  /**
   * Populate sidebar content into existing HTML structure
   */
  private populateContent(): void {
    if (!this.sidebar) return;

    // Update brand title link and add compact toggle button + mobile close button
    const sidebarHeader = this.sidebar.querySelector(".sidebar-header");
    if (sidebarHeader) {
      sidebarHeader.innerHTML = `
        <div class="sidebar-brand">
          <a href="/dashboard" class="brand-title-link">
            <h1 class="brand-title">Opinion</h1>
          </a>
        </div>
        <div class="sidebar-controls">
          <!-- Desktop/Tablet compact toggle button -->
          <button class="compact-toggle-btn"
                  type="button"
                  aria-label="${this.compactMode ? "Expand sidebar" : "Compact sidebar"}"
                  data-compact="${this.compactMode}">
            <span class="material-icons compact-icon">
              ${this.compactMode ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
            </span>
          </button>

          <!-- Mobile close button -->
          <button class="mobile-close-btn"
                  type="button"
                  aria-label="Close menu">
            <span class="material-icons" style="font-size: 20px;">close</span>
          </button>
        </div>
      `;
    }

    // Populate navigation
    const navigationContainer = this.sidebar.querySelector(
      ".sidebar-navigation",
    );
    if (navigationContainer) {
      navigationContainer.innerHTML = `
        <ul class="nav-list" role="menubar">
          ${this.renderNavigationItems(this.navigationItems)}
        </ul>
      `;
    }

    // Populate footer
    const footerContainer = this.sidebar.querySelector(".sidebar-footer");
    if (footerContainer && this.config.footer.showFooter) {
      footerContainer.innerHTML = `
        <p class="copyright-text">${this.config.footer.text}</p>
      `;
    } else if (footerContainer && !this.config.footer.showFooter) {
      (footerContainer as HTMLElement).style.display = "none";
    }
  }

  /**
   * Render navigation items HTML
   */
  private renderNavigationItems(items: NavigationItem[]): string {
    return items
      .map((item) => {
        const isActive = item.active ? "nav-link-active" : "";
        const ariaCurrent = item.active ? 'aria-current="page"' : "";
        const badge = item.badge
          ? `<span class="nav-badge">${item.badge}</span>`
          : "";

        if (item.expandable && item.children) {
          return `
          <li class="nav-item nav-item-expandable">
            <button class="nav-link nav-link-expandable ${isActive}"
                    data-nav-id="${item.id}"
                    data-expandable="true"
                    aria-expanded="${item.expanded ? "true" : "false"}"
                    role="menuitem"
                    tabindex="0">
              <span class="nav-icon material-icons" data-icon="${item.icon}">${item.icon}</span>
              <span class="nav-text">${item.text}</span>
              ${badge}
              <span class="nav-arrow material-icons">expand_more</span>
            </button>
            <ul class="nav-submenu" aria-expanded="${item.expanded ? "true" : "false"}" role="menu">
              ${item.children
                .map((child) => {
                  return `
                  <li class="nav-subitem">
                    <a class="nav-sublink ${child.active ? "nav-sublink-active" : ""}"
                       href="${child.href}"
                       data-nav-id="${child.id}"
                       role="menuitem"
                       ${child.active ? 'aria-current="page"' : ""}>
                      <span class="nav-subicon material-icons">${child.icon}</span>
                      <span class="nav-subtext">${child.text}</span>
                    </a>
                  </li>
                `;
                })
                .join("")}
            </ul>
          </li>
        `;
        } else {
          const captionHtml = item.caption
            ? `<span class="nav-caption">${item.caption}</span>`
            : "";

          return `
          <li class="nav-item">
            <a class="nav-link ${isActive}"
               href="${item.href}"
               data-nav-id="${item.id}"
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
      })
      .join("");
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.sidebar) return;
    
    this.domEventListenerCount = 0;

    // Handle expandable navigation items
    this.sidebar.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const expandableButton = target.closest(
        '[data-expandable="true"]',
      ) as HTMLElement;

      if (expandableButton) {
        event.preventDefault();
        this.toggleExpandable(expandableButton);
      }
    });

    // Handle compact toggle button clicks
    this.sidebar.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const toggleButton = target.closest(
        ".compact-toggle-btn",
      ) as HTMLButtonElement;

      if (toggleButton) {
        event.preventDefault();
        event.stopPropagation();

        // Check if sidebar is locked in expanded mode
        if (this.isLocked() && !this.compactMode) {
          console.log(
            "Sidebar - Toggle blocked: sidebar is locked in expanded mode",
          );
          return;
        }

        this.toggleCompactMode();
        return;
      }
    });

    // Handle mobile close button clicks
    this.sidebar.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const closeButton = target.closest(
        ".mobile-close-btn",
      ) as HTMLButtonElement;

      if (closeButton) {
        event.preventDefault();
        event.stopPropagation();
        console.log("📱 Sidebar - Mobile close button clicked");
        this.hideMobileMenu("close-button");
        return;
      }
    });

    // Handle navigation clicks for SPA routing
    this.sidebar.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const navLink = target.closest("a[href]") as HTMLAnchorElement;

      if (navLink && navLink.href.startsWith(window.location.origin)) {
        // This is an internal link - could be handled by SPA router
        console.log("Sidebar - Navigation clicked:", navLink.href);
        this.setActiveItem(navLink.getAttribute("data-nav-id") || "");
      }
    });
    
    // Track DOM event listener count (4 click listeners on sidebar)
    this.domEventListenerCount = 4;
  }

  /**
   * Toggle expandable navigation item
   */
  private toggleExpandable(button: HTMLElement): void {
    const navId = button.getAttribute("data-nav-id");
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const submenu = button.nextElementSibling as HTMLElement;

    if (submenu) {
      button.setAttribute("aria-expanded", (!isExpanded).toString());
      submenu.setAttribute("aria-expanded", (!isExpanded).toString());

      // Update the navigation item state
      const navItem = this.navigationItems.find((item) => item.id === navId);
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
    this.sidebar
      .querySelectorAll(".nav-link-active, .nav-sublink-active")
      .forEach((el) => {
        el.classList.remove("nav-link-active", "nav-sublink-active");
        el.removeAttribute("aria-current");
      });

    // Find and activate the clicked item
    const targetLink = this.sidebar.querySelector(`[data-nav-id="${navId}"]`);
    if (targetLink) {
      if (targetLink.classList.contains("nav-link")) {
        targetLink.classList.add("nav-link-active");
        targetLink.setAttribute("aria-current", "page");
      } else if (targetLink.classList.contains("nav-sublink")) {
        targetLink.classList.add("nav-sublink-active");
        targetLink.setAttribute("aria-current", "page");
      }

      // Update navigation state
      this.navigationItems.forEach((item) => {
        item.active = item.id === navId;
        if (item.children) {
          item.children.forEach((child) => {
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
      const navList = this.sidebar.querySelector(".nav-list");
      if (navList) {
        navList.innerHTML = this.renderNavigationItems(this.navigationItems);
        this.navigationUpdateCount++;
        this.lastActionTime = Date.now();
        console.log("Sidebar - Navigation updated");
      }
    }
  }

  /**
   * Set active page programmatically
   */
  public setActivePage(navId: string): void {
    if (!navId) {
      throw new Error("SidebarComponent.setActivePage: navId parameter is required");
    }
    
    if (!this.isInitialized) {
      throw new Error("SidebarComponent.setActivePage: Sidebar not initialized. Call init() first.");
    }
    
    console.log(`📍 Sidebar - setActivePage called with: ${navId}`);
    this.setActiveItem(navId);
  }

  /**
   * Update sidebar footer text
   */
  public updateFooterText(text: string): void {
    this.config.footer.text = text;

    if (this.sidebar && this.isInitialized) {
      const footerContainer = this.sidebar.querySelector(".sidebar-footer");
      const copyrightText = footerContainer?.querySelector(".copyright-text");

      if (copyrightText && this.config.footer.showFooter) {
        copyrightText.textContent = text;
        console.log(`Sidebar - Footer text updated to: "${text}"`);
      }
    }
  }

  /**
   * Show or hide sidebar footer
   */
  public setFooterVisibility(show: boolean): void {
    this.config.footer.showFooter = show;

    if (this.sidebar && this.isInitialized) {
      const footerContainer = this.sidebar.querySelector(".sidebar-footer");

      if (footerContainer) {
        const footerEl = footerContainer as HTMLElement;
        if (show) {
          footerEl.style.display = "";
          footerEl.innerHTML = `
            <p class="copyright-text">${this.config.footer.text}</p>
          `;
          console.log("Sidebar - Footer shown");
        } else {
          footerEl.style.display = "none";
          console.log("Sidebar - Footer hidden");
        }
      }
    }
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
  private setCompactMode(compact: boolean): void {
    const previousCompactMode = this.compactMode;
    
    // Block compact mode on mobile - mobile uses overlay mode instead
    if (this.layoutContext.isLayoutMobile()) {
      console.log(
        "📱 Sidebar - Compact mode blocked on mobile (uses overlay mode instead)",
      );
      
      // Emit blocked event
      this.emitCompactModeChangeEvent(false, previousCompactMode, "mobile-layout");
      return;
    }
    
    // Check if locked in expanded mode
    if (compact && this.isLocked()) {
      console.log(
        "🔒 Sidebar - Compact mode blocked (sidebar is locked in expanded mode)",
      );
      
      // Emit blocked event
      this.emitCompactModeChangeEvent(false, previousCompactMode, "sidebar-locked");
      return;
    }

    if (this.compactMode !== compact) {
      // Log the dimension change start
      console.log(
        `🔄 Sidebar - Compact mode changing: ${this.compactMode ? "compact" : "expanded"} → ${compact ? "compact" : "expanded"}`,
      );

      this.compactMode = compact;
      this.compactModeToggleCount++;
      this.lastActionTime = Date.now();

      // Update sidebar CSS class
      if (this.sidebar) {
        if (compact) {
          this.sidebar.classList.add("sidebar-compact");
        } else {
          this.sidebar.classList.remove("sidebar-compact");
        }
      }

      // Update app layout for grid adjustments
      const appLayout = document.querySelector(".app-layout");
      if (appLayout) {
        if (compact) {
          appLayout.classList.add("sidebar-compact");
        } else {
          appLayout.classList.remove("sidebar-compact");
        }
      }

      // Update toggle button
      this.updateCompactToggleButton();

      // Emit successful compact mode change event
      this.emitCompactModeChangeEvent(compact, previousCompactMode);

      // Notify local listeners of the change
      this.notifyCompactModeChange(compact);

      console.log(
        `✅ Sidebar - Compact mode ${compact ? "enabled" : "disabled"}`,
      );
    }
  }

  /**
   * Subscribe to compact mode changes
   */
  public onCompactModeChange(
    callback: (isCompact: boolean) => void,
  ): () => void {
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
    this.compactModeListeners.forEach((listener) => {
      try {
        listener(isCompact);
      } catch (error) {
        console.error("Sidebar - Error in compact mode change handler:", error);
      }
    });
  }

  /**
   * Emit typed compact mode change event to LayoutContext
   */
  private emitCompactModeChangeEvent(
    compactMode: boolean,
    previousCompactMode: boolean,
    blockedReason?: "mobile-layout" | "sidebar-locked",
  ): void {
    // Create typed event using the factory
    const event = LayoutEventFactory.createSidebarCompactModeChangeEvent(
      compactMode,
      previousCompactMode,
      blockedReason,
    );

    // Emit the event through the LayoutContext
    this.layoutContext.emit("sidebar-compact-mode-change", event.data);

    console.log(
      `📡 Sidebar - Emitted compact mode change event: ${previousCompactMode} → ${compactMode}${blockedReason ? ` (blocked: ${blockedReason})` : ""}`,
    );
  }

  /**
   * Emit typed mobile menu mode change event to LayoutContext
   */
  private emitMobileMenuModeChangeEvent(
    isVisible: boolean,
    previousVisibility: boolean,
    trigger: "close-button" | "backdrop" | "menu-button" | "programmatic",
  ): void {
    // Create typed event using the factory
    const event = LayoutEventFactory.createMobileMenuModeChangeEvent(
      isVisible,
      previousVisibility,
      trigger
    );

    this.layoutContext.emit("mobile-menu-mode-change", event.data);

    console.log(
      `📡 Sidebar - Emitted mobile menu mode change event: ${previousVisibility} → ${isVisible} (via ${trigger})`,
    );
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
      console.log("Sidebar - Expanded to full width");
    } else {
      console.log("Sidebar - Already expanded");
    }
  }

  /**
   * Compact sidebar (ensure it's in compact mode)
   */
  public compactSidebar(): void {
    if (!this.compactMode) {
      this.setCompactMode(true);
      console.log("Sidebar - Compacted to narrow width");
    } else {
      console.log("Sidebar - Already compact");
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
      this.sidebar.setAttribute("data-locked-expanded", "true");
      console.log("Sidebar - Locked in expanded mode");
    }
  }

  /**
   * Unlock sidebar (allows normal compact/expand behavior)
   */
  public unlockSidebar(): void {
    if (this.sidebar) {
      this.sidebar.removeAttribute("data-locked-expanded");
      console.log("Sidebar - Unlocked, normal toggle behavior restored");
    }
  }

  /**
   * Check if sidebar is locked in expanded mode
   */
  public isLocked(): boolean {
    return this.sidebar?.hasAttribute("data-locked-expanded") ?? false;
  }

  /**
   * Update the compact toggle button appearance
   */
  private updateCompactToggleButton(): void {
    if (!this.sidebar) return;

    const toggleButton = this.sidebar.querySelector(
      ".compact-toggle-btn",
    ) as HTMLButtonElement;
    const toggleIcon = this.sidebar.querySelector(
      ".compact-icon",
    ) as HTMLElement;

    if (toggleButton && toggleIcon) {
      // Update button attributes
      toggleButton.setAttribute("data-compact", this.compactMode.toString());
      toggleButton.setAttribute(
        "title",
        this.compactMode ? "Expand sidebar" : "Compact sidebar",
      );
      toggleButton.setAttribute(
        "aria-label",
        this.compactMode ? "Expand sidebar" : "Compact sidebar",
      );

      // Update icon
      toggleIcon.textContent = this.compactMode
        ? "keyboard_double_arrow_right"
        : "keyboard_double_arrow_left";

      console.log(
        `Sidebar - Toggle button updated for ${this.compactMode ? "compact" : "normal"} mode`,
      );
    }
  }

  /**
   * Wait for CSS transition completion before publishing dimensions
   */
  private waitForTransitionAndPublish(): void {
    if (!this.sidebar) {
      return;
    }

    // Check if sidebar has width transition defined
    const computedStyle = getComputedStyle(this.sidebar);
    const transitionProperty = computedStyle.transitionProperty;
    const transitionDuration = computedStyle.transitionDuration;

    // If width transitions are defined and duration > 0
    if (
      transitionProperty.includes("width") &&
      parseFloat(transitionDuration) > 0
    ) {
      console.log(
        `   ⏳ Waiting for sidebar width transition (${transitionDuration}) to complete...`,
      );

      // Listen for transitionend event
      const handleTransitionEnd = (event: TransitionEvent) => {
        // Only handle width transitions on the sidebar itself
        if (event.target === this.sidebar && event.propertyName === "width") {
          console.log("   ✅ Sidebar width transition completed");
          this.sidebar!.removeEventListener(
            "transitionend",
            handleTransitionEnd,
          );
        }
      };

      // Add event listener
      this.sidebar.addEventListener("transitionend", handleTransitionEnd);

      // Fallback timeout in case transitionend doesn't fire (shouldn't happen with proper CSS)
      setTimeout(
        () => {
          this.sidebar!.removeEventListener(
            "transitionend",
            handleTransitionEnd,
          );
          console.log(
            "   ⚠️ Fallback: Publishing dimensions after transition timeout",
          );
        },
        parseFloat(transitionDuration) * 1000 + 100,
      ); // Add 100ms buffer
    } else {
      // No transition defined, publish immediately
      console.log(
        "   ⚡ No width transition defined, publishing dimensions immediately",
      );
    }
  }

  /**
   * Show mobile sidebar (overlay mode)
   */
  public showMobileMenu(trigger: "close-button" | "backdrop" | "menu-button" | "programmatic" = "programmatic"): void {
    if (!this.sidebar) {
      console.warn(
        "❌ Sidebar - Cannot show mobile menu: sidebar element not found",
      );
      return;
    }

    const isMobile = this.layoutContext.isLayoutMobile();
    if (!isMobile) {
      console.warn(
        "⚠️ Sidebar - showMobileMenu called but not in mobile mode",
      );
      return;
    }

    const isCurrentlyVisible = !this.sidebar.classList.contains("sidebar-hidden");
    if (isCurrentlyVisible) {
      console.log("📱 Sidebar - Mobile menu already visible");
      return;
    }

    // Emit mobile menu mode change event
    this.emitMobileMenuModeChangeEvent(true, false, trigger);
    this.mobileMenuToggleCount++;
    this.lastActionTime = Date.now();

    // Show mobile sidebar overlay
    console.log("📱 Sidebar - Showing mobile sidebar overlay");
    this.sidebar.classList.remove("sidebar-hidden");
    this.sidebar.classList.add("sidebar-mobile-visible");

    // Remove inline display:none that was set by responsive mode
    this.sidebar.style.display = "";
    console.log("📱 Sidebar - Removed inline display:none style");
    
    // ESC key handling now provided via ChainHotkeyProvider interface

    // Add body class for blur effect
    document.body.classList.add("sidebar-mobile-open");

    // Add backdrop for mobile overlay
    this.createMobileBackdrop();

    console.log("✅ Sidebar - Mobile menu shown");
  }

  /**
   * Hide mobile sidebar (overlay mode)
   */
  public hideMobileMenu(trigger: "close-button" | "backdrop" | "menu-button" | "programmatic" = "programmatic"): void {
    if (!this.sidebar) {
      console.warn(
        "❌ Sidebar - Cannot hide mobile menu: sidebar element not found",
      );
      return;
    }

    const isMobile = this.layoutContext.isLayoutMobile();
    if (!isMobile) {
      console.warn(
        "⚠️ Sidebar - hideMobileMenu called but not in mobile mode",
      );
      return;
    }

    const isCurrentlyVisible = !this.sidebar.classList.contains("sidebar-hidden");
    if (!isCurrentlyVisible) {
      console.log("📱 Sidebar - Mobile menu already hidden");
      return;
    }

    // Emit mobile menu mode change event
    this.emitMobileMenuModeChangeEvent(false, true, trigger);
    this.mobileMenuToggleCount++;
    this.lastActionTime = Date.now();

    // Hide mobile sidebar overlay
    console.log("📱 Sidebar - Hiding mobile sidebar overlay");
    this.sidebar.classList.add("sidebar-hidden");
    this.sidebar.classList.remove("sidebar-mobile-visible");

    // Remove body class for blur effect
    document.body.classList.remove("sidebar-mobile-open");

    // Remove backdrop if it exists
    const backdrop = document.querySelector(".mobile-sidebar-backdrop");
    if (backdrop) {
      backdrop.classList.remove("show");
      backdrop.remove();
    }
    
    // ESC key handling automatically disabled when mobile menu is hidden

    console.log("✅ Sidebar - Mobile menu hidden");
  }

  /**
   * Toggle mobile sidebar visibility (overlay mode)
   */
  public toggleMobileVisibility(trigger: "close-button" | "backdrop" | "menu-button" | "programmatic" = "programmatic"): void {
    if (!this.sidebar) {
      console.warn(
        "❌ Sidebar - Cannot toggle mobile visibility: sidebar element not found",
      );
      return;
    }

    // Use layout context to check if we're in mobile mode
    const isMobile = this.layoutContext.isLayoutMobile();
    if (!isMobile) {
      console.warn(
        "⚠️ Sidebar - toggleMobileVisibility called but not in mobile mode",
      );
      return;
    }

    const isCurrentlyVisible =
      !this.sidebar.classList.contains("sidebar-hidden");
    const newVisibility = !isCurrentlyVisible;
    
    console.log(
      `📱 Sidebar - Toggling mobile visibility: ${isCurrentlyVisible} → ${newVisibility}`,
    );
    console.log(`📱 Sidebar - Current classes: ${this.sidebar.className}`);

    // Emit mobile menu mode change event before changing state
    this.emitMobileMenuModeChangeEvent(
      newVisibility,
      isCurrentlyVisible,
      trigger,
    );

    if (isCurrentlyVisible) {
      // Hide mobile sidebar overlay
      console.log("📱 Sidebar - Hiding mobile sidebar overlay");
      this.sidebar.classList.add("sidebar-hidden");
      this.sidebar.classList.remove("sidebar-mobile-visible");

      // Remove body class for blur effect
      document.body.classList.remove("sidebar-mobile-open");

      // Remove backdrop if it exists
      const backdrop = document.querySelector(".mobile-sidebar-backdrop");
      if (backdrop) {
        backdrop.classList.remove("show");
        // Remove after transition
        //setTimeout(() => {
        backdrop.remove();
        //}, 300);
      }
      
      // ESC key handling automatically disabled when mobile menu is hidden
    } else {
      // Show mobile sidebar overlay
      console.log("📱 Sidebar - Showing mobile sidebar overlay");
      this.sidebar.classList.remove("sidebar-hidden");
      this.sidebar.classList.add("sidebar-mobile-visible");

      // CRITICAL: Remove inline display:none that was set by responsive mode
      this.sidebar.style.display = "";
      console.log("📱 Sidebar - Removed inline display:none style");

      // Add body class for blur effect
      document.body.classList.add("sidebar-mobile-open");

      // Add backdrop for mobile overlay
      this.createMobileBackdrop();
      
      // ESC key handling provided via ChainHotkeyProvider interface

      // Debug: Log the sidebar's computed styles
      const computedStyle = getComputedStyle(this.sidebar);
      console.log("📱 Sidebar - After show - computed styles:");
      console.log(`   display: ${computedStyle.display}`);
      console.log(`   visibility: ${computedStyle.visibility}`);
      console.log(`   opacity: ${computedStyle.opacity}`);
      console.log(`   transform: ${computedStyle.transform}`);
      console.log(`   z-index: ${computedStyle.zIndex}`);
    }

    console.log(
      `✅ Sidebar - Mobile visibility toggled to: ${newVisibility}`,
    );
    console.log(`📱 Sidebar - Final classes: ${this.sidebar.className}`);
  }

  /**
   * Create mobile backdrop for overlay sidebar
   */
  private createMobileBackdrop(): void {
    // Remove existing backdrop
    const existingBackdrop = document.querySelector(".mobile-sidebar-backdrop");
    if (existingBackdrop) {
      existingBackdrop.remove();
    }

    // Create new backdrop with blur effects
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-sidebar-backdrop";

    // Add backdrop to document body
    document.body.appendChild(backdrop);

    // Animate backdrop in with show class
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
    });

    // Close sidebar when backdrop is clicked
    backdrop.addEventListener("click", () => {
      this.hideMobileMenu("backdrop");
    });

    console.log("📱 Sidebar - Mobile backdrop created with blur effects");
  }

  /**
   * Get current sidebar dimensions for layout context
   *
   * IMPORTANT: This method must not call layoutContext.getLayoutMode() to avoid circular dependency!
   */
  public getCurrentDimensions() {
    if (!this.sidebar) return null;

    // Use direct viewport calculation instead of layoutContext to avoid circular dependency
    const isMobile = this.layoutContext.isLayoutMobile();
    const isVisible = !isMobile;

    let width = 0;
    if (isVisible) {
      // Use configured widths from sidebar config
      width = this.compactMode
        ? this.config.compactWidth
        : this.config.defaultWidth;
    }

    return {
      width,
      isVisible,
    };
  }

  /**
   * Get current sidebar dimensions (ISidebar interface implementation)
   * Returns sidebar dimensions following the Dimensions interface
   *
   * IMPORTANT: This method must not call layoutContext.getLayoutMode() to avoid circular dependency!
   * The LayoutContext calls this method to calculate layout mode, so we can't call back.
   */
  public getDimensions(): Dimensions {
    // Calculate dimensions based on current viewport and sidebar state
    // WITHOUT calling layoutContext to avoid circular dependency
    const isMobile = window.innerWidth <= 768;

    // Determine visibility based on viewport (mobile hides sidebar by default)
    const isVisible = !isMobile;

    // Calculate dimensions based on current state
    let width = 0;

    if (isVisible) {
      // Use configured widths from sidebar config
      width = this.compactMode
        ? this.config.compactWidth
        : this.config.defaultWidth;
    }

    return {
      width,
      isVisible,
    };
  }

  /**
   * Setup layout mode subscriptions
   */
  private setupLayoutModeSubscriptions(): void {
    console.log("Sidebar - Setting up layout mode subscriptions...");

    // Subscribe to layout mode changes only (not viewport changes)
    // Sidebar only cares about mode transitions (mobile ↔ tablet ↔ desktop), not pixel-level viewport changes
    this.layoutContext.subscribe(
      "layout-mode-change",
      (event) => {
        this.handleLayoutModeChange(event.data);
      },
    );

    // Subscribe to mobile menu requests from other components (e.g., header)
    this.layoutContext.subscribe(
      "mobile-menu-request",
      (event) => {
        this.handleMobileMenuRequest(event.data);
      },
    );

    // Subscribe to sidebar compact mode requests from other components (e.g., debug page)
    this.layoutContext.subscribe(
      "sidebar-compact-request",
      (event) => {
        this.handleSidebarCompactRequest(event.data);
      },
    );

    console.log("Sidebar - Layout mode, mobile menu, and compact mode request subscriptions setup complete");
  }

  /**
   * Initialize sidebar based on current layout mode
   */
  private initializeFromLayoutMode(): void {
    const currentModeType = this.layoutContext.getModeType();
    
    console.log("Sidebar - Initializing from current layout mode:", currentModeType);
    
    this.updateSidebarForModeType(currentModeType);
  }

  /**
   * Handle layout mode changes
   */
  private handleLayoutModeChange(eventData: any): void {
    console.log(`Sidebar - Layout mode changed to: ${eventData.modeType}`, eventData);
    
    // Clean up mobile overlay if transitioning FROM mobile mode
    if (eventData.previousModeType === 'mobile' && eventData.modeType !== 'mobile') {
      this.cleanupMobileOverlayState();
    }
    
    // Update sidebar for new mode
    this.updateSidebarForModeType(eventData.modeType);
  }

  /**
   * Handle mobile menu requests from other components
   */
  private handleMobileMenuRequest(requestData: any): void {
    console.log(`Sidebar - Mobile menu request received:`, requestData);
    
    // Only handle mobile menu requests when in mobile mode
    if (!this.layoutContext.isLayoutMobile()) {
      console.log(`Sidebar - Ignoring mobile menu request: not in mobile mode`);
      return;
    }
    
    const { requestedAction, trigger } = requestData;
    
    switch (requestedAction) {
      case "show":
        this.showMobileMenu(trigger);
        break;
      case "hide":
        this.hideMobileMenu(trigger);
        break;
      case "toggle":
        this.toggleMobileVisibility(trigger);
        break;
      default:
        console.warn(`Sidebar - Unknown mobile menu request action: ${requestedAction}`);
    }
  }

  /**
   * Handle sidebar compact mode requests from other components
   */
  private handleSidebarCompactRequest(requestData: any): void {
    console.log(`Sidebar - Sidebar compact request received:`, requestData);
    
    const { requestedAction } = requestData;
    
    switch (requestedAction) {
      case "show":
        // Show = expand (not compact)
        this.expandSidebar();
        break;
      case "hide":
        // Hide = compact
        this.compactSidebar();
        break;
      case "toggle":
        this.toggleCompactMode();
        break;
      default:
        console.warn(`Sidebar - Unknown compact mode request action: ${requestedAction}`);
    }
  }

  /**
   * Update sidebar visibility and style based on layout mode type
   */
  private updateSidebarForModeType(modeType: "mobile" | "tablet" | "desktop"): void {
    if (!this.sidebar) return;

    const isMobile = modeType === "mobile";
    const isTablet = modeType === "tablet";
    const isDesktop = modeType === "desktop";
    const isVisible = !isMobile; // Hide on mobile, show on tablet/desktop
    const canToggle = !isMobile; // Can toggle on tablet/desktop, not on mobile

    console.log(`Sidebar - Updating for ${modeType} mode:`);
    console.log(`  - Visible: ${isVisible}`);
    console.log(`  - Can Toggle: ${canToggle}`);

    // Update sidebar visibility
    if (isVisible) {
      console.log("  ✅ Showing sidebar: display=flex, removing .sidebar-hidden");
      this.sidebar.style.display = "flex";
      this.sidebar.classList.remove("sidebar-hidden");
    } else {
      console.log("  ❌ Hiding sidebar: display=none, adding .sidebar-hidden");
      this.sidebar.style.display = "none";
      this.sidebar.classList.add("sidebar-hidden");
    }

    // Update toggle button availability
    const toggleButton = this.sidebar.querySelector(".compact-toggle-btn") as HTMLButtonElement;
    if (toggleButton) {
      if (canToggle) {
        toggleButton.style.display = "flex";
        toggleButton.disabled = false;
        toggleButton.classList.remove("disabled");
      } else {
        toggleButton.style.display = "none";
        toggleButton.disabled = true;
        toggleButton.classList.add("disabled");
      }
    }

    // Update CSS classes for layout mode
    this.sidebar.classList.toggle("sidebar-mobile", isMobile);
    this.sidebar.classList.toggle("sidebar-tablet", isTablet);
    this.sidebar.classList.toggle("sidebar-desktop", isDesktop);

    // Update CSS custom properties for dimensions
    if (isVisible) {
      const currentWidth = this.compactMode ? this.config.compactWidth : this.config.defaultWidth;
      this.sidebar.style.setProperty("--sidebar-default-width", `${this.config.defaultWidth}px`);
      this.sidebar.style.setProperty("--sidebar-compact-width", `${this.config.compactWidth}px`);
      this.sidebar.style.setProperty("--sidebar-current-width", `${currentWidth}px`);
    }

    console.log(`Sidebar - Updated for ${modeType} mode complete`);
  }

  /**
   * Clean up mobile overlay state when transitioning from mobile to desktop/tablet
   */
  private cleanupMobileOverlayState(): void {
    if (!this.sidebar) return;
    
    console.log("🧹 Sidebar - Cleaning up mobile overlay state");
    
    // Remove mobile overlay classes
    this.sidebar.classList.remove("sidebar-mobile-visible");
    document.body.classList.remove("sidebar-mobile-open");
    
    // Remove backdrop if it exists
    const backdrop = document.querySelector(".mobile-sidebar-backdrop");
    if (backdrop) {
      backdrop.remove();
      console.log("🧹 Sidebar - Removed mobile backdrop");
    }
    
    // Emit cleanup event for debugging
    this.emitMobileMenuModeChangeEvent(false, true, "programmatic");
    
    console.log("✅ Sidebar - Mobile overlay state cleaned up");
  }

  // Legacy HotkeyProvider methods removed - using ChainHotkeyProvider only
  
  /**
   * Check if mobile menu is currently visible
   */
  private isMobileMenuVisible(): boolean {
    if (!this.sidebar) return false;
    
    return this.sidebar.classList.contains('sidebar-mobile-visible') && 
           !this.sidebar.classList.contains('sidebar-hidden');
  }
  
  // Legacy hotkey provider methods removed - now using ChainHotkeyProvider directly
  
  // =================================================================================
  // ChainHotkeyProvider Implementation (New System)
  // =================================================================================
  
  /**
   * Get provider identifier for chain hotkey system
   */
  getHotkeyProviderId(): string {
    return 'MobileSidebar'; // Use semantic name for debugging
  }
  
  /**
   * Get provider priority - Mobile/overlay components get high priority (800)
   */
  getProviderPriority(): number {
    return 800; // High priority for mobile overlay components
  }
  
  /**
   * Get chain hotkeys - only provide ESC when mobile menu is visible
   */
  getChainHotkeys(): Map<string, ChainHotkeyHandler> | null {
    // Only provide ESC hotkey when in mobile mode and mobile menu is visible
    const isMobile = this.layoutContext.isLayoutMobile();
    const isMobileMenuVisible = this.isMobileMenuVisible();
    
    if (!isMobile || !isMobileMenuVisible) {
      return null; // No hotkeys when not applicable
    }
    
    const hotkeys = new Map<string, ChainHotkeyHandler>();
    
    hotkeys.set('Escape', {
      key: 'Escape',
      providerId: this.getHotkeyProviderId(),
      enabled: true,
      handler: (ctx: HotkeyExecutionContext) => {
        this.handleEscapeKeyChain(ctx);
      },
      description: 'Close mobile sidebar menu via chain system',
      priority: this.getProviderPriority(),
      enable: () => { /* Mobile ESC is enabled when mobile menu is visible */ },
      disable: () => { /* Could disable if needed */ },
      isEnabled: () => this.layoutContext.isLayoutMobile() && this.isMobileMenuVisible()
    });
    
    return hotkeys;
  }
  
  /**
   * Default chain behavior - cooperative with user menu
   */
  getDefaultChainBehavior(): 'next' | 'break' {
    return 'next'; // Allow user menu to also close on ESC
  }
  
  /**
   * Handle ESC key via chain system with smart cooperation
   */
  private handleEscapeKeyChain(ctx: HotkeyExecutionContext): void {
    console.log('📱 MobileSidebar - ESC key pressed via chain system');
    
    // Close mobile menu
    this.hideMobileMenu('programmatic');
    ctx.preventDefault();
    
    console.log('📡 MobileSidebar - ESC handled: mobile menu closed');
    
    // Smart chain control:
    // Check if user menu is also in the chain and potentially open
    if (ctx.hasProvider('AppHeaderImpl') || ctx.hasProvider('UserMenu')) {
      // Let user menu also handle ESC if it needs to
      ctx.next();
    } else {
      // We're the primary handler, stop chain
      ctx.break();
    }
  }
  
  /**
   * Cleanup chain provider
   */
  private cleanupChainProvider(): void {
    if (this.chainProviderUnsubscriber) {
      this.chainProviderUnsubscriber();
      this.chainProviderUnsubscriber = null;
      console.log('MobileSidebar - Chain provider unregistered');
    }
  }

  /**
   * Get detailed status information for this component
   */
  getStatus(): ComponentStatus {
    const currentTime = Date.now();
    const isMobile = this.layoutContext?.isLayoutMobile() || false;
    const isMobileMenuVisible = this.isMobileMenuVisible();
    
    return {
      componentType: 'SidebarComponent',
      id: 'app-sidebar',
      initialized: this.isInitialized,
      initTime: this.initTime,
      uptime: this.initTime ? currentTime - this.initTime : 0,
      domElement: this.sidebar ? {
        tagName: this.sidebar.tagName,
        id: this.sidebar.id,
        className: this.sidebar.className,
        childCount: this.sidebar.children.length,
        hasContent: this.sidebar.children.length > 0,
        isVisible: this.sidebar.style.display !== 'none' && !this.sidebar.classList.contains('sidebar-hidden'),
        ariaLabel: this.sidebar.getAttribute('aria-label') || undefined,
        role: this.sidebar.getAttribute('role') || undefined
      } : undefined,
      eventListeners: {
        domEventListeners: this.domEventListenerCount,
        layoutSubscriptions: 3, // layout-mode-change, mobile-menu-request, sidebar-compact-request
        compactModeListeners: this.compactModeListeners.length
      },
      configuration: {
        ...this.config,
        navigationItemsCount: this.navigationItems.length,
        locked: this.isLocked()
      },
      currentState: {
        compactMode: this.compactMode,
        isMobile: isMobile,
        isMobileMenuVisible: isMobileMenuVisible,
        layoutModeType: this.layoutContext?.getModeType(),
        isLocked: this.isLocked(),
        navigationUpdateCount: this.navigationUpdateCount,
        compactModeToggleCount: this.compactModeToggleCount,
        mobileMenuToggleCount: this.mobileMenuToggleCount,
        lastActionTime: this.lastActionTime,
        lastActionAgo: this.lastActionTime ? currentTime - this.lastActionTime : null,
        chainProviderActive: this.chainProviderUnsubscriber !== null
      },
      performance: {
        initDuration: this.initTime ? 50 : null, // Estimated
        dimensions: this.getCurrentDimensions()
      },
      issues: this.getIssues(),
      customData: {
        navigationItems: this.navigationItems.map(item => ({
          id: item.id,
          text: item.text,
          active: item.active,
          expandable: item.expandable,
          expanded: item.expanded,
          childrenCount: item.children?.length || 0
        })),
        hotkeyProvider: {
          chainProviderRegistered: this.chainProviderUnsubscriber !== null,
          providesEscKey: isMobile && isMobileMenuVisible,
          priority: this.getProviderPriority(),
          providerId: this.getHotkeyProviderId()
        },
        cssClasses: this.sidebar ? Array.from(this.sidebar.classList) : []
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
    
    if (!this.sidebar) {
      issues.push('DOM sidebar element missing');
    }
    
    if (!this.layoutContext) {
      issues.push('LayoutContext not available');
    }
    
    if (this.navigationItems.length === 0) {
      issues.push('No navigation items configured');
    }
    
    if (this.domEventListenerCount === 0 && this.isInitialized) {
      issues.push('No DOM event listeners active (possible initialization issue)');
    }
    
    if (this.chainProviderUnsubscriber === null && this.isInitialized) {
      issues.push('Chain hotkey provider not registered');
    }
    
    const isMobile = this.layoutContext?.isLayoutMobile();
    if (isMobile && this.compactMode) {
      issues.push('Compact mode active on mobile (should use overlay mode instead)');
    }
    
    return issues;
  }

  /**
   * Destroy the sidebar and cleanup
   */
  public destroy(): void {
    console.log("Sidebar - Destroying...");
    
    // Cleanup chain provider
    this.cleanupChainProvider();

    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }

    this.isInitialized = false;
    console.log("Sidebar - Destroyed");
  }
}

export default SidebarComponent;

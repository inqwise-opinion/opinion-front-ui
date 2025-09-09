/**
 * User Menu Component
 * Manages user dropdown menu functionality
 */

import type { UserMenuItem } from "./Layout";

export interface User {
  username: string;
  email?: string;
  avatar?: string;
}

export class UserMenu {
  private container: HTMLElement | null = null;
  private user: User | null = null;
  private elements: {
    trigger?: HTMLElement;
    dropdown?: HTMLElement;
    username?: HTMLElement;
    userMenuName?: HTMLElement;
    userMenuEmail?: HTMLElement;
  } = {};
  private isOpen: boolean = false;

  constructor(private parentContainer: HTMLElement) {
    this.container = parentContainer;
  }

  /**
   * Initialize the user menu
   */
  async init(): Promise<void> {
    console.log("UserMenu - Initializing...");
    this.injectResponsiveCSS();
    this.createUserMenu();
    this.cacheElements();
    this.setupEventListeners();
    this.initializeWithDefaultUser();
    console.log("UserMenu - Ready");
  }

  /**
   * Inject responsive CSS for mobile and desktop views
   */
  private injectResponsiveCSS(): void {
    const existingStyle = document.getElementById("user-menu-responsive-css");
    if (existingStyle) {
      return; // Already injected
    }

    const style = document.createElement("style");
    style.id = "user-menu-responsive-css";
    style.textContent = `
      /* Desktop styles (default) */
      .user-menu-trigger {
        /* Default desktop styles already inline */
      }

      /* Add backdrop overlay for mobile */
      .user-menu-backdrop {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
      }

      @media (max-width: 767px) {
        .user-menu-backdrop.show {
          display: block !important;
        }
      }

      /* Mobile styles (< 768px) */
      @media (max-width: 767px) {
        .user-menu-trigger {
          /* Transform to mobile icon style */
          padding: 9px !important;
          border-radius: 8px !important;
          width: 42px !important;
          height: 42px !important;
          justify-content: center !important;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
          border: 1px solid #e3e6ea !important;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.08),
            0 4px 12px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.8) !important;
          backdrop-filter: blur(10px) !important;
        }

        .user-menu-trigger:hover {
          background: linear-gradient(145deg, #f8f9ff 0%, #e3f2fd 100%) !important;
          border-color: #007bff !important;
          transform: translateY(-1px) !important;
          box-shadow:
            0 3px 6px rgba(0,123,255,0.15),
            0 6px 16px rgba(0,123,255,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9) !important;
        }

        /* Hide text elements on mobile */
        .user-menu-trigger .user-info {
          display: none !important;
        }

        /* Center and adjust user icon for mobile */
        .user-menu-trigger .user-avatar {
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .user-menu-trigger .user-icon {
          font-size: 18px !important;
          font-style: normal !important;
        }

        /* Note: Mobile dropdown positioning and styling is now handled
           by createMobileDropdown() method using inline styles to avoid
           CSS conflicts. The styles below are kept for reference but
           are no longer used on mobile. */
      }

      /* Hide close button on desktop and tablet */
      @media (min-width: 768px) {
        .user-menu-close {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    console.log("UserMenu - Responsive CSS injected");
  }

  /**
   * Create user menu HTML structure
   */
  private createUserMenu(): void {
    const userMenuHtml = `
      <div class="user-menu-container" style="position: relative;">
        <div class="user-menu-trigger" id="user_menu_trigger" style="
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 6px;
          background: white;
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
        ">
          <div class="user-avatar" style="margin-right: 10px;">
            <span class="user-icon" style="font-size: 20px; color: #007bff; font-style: normal;">👤</span>
          </div>
          <div class="user-info" style="display: flex; align-items: center; gap: 8px;">
            <span class="username" id="label_username" style="font-weight: 500; color: #212529; font-size: 14px;">Loading...</span>
            <span class="dropdown-arrow" style="font-size: 10px; color: #6c757d; transition: transform 0.2s ease; font-style: normal;">▼</span>
          </div>
        </div>
        <div class="user-menu-dropdown" id="user_menu_dropdown" style="
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 280px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          overflow: hidden;
          display: none;
        ">
          <div class="user-menu-header" style="
            padding: 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <div class="user-menu-avatar">
              <span class="user-icon-large" style="font-size: 32px; color: #007bff; font-style: normal;">👤</span>
            </div>
            <div class="user-menu-details">
              <div class="user-menu-name" id="user_menu_name" style="
                font-weight: 600;
                color: #212529;
                font-size: 16px;
                margin-bottom: 4px;
              ">Loading...</div>
              <div class="user-menu-email" id="user_menu_email" style="
                color: #6c757d;
                font-size: 14px;
              ">demo@example.com</div>
            </div>
          </div>
          <!-- Close button for mobile -->
          <button class="user-menu-close" id="user_menu_close" style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s ease;
            color: #6c757d;
            font-size: 18px;
            line-height: 1;
            z-index: 10;
          " title="Close menu">
            <span class="material-icons" style="font-size: 20px;">close</span>
          </button>

          <ul class="user-menu-items" style="
            list-style: none;
            margin: 0;
            padding: 16px 0 8px 0;
          ">
            <li>
              <a href="/account" class="user-menu-item" style="
                display: flex;
                align-items: center;
                padding: 12px 20px;
                color: #495057;
                text-decoration: none;
                transition: all 0.2s ease;
                border-radius: 0;
                margin: 0;
                font-size: 15px;
                font-weight: 500;
                min-height: 48px;
              ">
                <span class="material-icons nav-icon" style="
                  margin-right: 16px;
                  font-size: 20px;
                  width: 24px;
                  color: #6c757d;
                  transition: color 0.2s ease;
                ">settings</span>
                <span class="nav-text">Account Settings</span>
              </a>
            </li>
            <li>
              <a href="javascript:;" class="user-menu-item" data-action="feedback" style="
                display: flex;
                align-items: center;
                padding: 12px 20px;
                color: #495057;
                text-decoration: none;
                transition: all 0.2s ease;
                border-radius: 0;
                margin: 0;
                font-size: 15px;
                font-weight: 500;
                min-height: 48px;
              ">
                <span class="material-icons nav-icon" style="
                  margin-right: 16px;
                  font-size: 20px;
                  width: 24px;
                  color: #6c757d;
                  transition: color 0.2s ease;
                ">feedback</span>
                <span class="nav-text">Send Feedback</span>
              </a>
            </li>
            <li style="height: 1px; background: #e9ecef; margin: 8px 16px;"></li>
            <li>
              <a href="/logout" class="user-menu-item user-menu-signout" style="
                display: flex;
                align-items: center;
                padding: 12px 20px;
                color: #dc3545;
                text-decoration: none;
                transition: all 0.2s ease;
                border-radius: 0;
                margin: 0;
                font-size: 15px;
                font-weight: 500;
                min-height: 48px;
              ">
                <span class="material-icons nav-icon" style="
                  margin-right: 16px;
                  font-size: 20px;
                  width: 24px;
                  color: #dc3545;
                  transition: color 0.2s ease;
                ">logout</span>
                <span class="nav-text">Sign Out</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    `;

    if (this.container) {
      this.container.innerHTML = userMenuHtml;
    }
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    this.elements = {
      trigger: document.getElementById("user_menu_trigger") as HTMLElement,
      dropdown: document.getElementById("user_menu_dropdown") as HTMLElement,
      username: document.getElementById("label_username") as HTMLElement,
      userMenuName: document.getElementById("user_menu_name") as HTMLElement,
      userMenuEmail: document.getElementById("user_menu_email") as HTMLElement,
    };

    console.log("UserMenu - Cached elements:", {
      trigger: !!this.elements.trigger,
      dropdown: !!this.elements.dropdown,
      username: !!this.elements.username,
      userMenuName: !!this.elements.userMenuName,
      userMenuEmail: !!this.elements.userMenuEmail,
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (this.elements.trigger) {
      this.elements.trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("UserMenu - Trigger clicked");
        this.toggle();
      });

      // Hover effects
      this.elements.trigger.addEventListener("mouseenter", () => {
        if (this.elements.trigger) {
          this.elements.trigger.style.background = "#f8f9fa";
          this.elements.trigger.style.borderColor = "#adb5bd";
        }
      });

      this.elements.trigger.addEventListener("mouseleave", () => {
        if (this.elements.trigger && !this.isOpen) {
          this.elements.trigger.style.background = "white";
          this.elements.trigger.style.borderColor = "#dee2e6";
        }
      });
    }

    // Menu item hover effects
    const menuItems = document.querySelectorAll(".user-menu-item");
    menuItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        (item as HTMLElement).style.background = "#f8f9fa";
      });
      item.addEventListener("mouseleave", () => {
        (item as HTMLElement).style.background = "transparent";
      });
    });

    // Add event listener for close button
    const closeButton = document.getElementById("user_menu_close");
    if (closeButton) {
      closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("UserMenu - Close button clicked");
        this.close();
      });
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (this.isOpen && this.elements.trigger && this.elements.dropdown) {
        const target = e.target as HTMLElement;
        if (
          !this.elements.trigger.contains(target) &&
          !this.elements.dropdown.contains(target)
        ) {
          this.close();
        }
      }
    });
  }

  /**
   * Toggle dropdown
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open dropdown
   */
  open(): void {
    if (!this.elements.dropdown || !this.elements.trigger) {
      console.warn("UserMenu - Cannot open: missing elements");
      return;
    }

    console.log("UserMenu - Opening dropdown");
    this.isOpen = true;

    // Check if mobile mode
    const isMobile = window.innerWidth <= 767;

    if (isMobile) {
      this.createMobileBackdrop();
      // Prevent body scrolling on mobile
      document.body.style.overflow = "hidden";

      // Create a completely new dropdown element for mobile to avoid CSS conflicts
      this.createMobileDropdown();
    } else {
      // Desktop mode - use the original dropdown
      this.elements.dropdown.style.display = "block";
      this.elements.dropdown.style.visibility = "visible";
      this.elements.dropdown.style.opacity = "1";
    }

    this.elements.trigger.style.background = "#f8f9fa";
    this.elements.trigger.style.borderColor = "#007bff";

    // Rotate arrow
    const arrow = this.elements.trigger.querySelector(
      ".dropdown-arrow",
    ) as HTMLElement;
    if (arrow) {
      arrow.style.transform = "rotate(180deg)";
    }
  }

  /**
   * Close dropdown
   */
  close(): void {
    if (!this.elements.dropdown || !this.elements.trigger) {
      return;
    }

    console.log("UserMenu - Closing dropdown");
    this.isOpen = false;

    // Hide desktop dropdown
    this.elements.dropdown.style.display = "none";
    this.elements.trigger.style.background = "white";
    this.elements.trigger.style.borderColor = "#dee2e6";

    // Reset dropdown styles to desktop defaults
    this.elements.dropdown.style.position = "absolute";
    this.elements.dropdown.style.top = "calc(100% + 4px)";
    this.elements.dropdown.style.left = "auto";
    this.elements.dropdown.style.right = "0";
    this.elements.dropdown.style.bottom = "auto";
    this.elements.dropdown.style.transform = "none";
    this.elements.dropdown.style.width = "auto";
    this.elements.dropdown.style.minWidth = "280px";
    this.elements.dropdown.style.maxWidth = "none";
    this.elements.dropdown.style.margin = "auto";
    this.elements.dropdown.style.borderRadius = "6px";
    this.elements.dropdown.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    this.elements.dropdown.style.zIndex = "9999";

    // Remove mobile dropdown if it exists
    const mobileDropdown = document.querySelector(".user-menu-mobile-dropdown");
    if (mobileDropdown) {
      mobileDropdown.remove();
      console.log("📱 UserMenu - Removed mobile dropdown");
    }

    // Remove mobile backdrop and restore body scroll
    this.removeMobileBackdrop();
    document.body.style.overflow = "";

    // Reset arrow
    const arrow = this.elements.trigger.querySelector(
      ".dropdown-arrow",
    ) as HTMLElement;
    if (arrow) {
      arrow.style.transform = "rotate(0deg)";
    }
  }

  /**
   * Update user data
   */
  updateUser(user: User): void {
    console.log("UserMenu - Updating user:", user);
    this.user = user;

    if (this.elements.username) {
      this.elements.username.textContent = user.username;
    }

    if (this.elements.userMenuName) {
      this.elements.userMenuName.textContent = user.username;
    }

    if (this.elements.userMenuEmail && user.email) {
      this.elements.userMenuEmail.textContent = user.email;
    }
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Create a fresh mobile dropdown to avoid CSS conflicts
   */
  private createMobileDropdown(): void {
    console.log("📱 UserMenu - Creating fresh mobile dropdown...");

    // Remove any existing mobile dropdown to avoid duplicates
    const existingMobileDropdown = document.querySelector(
      ".user-menu-mobile-dropdown",
    );
    if (existingMobileDropdown) {
      existingMobileDropdown.remove();
      console.log("📱 UserMenu - Removed existing mobile dropdown");
    }

    // Create completely new dropdown element for mobile
    const mobileDropdown = document.createElement("div");
    mobileDropdown.className = "user-menu-mobile-dropdown";
    mobileDropdown.id = "user_menu_mobile_dropdown";

    // Use inline styles with !important to avoid any CSS conflicts
    mobileDropdown.setAttribute(
      "style",
      `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: calc(100vw - 32px) !important;
      min-width: 280px !important;
      max-width: 380px !important;
      background: white !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      border-radius: 16px !important;
      box-shadow: 0 25px 80px rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.2) !important;
      z-index: 99999 !important;
      overflow: hidden !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      backdrop-filter: blur(10px) !important;
    `,
    );

    const user = this.getUser();
    const username = user?.username || "Guest User";
    const email = user?.email || "guest@example.com";

    mobileDropdown.innerHTML = `
      <div class="user-menu-header" style="
        padding: 24px 20px !important;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
        border-bottom: 1px solid rgba(0,0,0,0.06) !important;
        border-radius: 16px 16px 0 0 !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      ">
        <div class="user-menu-avatar">
          <span class="user-icon-large" style="
            font-size: 48px !important;
            color: #007bff !important;
            font-style: normal !important;
            filter: drop-shadow(0 2px 4px rgba(0,123,255,0.2)) !important;
          ">👤</span>
        </div>
        <div class="user-menu-details">
          <div class="user-menu-name" style="
            font-size: 20px !important;
            font-weight: 700 !important;
            margin-bottom: 8px !important;
            color: #1a1a1a !important;
          ">${username}</div>
          <div class="user-menu-email" style="
            font-size: 16px !important;
            color: #6c757d !important;
            font-weight: 500 !important;
          ">${email}</div>
        </div>
        <button class="user-menu-mobile-close" style="
          position: absolute !important;
          top: 12px !important;
          right: 12px !important;
          background: rgba(255,255,255,0.9) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          border-radius: 50% !important;
          width: 36px !important;
          height: 36px !important;
          font-size: 18px !important;
          cursor: pointer !important;
          color: #6c757d !important;
          transition: all 0.2s ease !important;
          z-index: 10 !important;
          backdrop-filter: blur(5px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        " title="Close menu">✕</button>
      </div>

      <ul class="user-menu-items" style="
        list-style: none !important;
        margin: 0 !important;
        padding: 16px 0 8px 0 !important;
      ">
        <li>
          <a href="/account" class="user-menu-item" style="
            display: flex !important;
            align-items: center !important;
            padding: 12px 20px !important;
            color: #495057 !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border-radius: 0 !important;
            margin: 0 !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            min-height: 48px !important;
          ">
            <span class="material-icons nav-icon" style="
              margin-right: 16px !important;
              font-size: 20px !important;
              width: 24px !important;
              color: #6c757d !important;
              transition: color 0.2s ease !important;
            ">settings</span>
            <span class="nav-text">Account Settings</span>
          </a>
        </li>
        <li>
          <a href="javascript:;" class="user-menu-item" data-action="feedback" style="
            display: flex !important;
            align-items: center !important;
            padding: 12px 20px !important;
            color: #495057 !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border-radius: 0 !important;
            margin: 0 !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            min-height: 48px !important;
          ">
            <span class="material-icons nav-icon" style="
              margin-right: 16px !important;
              font-size: 20px !important;
              width: 24px !important;
              color: #6c757d !important;
              transition: color 0.2s ease !important;
            ">feedback</span>
            <span class="nav-text">Send Feedback</span>
          </a>
        </li>
        <li style="height: 1px !important; background: #e9ecef !important; margin: 8px 16px !important;"></li>
        <li>
          <a href="/logout" class="user-menu-item user-menu-signout" style="
            display: flex !important;
            align-items: center !important;
            padding: 12px 20px !important;
            color: #dc3545 !important;
            text-decoration: none !important;
            transition: all 0.2s ease !important;
            border-radius: 0 !important;
            margin: 0 !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            min-height: 48px !important;
          ">
            <span class="material-icons nav-icon" style="
              margin-right: 16px !important;
              font-size: 20px !important;
              width: 24px !important;
              color: #dc3545 !important;
              transition: color 0.2s ease !important;
            ">logout</span>
            <span class="nav-text">Sign Out</span>
          </a>
        </li>
      </ul>
    `;

    // Add to document body to escape container constraints
    document.body.appendChild(mobileDropdown);

    // Add hover effects to new menu items
    const menuItems = mobileDropdown.querySelectorAll(".user-menu-item");
    menuItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        (item as HTMLElement).style.setProperty(
          "background",
          "#f8f9fa",
          "important",
        );
      });
      item.addEventListener("mouseleave", () => {
        (item as HTMLElement).style.setProperty(
          "background",
          "transparent",
          "important",
        );
      });

      // Add click handling for menu items
      item.addEventListener("click", (e) => {
        console.log(
          "📱 UserMenu - Mobile menu item clicked:",
          (e.currentTarget as HTMLElement).textContent?.trim(),
        );
      });
    });

    // Add close button event
    const closeButton = mobileDropdown.querySelector(".user-menu-mobile-close");
    if (closeButton) {
      closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("📱 UserMenu - Mobile close button clicked");
        this.close();
      });

      // Add hover effect to close button
      closeButton.addEventListener("mouseenter", () => {
        (closeButton as HTMLElement).style.setProperty(
          "background",
          "rgba(220, 53, 69, 0.1)",
          "important",
        );
        (closeButton as HTMLElement).style.setProperty(
          "color",
          "#dc3545",
          "important",
        );
      });
      closeButton.addEventListener("mouseleave", () => {
        (closeButton as HTMLElement).style.setProperty(
          "background",
          "rgba(255,255,255,0.9)",
          "important",
        );
        (closeButton as HTMLElement).style.setProperty(
          "color",
          "#6c757d",
          "important",
        );
      });
    }

    // Log detailed computed styles for debugging
    const computedStyles = window.getComputedStyle(mobileDropdown);
    console.log(
      "📱 UserMenu - Fresh mobile dropdown created and added to body",
      {
        position: computedStyles.position,
        top: computedStyles.top,
        left: computedStyles.left,
        transform: computedStyles.transform,
        zIndex: computedStyles.zIndex,
        display: computedStyles.display,
        visibility: computedStyles.visibility,
        opacity: computedStyles.opacity,
        width: computedStyles.width,
        height: computedStyles.height,
        backgroundColor: computedStyles.backgroundColor,
      },
    );
  }

  /**
   * Show mobile backdrop overlay (reuse existing sidebar overlay)
   */
  private createMobileBackdrop(): void {
    // Add body class for blur effect
    document.body.classList.add("user-menu-mobile-open");

    // Remove any existing user menu backdrop
    const existingBackdrop = document.querySelector(".user-menu-backdrop");
    if (existingBackdrop) {
      existingBackdrop.remove();
    }

    // Create new user menu backdrop with blur effects
    const backdrop = document.createElement("div");
    backdrop.className = "user-menu-backdrop";

    // Add backdrop to document body
    document.body.appendChild(backdrop);

    // Animate backdrop in with show class
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
    });

    // Close user menu when backdrop is clicked
    backdrop.addEventListener("click", () => {
      this.close();
    });

    console.log("📱 UserMenu - Mobile backdrop created with blur effects");
  }

  /**
   * Hide mobile backdrop overlay
   */
  private removeMobileBackdrop(): void {
    // Remove body class for blur effect
    document.body.classList.remove("user-menu-mobile-open");

    // Remove user menu backdrop if it exists
    const backdrop = document.querySelector(".user-menu-backdrop");
    if (backdrop) {
      backdrop.classList.remove("show");
      // Remove after transition
      setTimeout(() => {
        backdrop.remove();
      }, 300);
    }

    console.log(
      "📱 UserMenu - Mobile backdrop removed with blur effects cleanup",
    );
  }

  /**
   * Initialize with default user data to avoid showing "Loading..." indefinitely
   */
  private initializeWithDefaultUser(): void {
    const defaultUser: User = {
      username: "Guest User",
      email: "guest@example.com",
    };

    console.log("UserMenu - Setting default user data:", defaultUser);
    this.updateUser(defaultUser);
  }

  /**
   * Update user menu items from Layout configuration
   */
  public updateMenuItems(items: UserMenuItem[]): void {
    console.log("UserMenu - Updating menu items:", items.length, "items");

    // Find the menu items container
    const menuItemsContainer =
      this.elements.dropdown?.querySelector(".user-menu-items");
    if (!menuItemsContainer) {
      console.warn("UserMenu - Menu items container not found");
      return;
    }

    // Generate HTML for menu items
    const menuItemsHTML = items
      .map((item) => this.renderUserMenuItem(item))
      .join("");

    // Update the menu items
    menuItemsContainer.innerHTML = menuItemsHTML;

    // Re-setup hover effects for new items
    this.setupMenuItemHoverEffects();

    console.log("UserMenu - Menu items updated successfully");
  }

  /**
   * Render a single user menu item
   */
  private renderUserMenuItem(item: UserMenuItem): string {
    if (item.type === "divider") {
      return '<li style="height: 1px; background: #e9ecef; margin: 8px 16px;"></li>';
    }

    const href = item.href || "javascript:;";
    const action = item.action ? `data-action="${item.action}"` : "";
    const className = item.className ? ` ${item.className}` : "";
    const style = item.style ? ` ${item.style}` : "";
    const color = item.id === "logout" ? "#dc3545" : "#6c757d";

    return `
      <li>
        <a href="${href}" class="user-menu-item${className}" ${action} style="
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: ${item.id === "logout" ? "#dc3545" : "#495057"};
          text-decoration: none;
          transition: all 0.2s ease;
          border-radius: 0;
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          min-height: 48px;${style}
        ">
          <span class="material-icons nav-icon" style="
            margin-right: 16px;
            font-size: 20px;
            width: 24px;
            color: ${color};
            transition: color 0.2s ease;
          ">${item.icon}</span>
          <span class="nav-text">${item.text}</span>
        </a>
      </li>
    `;
  }

  /**
   * Setup hover effects for menu items
   */
  private setupMenuItemHoverEffects(): void {
    const menuItems = document.querySelectorAll(".user-menu-item");
    menuItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        (item as HTMLElement).style.background = "#f8f9fa";
      });
      item.addEventListener("mouseleave", () => {
        (item as HTMLElement).style.background = "transparent";
      });
    });
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    console.log("UserMenu - Destroying...");

    // Clean up backdrop and body scroll
    this.removeMobileBackdrop();
    document.body.style.overflow = "";

    if (this.container) {
      this.container.innerHTML = "";
    }
    this.elements = {};
    this.user = null;
    this.isOpen = false;
  }
}

export default UserMenu;

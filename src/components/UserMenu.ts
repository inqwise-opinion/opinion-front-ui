/**
 * User Menu Component
 * Manages user dropdown menu functionality
 */

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
  init(): void {
    console.log('UserMenu - Initializing...');
    this.injectResponsiveCSS();
    this.createUserMenu();
    this.cacheElements();
    this.setupEventListeners();
    console.log('UserMenu - Ready');
  }

  /**
   * Inject responsive CSS for mobile and desktop views
   */
  private injectResponsiveCSS(): void {
    const existingStyle = document.getElementById('user-menu-responsive-css');
    if (existingStyle) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'user-menu-responsive-css';
    style.textContent = `
      /* Desktop styles (default) */
      .user-menu-trigger {
        /* Default desktop styles already inline */
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
        }
        
        /* Position dropdown for mobile */
        .user-menu-dropdown {
          position: fixed !important;
          top: auto !important;
          bottom: 20px !important;
          left: 20px !important;
          right: 20px !important;
          min-width: auto !important;
          max-width: 400px !important;
          margin: 0 auto !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.25) !important;
          z-index: 10000 !important;
        }
        
        /* Mobile-optimized menu header */
        .user-menu-header {
          padding: 20px !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
        }
        
        .user-menu-avatar .user-icon-large {
          font-size: 40px !important;
        }
        
        .user-menu-name {
          font-size: 18px !important;
          margin-bottom: 6px !important;
        }
        
        .user-menu-email {
          font-size: 15px !important;
        }
        
        /* Mobile-optimized menu items */
        .user-menu-item {
          padding: 16px 20px !important;
          font-size: 16px !important;
          font-weight: 500 !important;
        }
        
        .user-menu-item .menu-icon {
          font-size: 18px !important;
          margin-right: 16px !important;
          width: 24px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    console.log('UserMenu - Responsive CSS injected');
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
            <i class="user-icon" style="font-size: 20px; color: #007bff;">👤</i>
          </div>
          <div class="user-info" style="display: flex; align-items: center; gap: 8px;">
            <span class="username" id="label_username" style="font-weight: 500; color: #212529; font-size: 14px;">Loading...</span>
            <i class="dropdown-arrow" style="font-size: 10px; color: #6c757d; transition: transform 0.2s ease;">▼</i>
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
              <i class="user-icon-large" style="font-size: 32px; color: #007bff;">👤</i>
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
          <ul class="user-menu-items" style="
            list-style: none;
            margin: 0;
            padding: 8px 0;
          ">
            <li>
              <a href="/account" class="user-menu-item" style="
                display: flex;
                align-items: center;
                padding: 12px 16px;
                color: #212529;
                text-decoration: none;
                transition: background-color 0.2s ease;
              ">
                <i class="menu-icon" style="margin-right: 12px; font-size: 16px; width: 20px;">⚙️</i>
                <span>Account Settings</span>
              </a>
            </li>
            <li>
              <a href="javascript:;" class="user-menu-item" data-action="feedback" style="
                display: flex;
                align-items: center;
                padding: 12px 16px;
                color: #212529;
                text-decoration: none;
                transition: background-color 0.2s ease;
              ">
                <i class="menu-icon" style="margin-right: 12px; font-size: 16px; width: 20px;">💬</i>
                <span>Send Feedback</span>
              </a>
            </li>
            <li style="height: 1px; background: #dee2e6; margin: 8px 0;"></li>
            <li>
              <a href="/logout" class="user-menu-item user-menu-signout" style="
                display: flex;
                align-items: center;
                padding: 12px 16px;
                color: #dc3545;
                text-decoration: none;
                transition: background-color 0.2s ease;
              ">
                <i class="menu-icon" style="margin-right: 12px; font-size: 16px; width: 20px;">🚪</i>
                <span>Sign Out</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    `;

    this.container.innerHTML = userMenuHtml;
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    this.elements = {
      trigger: document.getElementById('user_menu_trigger') as HTMLElement,
      dropdown: document.getElementById('user_menu_dropdown') as HTMLElement,
      username: document.getElementById('label_username') as HTMLElement,
      userMenuName: document.getElementById('user_menu_name') as HTMLElement,
      userMenuEmail: document.getElementById('user_menu_email') as HTMLElement,
    };

    console.log('UserMenu - Cached elements:', {
      trigger: !!this.elements.trigger,
      dropdown: !!this.elements.dropdown,
      username: !!this.elements.username,
      userMenuName: !!this.elements.userMenuName,
      userMenuEmail: !!this.elements.userMenuEmail
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (this.elements.trigger) {
      this.elements.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('UserMenu - Trigger clicked');
        this.toggle();
      });

      // Hover effects
      this.elements.trigger.addEventListener('mouseenter', () => {
        if (this.elements.trigger) {
          this.elements.trigger.style.background = '#f8f9fa';
          this.elements.trigger.style.borderColor = '#adb5bd';
        }
      });

      this.elements.trigger.addEventListener('mouseleave', () => {
        if (this.elements.trigger && !this.isOpen) {
          this.elements.trigger.style.background = 'white';
          this.elements.trigger.style.borderColor = '#dee2e6';
        }
      });
    }

    // Menu item hover effects
    const menuItems = document.querySelectorAll('.user-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.background = '#f8f9fa';
      });
      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.background = 'transparent';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.elements.trigger && this.elements.dropdown) {
        const target = e.target as HTMLElement;
        if (!this.elements.trigger.contains(target) && !this.elements.dropdown.contains(target)) {
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
      console.warn('UserMenu - Cannot open: missing elements');
      return;
    }

    console.log('UserMenu - Opening dropdown');
    this.isOpen = true;
    this.elements.dropdown.style.display = 'block';
    this.elements.trigger.style.background = '#f8f9fa';
    this.elements.trigger.style.borderColor = '#007bff';

    // Rotate arrow
    const arrow = this.elements.trigger.querySelector('.dropdown-arrow') as HTMLElement;
    if (arrow) {
      arrow.style.transform = 'rotate(180deg)';
    }
  }

  /**
   * Close dropdown
   */
  close(): void {
    if (!this.elements.dropdown || !this.elements.trigger) {
      return;
    }

    console.log('UserMenu - Closing dropdown');
    this.isOpen = false;
    this.elements.dropdown.style.display = 'none';
    this.elements.trigger.style.background = 'white';
    this.elements.trigger.style.borderColor = '#dee2e6';

    // Reset arrow
    const arrow = this.elements.trigger.querySelector('.dropdown-arrow') as HTMLElement;
    if (arrow) {
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * Update user data
   */
  updateUser(user: User): void {
    console.log('UserMenu - Updating user:', user);
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
   * Destroy the component
   */
  destroy(): void {
    console.log('UserMenu - Destroying...');
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.elements = {};
    this.user = null;
    this.isOpen = false;
  }
}

export default UserMenu;

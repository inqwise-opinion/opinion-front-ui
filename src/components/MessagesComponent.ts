/**
 * Messages Component - Clean Implementation
 *
 * Simple, clean messages that display under the header.
 * Access via LayoutContext only - never directly from other components.
 */

// Import clean CSS
import { LayoutContext } from "../contexts/LayoutContext";
import "../assets/styles/components/error-messages.css";

// Import interfaces
import type {
  Messages,
  Message,
  MessageOptions,
  MessageType,
} from "../interfaces/Messages";
import { ComponentStatus, ComponentWithStatus } from "../interfaces/ComponentStatus";
import { LoggerFactory } from "../logging/LoggerFactory";
import { Logger } from "../logging/Logger";

export class MessagesComponent implements Messages, ComponentWithStatus {
  private container: HTMLElement | null = null;
  private messages: Map<string, Message> = new Map();
  private autoHideTimers: Map<string, NodeJS.Timeout> = new Map();
  private layoutContext: LayoutContext;
  private isInitialized: boolean = false;
  private initTime: number | null = null;
  private messageAddCount: number = 0;
  private messageRemoveCount: number = 0;
  private autoHideTriggeredCount: number = 0;
  private lastActionTime: number | null = null;
  private closeButtonClickCount: number = 0;
  private logger: Logger;
  private idCounter: number = 0; // Counter to ensure unique IDs
  private messageOrder: string[] = []; // Track message order for positioning
  private resizeHandler: (() => void) | null = null;

  constructor(layoutContext: LayoutContext) {
    this.layoutContext = layoutContext;
    this.logger = LoggerFactory.getInstance().getLogger('MessagesComponent');
  }

  /**
   * Generate unique message ID to prevent collisions
   */
  private generateUniqueId(prefix: string): string {
    const timestamp = Date.now();
    const counter = ++this.idCounter;
    return `${prefix}-${timestamp}-${counter}`;
  }

  /**
   * Update deck positioning for all messages using CSS custom properties
   */
  private updateDeckPositions(): void {
    if (!this.container) return;

    // Determine if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const pixelOffset = isMobile ? 1 : 2;

    this.messageOrder.forEach((messageId, index) => {
      const messageElement = this.container?.querySelector(
        `[data-message-id="${messageId}"]`
      ) as HTMLElement;

      if (messageElement) {
        // Cap positioning at 7 messages - don't change position beyond that
        const effectiveIndex = Math.min(index, 6); // Max index of 6 (7th message)
        const offsetX = effectiveIndex * pixelOffset;
        const offsetY = effectiveIndex * pixelOffset;
        const zIndex = Math.max(10 - index, 1); // Z-index still increments for all messages
        
        // Set overflow based on position: visible for first message, hidden for others
        const overflowValue = index === 0 ? 'visible' : 'hidden';

        messageElement.style.setProperty('--deck-offset-x', `${offsetX}px`);
        messageElement.style.setProperty('--deck-offset-y', `${offsetY}px`);
        messageElement.style.setProperty('--deck-z-index', zIndex.toString());
        messageElement.style.setProperty('--deck-overflow', overflowValue);
      }
    });
  }

  /**
   * Initialize - find the container
   */
  public async init(): Promise<void> {
    this.container = document.getElementById("app-error-messages");

    if (!this.container) {
      this.logger.error("Container #app-error-messages not found");
      return;
    }

    this.layoutContext.registerMessages(this);
    
    // Set up resize listener to update positions when switching mobile/desktop
    this.resizeHandler = () => this.updateDeckPositions();
    window.addEventListener('resize', this.resizeHandler);
    
    this.initTime = Date.now();
    this.isInitialized = true;

    this.logger.info("Ready \u2705");
  }

  /**
   * Add a message - clean implementation
   */
  public addMessage(message: Message): void {
    if (!this.container) {
      this.logger.warn("Container not available");
      return;
    }

    // Set simple defaults
    const messageWithDefaults: Message = {
      dismissible: true,
      autoHide: message.type === "success" || message.type === "info",
      autoHideDelay: 5000,
      persistent: false,
      ...message,
    };

    // Remove existing message with same ID
    this.removeMessage(message.id);

    // Store and create message
    this.messages.set(message.id, messageWithDefaults);
    const messageElement = this.createMessageElement(messageWithDefaults);
    // Prepend new messages so they appear first in DOM (newest at top of deck)
    this.container.prepend(messageElement);
    
    // Track message order (newest first)
    this.messageOrder.unshift(message.id);
    
    // Update deck positions for all messages
    this.updateDeckPositions();
    
    // Track message addition
    this.messageAddCount++;
    this.lastActionTime = Date.now();

    // Auto-hide timer if needed
    if (messageWithDefaults.autoHide && messageWithDefaults.autoHideDelay) {
      const timer = setTimeout(
        () => {
          // Check if message still exists before trying to remove it
          if (this.messages.has(message.id)) {
            this.autoHideTriggeredCount++;
            this.removeMessage(message.id);
          }
        },
        messageWithDefaults.autoHideDelay,
      );
      this.autoHideTimers.set(message.id, timer);
    }

    this.logger.info(`Added ${message.type}: ${message.title}`);
  }

  /**
   * Remove an error message with smooth fade-out animation
   */
  public removeMessage(id: string): void {
    if (!this.container) return;

    // Check if message still exists to prevent double removal
    if (!this.messages.has(id)) {
      this.logger.debug(`Message ${id} already removed or doesn't exist`);
      return;
    }

    // Clear auto-hide timer if exists
    const timer = this.autoHideTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(id);
    }

    // Find the DOM element before removing from messages map
    const messageElement = this.container.querySelector(
      `[data-message-id="${id}"]`,
    ) as HTMLElement;
    
    // Remove from messages map and order tracking immediately to prevent race conditions
    this.messages.delete(id);
    this.messageOrder = this.messageOrder.filter(messageId => messageId !== id);
    
    // Track message removal
    this.messageRemoveCount++;
    this.lastActionTime = Date.now();
    
    // Update positions for remaining messages
    this.updateDeckPositions();

    // Handle DOM removal with animation
    if (messageElement) {
      // Prevent multiple animations on the same element
      if (messageElement.getAttribute('data-removing') === 'true') {
        this.logger.debug(`Message element ${id} already being removed`);
        return;
      }
      
      messageElement.setAttribute('data-removing', 'true');
      messageElement.style.animation = "messageFadeOut 0.3s ease-in forwards";

      // Remove after animation completes
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 300);
    }

    this.logger.info(`Removed message:`, id);
  }

  /**
   * Clear all messages
   */
  public clearAll(includesPersistent: boolean = false): void {
    if (!this.container) return;

    const messagesToRemove: string[] = [];

    this.messages.forEach((message, id) => {
      if (includesPersistent || !message.persistent) {
        messagesToRemove.push(id);
      }
    });

    // Clear all auto-hide timers first
    messagesToRemove.forEach((id) => {
      const timer = this.autoHideTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.autoHideTimers.delete(id);
      }
    });

    messagesToRemove.forEach((id) => this.removeMessage(id));

    // Reset order tracking
    this.messageOrder = [];

    // Cleanup any remaining orphaned elements after batch removal
    setTimeout(() => this.cleanupOrphanedMessages(), 400);

    this.logger.info(`Cleared ${messagesToRemove.length} messages`);
  }

  /**
   * Clear messages by type
   */
  public clearByType(type: MessageType): void {
    const messagesToRemove: string[] = [];

    this.messages.forEach((message, id) => {
      if (message.type === type && !message.persistent) {
        messagesToRemove.push(id);
      }
    });

    messagesToRemove.forEach((id) => this.removeMessage(id));

    this.logger.info(
      `Cleared ${messagesToRemove.length} ${type} messages`,
    );
  }

  /**
   * Get current messages
   */
  public getMessages(): Message[] {
    return Array.from(this.messages.values());
  }

  /**
   * Check if has messages of specific type
   */
  public hasMessages(type?: MessageType): boolean {
    if (!type) {
      return this.messages.size > 0;
    }

    return Array.from(this.messages.values()).some(
      (message) => message.type === type,
    );
  }

  /**
   * Create message element - simplified version
   */
  private createMessageElement(message: Message): HTMLElement {
    const messageEl = document.createElement("div");
    messageEl.className = `error-message ${message.type}`;
    messageEl.setAttribute("data-message-id", message.id);

    // Simple structure with close button and debug ID in title
    messageEl.innerHTML = `
      <div class="error-content">
        <div class="error-title">${this.escapeHtml(message.title)} <span style="font-size: 8px; opacity: 0.3; font-family: monospace; font-weight: normal; user-select: text;">[${this.escapeHtml(message.id)}]</span></div>
        ${message.description ? `<div class="error-description">${this.escapeHtml(message.description)}</div>` : ""}
      </div>
      ${message.dismissible ? `<button type="button" class="error-close">×</button>` : ""}
    `;

    // Setup close button event listener
    if (message.dismissible) {
      const closeButton = messageEl.querySelector(".error-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          this.closeButtonClickCount++;
          this.removeMessage(message.id);
        });
      }
    }

    return messageEl;
  }

  /**
   * Escape HTML for safety
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Convenience methods for different message types
   */
  public showError(
    title: string,
    description?: string,
    options?: MessageOptions,
  ): void {
    this.addMessage({
      id: options?.id || this.generateUniqueId('error'),
      type: "error",
      title,
      description,
      autoHide: false, // Errors should not auto-hide by default
      ...options,
    });
  }

  public showWarning(
    title: string,
    description?: string,
    options?: MessageOptions,
  ): void {
    this.addMessage({
      id: options?.id || this.generateUniqueId('warning'),
      type: "warning",
      title,
      description,
      autoHide: false, // Warnings should not auto-hide by default
      ...options,
    });
  }

  public showInfo(
    title: string,
    description?: string,
    options?: MessageOptions,
  ): void {
    this.addMessage({
      id: options?.id || this.generateUniqueId('info'),
      type: "info",
      title,
      description,
      autoHide: true, // Info messages can auto-hide
      ...options,
    });
  }

  public showSuccess(
    title: string,
    description?: string,
    options?: MessageOptions,
  ): void {
    this.addMessage({
      id: options?.id || this.generateUniqueId('success'),
      type: "success",
      title,
      description,
      autoHide: true, // Success messages can auto-hide
      ...options,
    });
  }

  /**
   * Check if the messages system is ready
   */
  public isReady(): boolean {
    return this.container !== null;
  }

  /**
   * Clean up orphaned DOM elements that might be stuck
   */
  public cleanupOrphanedMessages(): void {
    if (!this.container) return;

    const domMessages = this.container.querySelectorAll('[data-message-id]');
    let cleanedCount = 0;

    domMessages.forEach((element) => {
      const messageId = element.getAttribute('data-message-id');
      if (messageId && !this.messages.has(messageId)) {
        // This is an orphaned message in DOM but not in our tracking
        element.remove();
        cleanedCount++;
        this.logger.debug(`Cleaned up orphaned message element: ${messageId}`);
      }
    });

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} orphaned message elements`);
    }
  }

  /**
   * Force remove a message immediately without animation (for debugging)
   */
  public forceRemoveMessage(id: string): void {
    if (!this.container) return;

    // Clear timer
    const timer = this.autoHideTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(id);
    }

    // Remove from tracking
    this.messages.delete(id);

    // Remove from DOM immediately
    const messageElement = this.container.querySelector(
      `[data-message-id="${id}"]`,
    ) as HTMLElement;
    if (messageElement) {
      messageElement.remove();
    }

    this.messageRemoveCount++;
    this.lastActionTime = Date.now();
    this.logger.info(`Force removed message: ${id}`);
  }

  /**
   * Get detailed status information for this component
   */
  getStatus(): ComponentStatus {
    const currentTime = Date.now();
    const activeMessages = Array.from(this.messages.values());
    const messagesByType = {
      error: activeMessages.filter(m => m.type === 'error').length,
      warning: activeMessages.filter(m => m.type === 'warning').length,
      info: activeMessages.filter(m => m.type === 'info').length,
      success: activeMessages.filter(m => m.type === 'success').length
    };
    
    return {
      componentType: 'MessagesComponent',
      id: 'app-error-messages',
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
        closeButtonListeners: this.container ? this.container.querySelectorAll('.error-close').length : 0
      },
      configuration: {
        // MessagesComponent doesn't have a persistent config, all determined at runtime
        supportsAutoHide: true,
        supportsDismissible: true,
        supportsPersistent: true,
        supportsTypes: ['error', 'warning', 'info', 'success']
      },
      currentState: {
        activeMessagesCount: this.messages.size,
        messagesByType: messagesByType,
        activeAutoHideTimers: this.autoHideTimers.size,
        messageAddCount: this.messageAddCount,
        messageRemoveCount: this.messageRemoveCount,
        autoHideTriggeredCount: this.autoHideTriggeredCount,
        closeButtonClickCount: this.closeButtonClickCount,
        lastActionTime: this.lastActionTime,
        lastActionAgo: this.lastActionTime ? currentTime - this.lastActionTime : null,
        isReady: this.isReady()
      },
      performance: {
        initDuration: this.initTime ? 20 : null, // Estimated - Messages init is very fast
        averageMessageLifetime: this.messageRemoveCount > 0 ? 
          (this.initTime ? (currentTime - this.initTime) / this.messageRemoveCount : null) : null
      },
      issues: this.getIssues(),
      customData: {
        activeMessages: activeMessages.map(msg => ({
          id: msg.id,
          type: msg.type,
          title: msg.title,
          hasDescription: !!msg.description,
          dismissible: msg.dismissible,
          autoHide: msg.autoHide,
          autoHideDelay: msg.autoHideDelay,
          persistent: msg.persistent
        })),
        timerInfo: {
          activeTimers: this.autoHideTimers.size,
          timerIds: Array.from(this.autoHideTimers.keys())
        },
        domElements: {
          container: !!this.container,
          messageElements: this.container ? this.container.children.length : 0,
          closeButtons: this.container ? this.container.querySelectorAll('.error-close').length : 0
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
    
    // Check for potential memory leaks
    if (this.autoHideTimers.size > 10) {
      issues.push(`High number of active auto-hide timers (${this.autoHideTimers.size}) - possible memory leak`);
    }
    
    if (this.messages.size > 20) {
      issues.push(`High number of active messages (${this.messages.size}) - consider clearing old messages`);
    }
    
    // Check for timer/message mismatch
    const messagesWithAutoHide = Array.from(this.messages.values()).filter(m => m.autoHide);
    if (messagesWithAutoHide.length !== this.autoHideTimers.size) {
      issues.push('Mismatch between auto-hide messages and active timers');
    }
    
    // Check for persistent errors
    const persistentErrors = Array.from(this.messages.values()).filter(m => m.type === 'error' && m.persistent);
    if (persistentErrors.length > 5) {
      issues.push(`High number of persistent error messages (${persistentErrors.length})`);
    }
    
    return issues;
  }

  /**
   * Destroy the component
   */
  public destroy(): void {
    this.logger.info("Destroying...");

    // Clear all auto-hide timers
    this.autoHideTimers.forEach((timer) => clearTimeout(timer));
    this.autoHideTimers.clear();

    // Clear all messages
    this.clearAll(true);

    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Clean up references
    this.messages.clear();
    this.messageOrder = [];
    this.container = null;

    this.logger.info("Destroyed");
  }
}

export default MessagesComponent;

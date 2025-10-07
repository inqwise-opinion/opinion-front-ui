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

  constructor(layoutContext: LayoutContext) {
    this.layoutContext = layoutContext;
    this.logger = LoggerFactory.getInstance().getLogger('MessagesComponent');
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
    this.container.appendChild(messageElement);
    
    // Track message addition
    this.messageAddCount++;
    this.lastActionTime = Date.now();

    // Auto-hide timer if needed
    if (messageWithDefaults.autoHide && messageWithDefaults.autoHideDelay) {
      const timer = setTimeout(
        () => {
          this.autoHideTriggeredCount++;
          this.removeMessage(message.id);
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

    // Clear auto-hide timer if exists
    const timer = this.autoHideTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.autoHideTimers.delete(id);
    }

    // Remove from messages map
    this.messages.delete(id);
    
    // Track message removal
    this.messageRemoveCount++;
    this.lastActionTime = Date.now();

    // Add fade-out animation before removing from DOM
    const messageElement = this.container.querySelector(
      `[data-message-id="${id}"]`,
    ) as HTMLElement;
    if (messageElement) {
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

    messagesToRemove.forEach((id) => this.removeMessage(id));

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

    // Simple structure with close button
    messageEl.innerHTML = `
      <div class="error-content">
        <div class="error-title">${this.escapeHtml(message.title)}</div>
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
      id: options?.id || `error-${Date.now()}`,
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
      id: options?.id || `warning-${Date.now()}`,
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
      id: options?.id || `info-${Date.now()}`,
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
      id: options?.id || `success-${Date.now()}`,
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

    // Clean up references
    this.messages.clear();
    this.container = null;

    this.logger.info("Destroyed");
  }
}

export default MessagesComponent;

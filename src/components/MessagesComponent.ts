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

export class MessagesComponent implements Messages {
  private container: HTMLElement | null = null;
  private messages: Map<string, Message> = new Map();
  private autoHideTimers: Map<string, NodeJS.Timeout> = new Map();
  private layoutContext: LayoutContext;

  constructor(layoutContext: LayoutContext) {
    this.layoutContext = layoutContext;
  }

  /**
   * Initialize - find the container
   */
  public async init(): Promise<void> {
    this.container = document.getElementById("app-error-messages");

    if (!this.container) {
      console.error("ErrorMessages - Container #app-error-messages not found");
      return;
    }

    this.layoutContext.registerMessages(this);

    console.log("ErrorMessages - Ready ✅");
  }

  /**
   * Add a message - clean implementation
   */
  public addMessage(message: Message): void {
    if (!this.container) {
      console.warn("ErrorMessages - Container not available");
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

    // Auto-hide timer if needed
    if (messageWithDefaults.autoHide && messageWithDefaults.autoHideDelay) {
      const timer = setTimeout(
        () => this.removeMessage(message.id),
        messageWithDefaults.autoHideDelay,
      );
      this.autoHideTimers.set(message.id, timer);
    }

    console.log(`ErrorMessages - Added ${message.type}: ${message.title}`);
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

    console.log(`ErrorMessages - Removed message:`, id);
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

    console.log(`ErrorMessages - Cleared ${messagesToRemove.length} messages`);
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

    console.log(
      `ErrorMessages - Cleared ${messagesToRemove.length} ${type} messages`,
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
   * Destroy the component
   */
  public destroy(): void {
    console.log("ErrorMessages - Destroying...");

    // Clear all auto-hide timers
    this.autoHideTimers.forEach((timer) => clearTimeout(timer));
    this.autoHideTimers.clear();

    // Clear all messages
    this.clearAll(true);

    // Clean up references
    this.messages.clear();
    this.container = null;

    console.log("ErrorMessages - Destroyed");
  }
}

export default MessagesComponent;

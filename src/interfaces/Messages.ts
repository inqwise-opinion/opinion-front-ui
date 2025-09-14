/**
 * Messages Interface
 * 
 * Core interface for message display functionality.
 * This interface defines the contract that MessagesComponent implements
 * and provides the exclusive access point through LayoutContext.
 */

import { ComponentReference, ComponentReferenceConfig } from '../components/ComponentReference';
import type { LayoutContext } from '../contexts/LayoutContext';

export interface MessageOptions {
  id?: string;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  persistent?: boolean;
}

export type MessageType = 'error' | 'warning' | 'info' | 'success';

/**
 * Message data structure
 */
export interface Message {
  id: string;
  type: MessageType;
  title: string;
  description?: string;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  persistent?: boolean;
}

/**
 * Messages interface - the core contract for message functionality
 * This is implemented by MessagesComponent and accessed exclusively through LayoutContext
 */
export interface Messages {
  /**
   * Show an error message
   * @param title - Message title
   * @param description - Optional message description
   * @param options - Optional message configuration
   */
  showError(title: string, description?: string, options?: MessageOptions): void;

  /**
   * Show a warning message
   * @param title - Message title
   * @param description - Optional message description
   * @param options - Optional message configuration
   */
  showWarning(title: string, description?: string, options?: MessageOptions): void;

  /**
   * Show an info message
   * @param title - Message title
   * @param description - Optional message description
   * @param options - Optional message configuration
   */
  showInfo(title: string, description?: string, options?: MessageOptions): void;

  /**
   * Show a success message
   * @param title - Message title
   * @param description - Optional message description
   * @param options - Optional message configuration
   */
  showSuccess(title: string, description?: string, options?: MessageOptions): void;

  /**
   * Add a message with full control
   * @param message - Complete message configuration
   */
  addMessage(message: Message): void;

  /**
   * Remove a specific message
   * @param id - Message ID to remove
   */
  removeMessage(id: string): void;

  /**
   * Clear all messages
   * @param includesPersistent - Whether to clear persistent messages too
   */
  clearAll(includesPersistent?: boolean): void;

  /**
   * Clear messages by specific type
   * @param type - Type of messages to clear
   */
  clearByType(type: MessageType): void;

  /**
   * Get all current messages
   * @returns Array of current messages
   */
  getMessages(): Message[];

  /**
   * Check if messages exist
   * @param type - Optional type filter
   * @returns true if messages exist
   */
  hasMessages(type?: MessageType): boolean;

  /**
   * Check if the messages system is ready
   * @returns true if the system can display messages
   */
  isReady(): boolean;

  /**
   * Destroy the messages component and clean up
   */
  destroy(): void;
}

/**
 * Messages reference utilities
 */
export class MessagesRef {
  static readonly COMPONENT_ID = 'Messages' as const;
  
  /**
   * Get a ComponentReference for safely accessing registered Messages
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ComponentReference
   * @returns ComponentReference<Messages> for lazy resolution
   * 
   * @example
   * ```typescript
   * const messagesRef = MessagesRef.getRegisteredReference(layoutContext);
   * const messages = await messagesRef.get(); // Returns Messages | null
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ComponentReferenceConfig
  ): ComponentReference<Messages> {
    return new ComponentReference<Messages>(
      context,
      MessagesRef.COMPONENT_ID,
      () => context.getMessagesComponent(),
      config
    );
  }
}

export default Messages;

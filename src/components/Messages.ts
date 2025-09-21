/**
 * Message types and interfaces
 */

/**
 * Message data structure
 */
export interface Message {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: number;
  dismissible?: boolean;
  actions?: MessageAction[];
}

/**
 * Action that can be associated with a message
 */
export interface MessageAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
}

/**
 * Messages interface - Define the contract for message components
 */
export interface Messages {
  showError(title: string, message: string, options?: Partial<Message>): void;
  showWarning(title: string, message: string, options?: Partial<Message>): void;
  showInfo(title: string, message: string, options?: Partial<Message>): void;
  showSuccess(title: string, message: string, options?: Partial<Message>): void;
  clearMessages(): void;
  clearMessagesByType(type: Message['type']): void;
  addMessage(message: Message): void;
  removeMessage(messageId: string): void;
  destroy(): void;
}

export default Messages;
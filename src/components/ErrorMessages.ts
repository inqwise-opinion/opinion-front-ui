/**
 * Error message types and interfaces
 */

/**
 * Error message data structure
 */
export interface ErrorMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: number;
  dismissible?: boolean;
  actions?: ErrorAction[];
}

/**
 * Action that can be associated with an error message
 */
export interface ErrorAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
}

/**
 * Messages interface - Define the contract for error message components
 */
export interface ErrorMessages {
  showError(title: string, message: string, options?: Partial<ErrorMessage>): void;
  showWarning(title: string, message: string, options?: Partial<ErrorMessage>): void;
  showInfo(title: string, message: string, options?: Partial<ErrorMessage>): void;
  showSuccess(title: string, message: string, options?: Partial<ErrorMessage>): void;
  clearMessages(): void;
  clearMessagesByType(type: ErrorMessage['type']): void;
  addMessage(message: ErrorMessage): void;
  removeMessage(messageId: string): void;
}

export default ErrorMessages;
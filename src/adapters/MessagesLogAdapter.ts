import { AsyncLogConsumer } from '../logging/AsyncConsumerLogChannel';
import { LogMessage } from '../logging/ChannelTypes';
import { Messages, MessageType } from '../interfaces/Messages';

/**
 * Adapter that converts logging messages to user-visible messages
 * Implements AsyncLogConsumer to bridge LoggerFactory with Messages component
 */
export class MessagesLogAdapter implements AsyncLogConsumer {
    private messages: Messages;
    private readonly levelMapping: { [key: string]: MessageType } = {
        'TRACE': 'info',
        'DEBUG': 'info', 
        'INFO': 'info',
        'WARN': 'warning',
        'ERROR': 'error',
        'FATAL': 'error'
    };

    constructor(messages: Messages) {
        this.messages = messages;
    }

    /**
     * Process a log message and convert it to a user message
     */
    async consume(logMessage: LogMessage): Promise<void> {
        
        // Map log level to message type
        const messageType = this.levelMapping[logMessage.level.toUpperCase()] || 'info';
        
        // Create a user-friendly title from logger name
        const title = this.formatTitle(logMessage.logName, logMessage.level);
        
        // Format the message content
        const description = this.formatDescription(logMessage);
        
        // Determine message options based on log level
        const options = this.getMessageOptions(logMessage.level);
        
        // Show the message via the Messages interface
        switch (messageType) {
            case 'error':
                this.messages.showError(title, description, options);
                break;
            case 'warning':
                this.messages.showWarning(title, description, options);
                break;
            case 'info':
                this.messages.showInfo(title, description, options);
                break;
            case 'success':
                // Success type not typical for logs, but handle it
                this.messages.showSuccess(title, description, options);
                break;
        }
    }

    /**
     * Error handler for when consume() fails
     */
    onError(error: Error, logMessage: LogMessage): void {
        console.error('MessagesLogAdapter: Failed to process log message:', error);
        console.error('Original log message:', logMessage);
        
        // Try to show a fallback error message
        try {
            this.messages.showError(
                'Logging Error', 
                'Failed to display a log message. See console for details.',
                { autoHide: true, autoHideDelay: 3000 }
            );
        } catch (fallbackError) {
            console.error('MessagesLogAdapter: Even fallback message failed:', fallbackError);
        }
    }

    /**
     * Format a user-friendly title from logger name and level
     */
    private formatTitle(logName: string, level: string): string {
        const levelUpper = level.toUpperCase();
        
        // Clean up logger name for display
        const cleanName = logName
            .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
            .replace(/^\s+/, '') // Remove leading space
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
        
        switch (levelUpper) {
            case 'ERROR':
            case 'FATAL':
                return `Error in ${cleanName}`;
            case 'WARN':
                return `Warning from ${cleanName}`;
            case 'INFO':
                return `Info: ${cleanName}`;
            case 'DEBUG':
            case 'TRACE':
                return `Debug: ${cleanName}`;
            default:
                return `${cleanName}: ${levelUpper}`;
        }
    }

    /**
     * Format the description from log message content
     */
    private formatDescription(logMessage: LogMessage): string {
        let description = logMessage.message || '';
        
        // Include exception details if present
        if (logMessage.exception) {
            description += `\n\nError details: ${logMessage.exception}`;
        }
        
        // Include args if present and useful
        if (logMessage.args && logMessage.args.length > 0) {
            const argsStr = logMessage.args
                .map((arg: unknown) => {
                    if (typeof arg === 'object' && arg !== null) {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch {
                            return String(arg);
                        }
                    }
                    return String(arg);
                })
                .join(', ');
            
            if (argsStr.length < 200) { // Only include if not too long
                description += `\n\nDetails: ${argsStr}`;
            }
        }
        
        return description || 'No message details available';
    }

    /**
     * Get message options based on log level
     */
    private getMessageOptions(level: string) {
        const levelUpper = level.toUpperCase();
        
        switch (levelUpper) {
            case 'ERROR':
            case 'FATAL':
                return {
                    dismissible: true,
                    autoHide: false, // Errors should stay visible
                    persistent: true // Errors are permanent until manually dismissed
                };
            case 'WARN':
                return {
                    dismissible: true,
                    autoHide: false, // Warnings should stay visible
                    persistent: true // Warnings are permanent until manually dismissed
                };
            case 'INFO':
                return {
                    dismissible: true,
                    autoHide: true,
                    autoHideDelay: 5000,
                    persistent: false
                };
            case 'DEBUG':
            case 'TRACE':
                return {
                    dismissible: true,
                    autoHide: true,
                    autoHideDelay: 3000, // Debug messages disappear faster
                    persistent: false
                };
            default:
                return {
                    dismissible: true,
                    autoHide: true,
                    autoHideDelay: 4000,
                    persistent: false
                };
        }
    }
}
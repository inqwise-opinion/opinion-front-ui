import { LogChannel, RawLogChannel } from 'typescript-logging';
import { ChannelConfig, ChannelType, CustomLogChannel, CustomRawLogChannel, MultiChannelConfig, AsyncConsumerChannelConfig, LogFormat, LogFormatPresets, LogMessage } from './ChannelTypes';

/**
 * Factory for creating logging channels
 * @internal - For internal use only
 */
export class ChannelFactory {
    
    /**
     * Create a channel from configuration
     * @internal
     */
    public static createChannel(config: ChannelConfig): LogChannel | RawLogChannel {
        switch (config.type) {
            case ChannelType.CONSOLE:
                return this.getDefaultConsoleChannel();
                
            case ChannelType.CUSTOM:
                return this.mapCustomChannelToLibrary(config.channel);
                
            case ChannelType.MULTI:
                return this.createMultiChannel(config);
                
            case ChannelType.ASYNC_CONSUMER:
                return this.createAsyncConsumerChannel(config);
                
            default:
                const _exhaustive: never = config;
                throw new Error(`Unknown channel type: ${(_exhaustive as any).type}`);
        }
    }
    
    /**
     * Format a log message according to the specified format
     * @internal
     */
    private static formatLogMessage(logMessage: any, format?: LogFormat | LogFormatPresets): string {
        // Default format if none specified
        if (!format) {
            format = LogFormatPresets.SIMPLE;
        }
        
        // Handle preset formats
        if (typeof format === 'string' && Object.values(LogFormatPresets).includes(format as LogFormatPresets)) {
            switch (format as LogFormatPresets) {
                case LogFormatPresets.JSON:
                    return JSON.stringify({
                        timestamp: new Date().toISOString(),
                        level: logMessage.level?.toString() || 'INFO',
                        logger: Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown'),
                        message: logMessage.message || '',
                        args: logMessage.args
                    });
                case LogFormatPresets.COMPACT:
                    format = '{level} {logger}: {message}';
                    break;
                case LogFormatPresets.DETAILED:
                    format = '{timestamp} [{level}] [{logger}] {message} {args}';
                    break;
                case LogFormatPresets.SIMPLE:
                default:
                    format = '{timestamp} [{level}] {logger}: {message}';
                    break;
            }
        }
        
        // Handle function format
        if (typeof format === 'function') {
            const logMsg: LogMessage = {
                level: logMessage.level?.toString() || 'INFO',
                timeInMillis: logMessage.timeInMillis || Date.now(),
                logName: Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown'),
                message: logMessage.message || '',
                exception: logMessage.exception,
                args: logMessage.args
            };
            return format(logMsg);
        }
        
        // Handle string template format
        if (typeof format === 'string') {
            const timestamp = new Date().toISOString();
            const level = logMessage.level?.toString() || 'INFO';
            const logger = Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown');
            const message = logMessage.message || '';
            const args = logMessage.args && logMessage.args.length > 0 
                ? ' [' + logMessage.args.map((arg: any) => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(', ') + ']'
                : '';
            
            return format
                .replace('{timestamp}', timestamp)
                .replace('{level}', level.toUpperCase())
                .replace('{logger}', logger)
                .replace('{message}', message)
                .replace('{args}', args);
        }
        
        // Fallback to default format
        const timestamp = new Date().toISOString();
        const level = logMessage.level?.toString() || 'INFO';
        const logger = Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown');
        const message = logMessage.message || '';
        return `${timestamp} [${level.toUpperCase()}] ${logger}: ${message}`;
    }

    /**
     * Get default console channel
     * @internal
     */
    public static getDefaultConsoleChannel(format?: LogFormat | LogFormatPresets): LogChannel {
        return {
            type: 'LogChannel',
            write: (logMessage: any) => {
                // Use format processing if available, otherwise fall back to parsing pre-formatted messages
                let formattedOutput: string;
                
                if (format) {
                    // Use the specified format
                    formattedOutput = this.formatLogMessage(logMessage, format);
                } else {
                    // Legacy behavior - parse pre-formatted messages
                    let level: string;
                    let loggerName: string;
                    let actualMessage: string;
                    const timestamp = new Date().toISOString();
                    
                    // Check if the message is pre-formatted by typescript-logging
                    if (logMessage.message && typeof logMessage.message === 'string') {
                        // Pattern: "2025-10-03 17:47:25,102 INFO  [_OpinionApp] LoggerFactory integrated..."
                        const preFormattedMatch = logMessage.message.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/);
                        
                        if (preFormattedMatch) {
                            // Extract from pre-formatted message
                            level = preFormattedMatch[1];
                            loggerName = preFormattedMatch[2];
                            actualMessage = preFormattedMatch[3];
                        } else {
                            // Fallback to library-provided values
                            level = logMessage.level?.toString() || 'INFO';
                            loggerName = Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown');
                            actualMessage = logMessage.message;
                        }
                    } else {
                        // Fallback to library-provided values
                        level = logMessage.level?.toString() || 'INFO';
                        loggerName = Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown');
                        actualMessage = logMessage.message || '';
                    }
                    
                    formattedOutput = `${timestamp} [${level.toUpperCase()}] ${loggerName}: ${actualMessage}`;
                }
                
                // Use appropriate console method based on level
                const level = logMessage.level?.toString() || 'INFO';
                const logMethod = this.getConsoleMethod(level);
                logMethod(formattedOutput);
                
                // Handle arguments if present (only when not using custom format)
                if (!format && logMessage.args && logMessage.args.length > 0) {
                    console.log('  └─ Args:', ...logMessage.args);
                }
                
                // Handle exceptions (only when not using custom format)
                if (!format && logMessage.exception) {
                    console.error('  └─ Exception:', logMessage.exception);
                }
            }
        };
    }
    
    /**
     * Get the appropriate console method for the log level
     * @internal
     */
    private static getConsoleMethod(level: string): (...args: any[]) => void {
        const levelUpper = level.toUpperCase();
        switch (levelUpper) {
            case 'ERROR':
            case 'FATAL':
                return console.error;
            case 'WARN':
                return console.warn;
            case 'DEBUG':
            case 'TRACE':
                return console.debug;
            case 'INFO':
            default:
                return console.log;
        }
    }

    /**
     * Map our custom channel interfaces to the library's interfaces
     * @internal
     */
    private static mapCustomChannelToLibrary(channel: CustomLogChannel | CustomRawLogChannel): LogChannel | RawLogChannel {
        if (channel.type === 'LogChannel') {
            // Simple mapping - let 3rd party library handle the details
            const logChannel: LogChannel = {
                type: 'LogChannel',
                write: (libMsg: any) => {
                    // Parse the pre-formatted message to extract components
                    let level: string;
                    let loggerName: string;
                    let actualMessage: string;
                    
                    // Check if the message is pre-formatted by typescript-logging
                    if (libMsg.message && typeof libMsg.message === 'string') {
                        // Pattern: "2025-10-03 17:47:25,102 INFO  [CustomChannelLogger] Test message through custom channel"
                        const preFormattedMatch = libMsg.message.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/);
                        
                        if (preFormattedMatch) {
                            // Extract from pre-formatted message
                            level = preFormattedMatch[1];
                            loggerName = preFormattedMatch[2];
                            actualMessage = preFormattedMatch[3];
                        } else {
                            // Fallback to library-provided values
                            level = libMsg.level?.toString() || 'INFO';
                            loggerName = Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown');
                            actualMessage = libMsg.message;
                        }
                    } else {
                        // Fallback to library-provided values
                        level = libMsg.level?.toString() || 'INFO';
                        loggerName = Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown');
                        actualMessage = libMsg.message || '';
                    }
                    
                    // Handle Error objects - they come in the 'error' field as strings
                    let exception: Error | undefined;
                    if (libMsg.error && typeof libMsg.error === 'string') {
                        // Try to reconstruct Error object from string representation
                        const errorMatch = libMsg.error.match(/^Error: (.+)@/);
                        if (errorMatch) {
                            exception = new Error(errorMatch[1]);
                        }
                    } else if (libMsg.exception) {
                        exception = libMsg.exception;
                    }
                    
                    // Create our LogMessage interface
                    const ourMsg = {
                        level: level,
                        timeInMillis: libMsg.timeInMillis || Date.now(),
                        logName: loggerName,
                        message: actualMessage,
                        exception: exception,
                        args: libMsg.args
                    };
                    channel.write(ourMsg);
                }
            };
            return logChannel;
        } else {
            // Simple mapping for raw channel
            const rawChannel: RawLogChannel = {
                type: 'RawLogChannel',
                write: (libMsg: any, formatArg: (arg: unknown) => string) => {
                    // Parse the pre-formatted message to extract components
                    let level: string;
                    let loggerName: string;
                    let actualMessage: string;
                    
                    // Check if the message is pre-formatted by typescript-logging
                    if (libMsg.message && typeof libMsg.message === 'string') {
                        // Pattern: "2025-10-03 17:47:25,102 INFO  [CustomChannelLogger] Test message through custom channel"
                        const preFormattedMatch = libMsg.message.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/);
                        
                        if (preFormattedMatch) {
                            // Extract from pre-formatted message
                            level = preFormattedMatch[1];
                            loggerName = preFormattedMatch[2];
                            actualMessage = preFormattedMatch[3];
                        } else {
                            // Fallback to library-provided values
                            level = libMsg.level?.toString() || 'INFO';
                            loggerName = Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown');
                            actualMessage = libMsg.message;
                        }
                    } else {
                        // Fallback to library-provided values
                        level = libMsg.level?.toString() || 'INFO';
                        loggerName = Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown');
                        actualMessage = libMsg.message || '';
                    }
                    
                    // Handle Error objects - they come in the 'error' field as strings
                    let exception: Error | undefined;
                    if (libMsg.error && typeof libMsg.error === 'string') {
                        // Try to reconstruct Error object from string representation
                        const errorMatch = libMsg.error.match(/^Error: (.+)@/);
                        if (errorMatch) {
                            exception = new Error(errorMatch[1]);
                        }
                    } else if (libMsg.exception) {
                        exception = libMsg.exception;
                    }
                    
                    // Create our LogMessage interface
                    const ourMsg = {
                        level: level,
                        timeInMillis: libMsg.timeInMillis || Date.now(),
                        logName: loggerName,
                        message: actualMessage,
                        exception: exception,
                        args: libMsg.args
                    };
                    channel.write(ourMsg, formatArg);
                }
            };
            return rawChannel;
        }
    }

    /**
     * Create an async consumer channel that routes to LoggerFactory's consumer system
     * @internal
     */
    private static createAsyncConsumerChannel(config: AsyncConsumerChannelConfig): LogChannel {
        return {
            type: 'LogChannel',
            write: (logMessage: any) => {
                // This is a placeholder - the actual routing to consumers
                // will be handled by LoggerFactory when it overrides this method
                const ourMsg = {
                    level: logMessage.level?.toString() || 'INFO',
                    timeInMillis: logMessage.timeInMillis || Date.now(),
                    logName: Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown'),
                    message: logMessage.message || '',
                    exception: logMessage.exception,
                    args: logMessage.args
                };
                
                // The LoggerFactory will override this channel's write method
                // to route messages to the appropriate async consumers
                // Temporary placeholder - will be overridden by LoggerFactory
            }
        };
    }

    /**
     * Create a multi-channel that writes to multiple channels simultaneously
     * @internal
     */
    private static createMultiChannel(config: MultiChannelConfig): LogChannel {
        // Prevent infinite recursion by ensuring no nested multi-channels
        const nonMultiChannels = config.channels.filter(ch => ch.type !== ChannelType.MULTI);
        
        if (nonMultiChannels.length === 0) {
            throw new Error('Multi-channel must contain at least one non-multi channel');
        }
        
        // Create all the individual channels
        const channels = nonMultiChannels.map(channelConfig => 
            this.createChannel(channelConfig)
        );
        
        // Return a LogChannel that writes to all channels
        return {
            type: 'LogChannel',
            write: (logMessage: any) => {
                // Write to all channels
                channels.forEach(channel => {
                    try {
                        if (channel.type === 'LogChannel') {
                            channel.write(logMessage);
                        } else {
                            // For RawLogChannel, we need to simulate the formatArg function
                            const formatArg = (arg: unknown) => {
                                if (arg === null || arg === undefined) return String(arg);
                                if (typeof arg === 'string') return arg;
                                if (typeof arg === 'object') {
                                    try {
                                        return JSON.stringify(arg);
                                    } catch {
                                        return String(arg);
                                    }
                                }
                                return String(arg);
                            };
                            
                            // Convert LogMessage to RawLogMessage-like structure
                            const rawMessage = {
                                ...logMessage,
                                args: logMessage.args || []
                            };
                            
                            channel.write(rawMessage, formatArg);
                        }
                    } catch (error) {
                        // Don't let one channel failure break others
                        console.error('Channel write error:', error);
                    }
                });
            }
        };
    }
}

import { LogChannel, RawLogChannel } from 'typescript-logging';
import { ChannelConfig, ChannelType, CustomLogChannel, CustomRawLogChannel, MultiChannelConfig, AsyncConsumerChannelConfig } from './ChannelTypes';

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
     * Get default console channel
     * @internal
     */
    public static getDefaultConsoleChannel(): LogChannel {
        return {
            type: 'LogChannel',
            write: (logMessage: any) => {
                // Simple console output with timestamp and level
                const timestamp = new Date(logMessage.timeInMillis || Date.now()).toISOString();
                const level = logMessage.level?.toString() || 'INFO';
                const logName = Array.isArray(logMessage.logNames) ? logMessage.logNames[0] : (logMessage.logNames || 'unknown');
                const message = logMessage.message || '';
                
                console.log(`${timestamp} [${level}] ${logName}: ${message}`);
                
                if (logMessage.exception) {
                    console.error(logMessage.exception);
                }
            }
        };
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
                    // Simple mapping to our interface
                    const ourMsg = {
                        level: libMsg.level?.toString() || 'INFO',
                        timeInMillis: libMsg.timeInMillis || Date.now(),
                        logName: Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown'),
                        message: libMsg.message || '',
                        exception: libMsg.exception,
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
                    const ourMsg = {
                        level: libMsg.level?.toString() || 'INFO',
                        timeInMillis: libMsg.timeInMillis || Date.now(),
                        logName: Array.isArray(libMsg.logNames) ? libMsg.logNames[0] : (libMsg.logNames || 'unknown'),
                        message: libMsg.message || '',
                        exception: libMsg.exception,
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
                console.log(`AsyncConsumerChannel[${config.channelName}]:`, ourMsg);
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

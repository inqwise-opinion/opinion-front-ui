/**
 * Log message interface for custom channels
 */
export interface LogMessage {
    readonly level: string;
    readonly timeInMillis: number;
    readonly logName: string;
    readonly message: string;
    readonly exception?: Error;
    readonly args?: ReadonlyArray<unknown>;
}

/**
 * Custom channel interface for formatted log messages
 */
export interface CustomLogChannel {
    readonly type: 'LogChannel';
    readonly write: (msg: LogMessage) => void;
}

/**
 * Custom raw channel interface for complete control over formatting
 */
export interface CustomRawLogChannel {
    readonly type: 'RawLogChannel';
    readonly write: (msg: LogMessage, formatArg: (arg: unknown) => string) => void;
}

/**
 * Simple channel types for client-side logging
 */
export enum ChannelType {
    CONSOLE = 'console',
    CUSTOM = 'custom',
    MULTI = 'multi',
    ASYNC_CONSUMER = 'async-consumer'
}

/**
 * Log format template type
 * 
 * String templates support the following placeholders:
 * - {timestamp}: Full ISO timestamp (e.g., '2025-10-07T14:05:23.000Z')
 * - {time}: 24-hour time with milliseconds (e.g., '14:05:23.123')
 * - {level}: Log level (INFO, ERROR, etc.)
 * - {logger}: Logger name
 * - {message}: The log message with {} placeholders interpolated
 * - {args}: Formatted remaining arguments (if any)
 * 
 * Message interpolation:
 * - Use {} in log messages for argument interpolation (e.g., 'User {} logged in', username)
 * - Error objects are formatted as "ErrorName: message"
 */
export type LogFormat = string | ((logMessage: LogMessage) => string);

/**
 * Predefined log formats
 */
export enum LogFormatPresets {
    SIMPLE = '{timestamp} [{level}] {logger}: {message}',
    DETAILED = '{timestamp} [{level}] [{logger}] {message} {args}',
    COMPACT = '{level} {logger}: {message}',
    JSON = 'json',
    CUSTOM = 'custom'
}

/**
 * Console channel configuration
 */
export interface ConsoleChannelConfig {
    type: ChannelType.CONSOLE;
    format?: LogFormat | LogFormatPresets;
}

/**
 * Custom channel configuration
 */
export interface CustomChannelConfig {
    type: ChannelType.CUSTOM;
    channel: CustomLogChannel | CustomRawLogChannel;
}

/**
 * Multi-channel configuration - logs to multiple channels simultaneously
 */
export interface MultiChannelConfig {
    type: ChannelType.MULTI;
    channels: ChannelConfig[];
}

/**
 * Async consumer channel configuration - routes to async consumers by channel name
 */
export interface AsyncConsumerChannelConfig {
    type: ChannelType.ASYNC_CONSUMER;
    channelName: string;
}

/**
 * Union type for channel configurations
 */
export type ChannelConfig = ConsoleChannelConfig | CustomChannelConfig | MultiChannelConfig | AsyncConsumerChannelConfig;

/**
 * Date formatter function type
 */
export type DateFormatter = (timeInMillis: number) => string;

/**
 * Argument formatter function type
 */
export type ArgumentFormatter = (arg: unknown) => string;

/**
 * Appender configuration interface
 */
export interface AppenderConfig {
    /** Unique identifier for this appender */
    name: string;
    
    /** Log level for this appender */
    level?: LogLevel;
    
    /** Groups that this appender should handle */
    groups?: string[] | RegExp[];
    
    /** Channel configuration for this appender */
    channel: ChannelConfig;
    
    /** Optional log format for this appender */
    format?: LogFormat | LogFormatPresets;
    
    /** Optional date formatter for this appender */
    dateFormatter?: DateFormatter;
    
    /** Optional argument formatter for this appender */
    argumentFormatter?: ArgumentFormatter;
    
    /** Whether this appender is enabled */
    enabled?: boolean;
}

/**
 * Import LogLevel from types (avoiding circular dependency)
 */
type LogLevel = import('./types').LogLevel;

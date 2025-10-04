import {
  Log4TSProvider,
  Log4TSConfigOptional,
  Log4TSGroupConfigOptional,
} from "typescript-logging-log4ts-style";
import {
  LogLevel as LibLogLevel,
  LogChannel,
  RawLogChannel,
} from "typescript-logging";
import { Logger } from "./Logger";
import { Constructor, LogLevel } from "./types";
import { ChannelConfig, ChannelType, AppenderConfig, LogMessage } from './ChannelTypes';
import { ChannelFactory } from './ChannelFactory';
import { AsyncConsumerLogChannel, AsyncLogConsumer, RemoveConsumerFunction } from './AsyncConsumerLogChannel';

/**
 * Parse string log level to LogLevel enum
 * @internal
 */
function parseLogLevel(level: string | number | LogLevel): LogLevel {
  // If already a LogLevel enum, return as-is
  if (typeof level === 'number' && level in LogLevel) {
    return level as LogLevel;
  }
  
  // If string, parse it
  if (typeof level === 'string') {
    const levelUpper = level.toUpperCase();
    switch (levelUpper) {
      case 'TRACE': return LogLevel.Trace;
      case 'DEBUG': return LogLevel.Debug;
      case 'INFO': return LogLevel.Info;
      case 'WARN': case 'WARNING': return LogLevel.Warn;
      case 'ERROR': return LogLevel.Error;
      case 'FATAL': return LogLevel.Fatal;
      case 'OFF': return LogLevel.Off;
      default:
        // Unknown log level, defaulting to INFO
        return LogLevel.Info;
    }
  }
  
  // Fallback for any other type
  return LogLevel.Info;
}

/**
 * Map our LogLevel enum to the library's LogLevel enum
 * @internal
 */
function mapLogLevel(level: LogLevel): LibLogLevel {
  switch (level) {
    case LogLevel.Trace:
      return LibLogLevel.Trace;
    case LogLevel.Debug:
      return LibLogLevel.Debug;
    case LogLevel.Info:
      return LibLogLevel.Info;
    case LogLevel.Warn:
      return LibLogLevel.Warn;
    case LogLevel.Error:
      return LibLogLevel.Error;
    case LogLevel.Fatal:
      return LibLogLevel.Fatal;
    case LogLevel.Off:
      return LibLogLevel.Off;
    default: {
      const _exhaustive: never = level;
      throw new Error(`Unknown log level: ${level}`);
    }
  }
}

/**
 * Configuration interface for LoggerFactory
 * Supports both simple configuration and full typescript-logging configuration
 */
export interface LoggerFactoryConfig {
  /** Provider name for the logging instance */
  providerName?: string;

  /** Simple log level configuration */
  globalLevel?: LogLevel;

  /** Simple channel configuration */
  defaultChannel?: ChannelConfig;

  /** Full typescript-logging configuration (takes precedence over simple config) */
  typescriptLoggingConfig?: Log4TSConfigOptional;

  /** Enhanced groups configuration that supports both our ChannelConfig and typescript-logging channels */
  groups?: Array<
    Log4TSGroupConfigOptional & {
      /** Optional channel override for this group using our ChannelConfig */
      channelConfig?: ChannelConfig;
    }
  >;

  /** Multi-appender configuration - each appender can have its own groups, levels, and channels */
  appenders?: AppenderConfig[];
}

/**
 * Factory class for creating and managing loggers
 * Provides a singleton pattern for logger instances
 */
export class LoggerFactory {
  private static instance: LoggerFactory;
  private static readonly MessagesAppender: AppenderConfig = {
    name: 'messages',
    enabled: true,
    level: LogLevel.Trace,
    channel: {
      type: ChannelType.ASYNC_CONSUMER,
      channelName: 'messages'
    },
    groups: [/.+/] // Match all logger names
  };
  
  private readonly provider: Log4TSProvider;
  private readonly loggerCache: Map<string, Logger> = new Map();
  private readonly config: LoggerFactoryConfig;
  private readonly asyncConsumers: Map<string, Set<AsyncLogConsumer>> = new Map();
  private hasMessagesAppenderBeenAdded = false;

  private constructor(config: LoggerFactoryConfig = {}) {
    // Try to load config file if no config provided
    let loadedConfig = config && Object.keys(config).length > 0 ? config : this.loadConfigFile();
    
    // Parse string levels in loaded config
    loadedConfig = this.parseStringLevelsInConfig(loadedConfig);
    
    // Determine configuration approach based on what's provided
    const useSimpleConfig = !loadedConfig.appenders && !loadedConfig.typescriptLoggingConfig && (
      loadedConfig.defaultChannel || loadedConfig.globalLevel
    );
    
    if (useSimpleConfig) {
      // Simple configuration approach - use defaultChannel and globalLevel
      const defaultConfig: LoggerFactoryConfig = {
        providerName: "OpinionFrontUI",
        globalLevel: LogLevel.Debug,
        defaultChannel: { type: ChannelType.CONSOLE }
      };
      
      this.config = {
        ...defaultConfig,
        ...loadedConfig,
      };
      
      // Create provider using simple configuration
      this.provider = this.createProviderFromSimpleConfig();
    } else {
      // Appenders-based configuration with default setup
      const defaultConfig: LoggerFactoryConfig = {
        providerName: "OpinionFrontUI",
        globalLevel: LogLevel.Debug,
        defaultChannel: { type: ChannelType.CONSOLE },
        appenders: [
          // Pre-configure the console appender
          {
            name: 'console',
            enabled: true,
            level: LogLevel.Debug,
            channel: { type: ChannelType.CONSOLE },
            groups: [/.+/] // Match all logger names
          } as AppenderConfig,
          // Pre-configure the MessagesAppender to avoid dynamic addition
          LoggerFactory.MessagesAppender
        ]
      };
      
      this.config = {
        ...defaultConfig,
        ...loadedConfig,
      };
      
      // Create provider using appenders configuration
      this.provider = this.createProviderFromAppendersConfig();
    }
    
    // Mark MessagesAppender as already added since it's pre-configured
    this.hasMessagesAppenderBeenAdded = true;
  }

  /**
   * Configure and get the singleton instance of LoggerFactory
   * Can only be called once to configure the instance
   */
  public static configure(config: LoggerFactoryConfig = {}): LoggerFactory {
    if (LoggerFactory.instance) {
      throw new Error(
        "LoggerFactory already configured. Use getInstance() to get the configured instance.",
      );
    }
    LoggerFactory.instance = new LoggerFactory(config);
    return LoggerFactory.instance;
  }

  /**
   * Get the singleton instance of LoggerFactory
   * If not already configured, creates instance with default configuration
   */
  public static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory();
    }
    return LoggerFactory.instance;
  }

  /**
   * Get a logger by class constructor
   */
  public getLogger<T>(clazz: Constructor<T>): Logger;

  /**
   * Get a logger by string name
   */
  public getLogger(name: string): Logger;

  /**
   * Implementation for both overloads
   */
  public getLogger<T>(nameOrClass: string | Constructor<T>): Logger {
    let loggerName: string;

    if (typeof nameOrClass === "string") {
      loggerName = nameOrClass;
    } else {
      // Extract class name from constructor function
      loggerName = nameOrClass.name || 'UnknownClass';
      
      // Validate that we got a meaningful name
      if (!loggerName || loggerName === 'UnknownClass') {
        // Could not determine class name, using fallback
        loggerName = 'UnknownClass';
      }
    }

    // Check if logger already exists in cache
    let logger = this.loggerCache.get(loggerName);
    if (!logger) {
      // Create new logger instance and cache it
      const log4tsLogger = this.provider.getLogger(loggerName);
      logger = new Logger(log4tsLogger);
      this.loggerCache.set(loggerName, logger);
    }

    return logger;
  }

  /**
   * Clear the logger cache - useful for testing
   * @private
   */
  private clearCache(): void {
    this.loggerCache.clear();
  }

  /**
   * Add a log consumer for a specific channel name
   * @param channelName The name of the channel to add the consumer to
   * @param consumer The log consumer to add
   * @returns Function to remove this consumer
   */
  public addLogConsumer(channelName: string, consumer: AsyncLogConsumer): RemoveConsumerFunction {
    // Get or create the set of consumers for this channel name
    let consumersSet = this.asyncConsumers.get(channelName);
    if (!consumersSet) {
      consumersSet = new Set<AsyncLogConsumer>();
      this.asyncConsumers.set(channelName, consumersSet);
    }
    
    // Add the consumer
    consumersSet.add(consumer);
    
    // Return removal function
    return () => {
      const consumers = this.asyncConsumers.get(channelName);
      if (consumers) {
        consumers.delete(consumer);
        // Clean up empty sets
        if (consumers.size === 0) {
          this.asyncConsumers.delete(channelName);
        }
      }
    };
  }

  /**
   * Convenience method to add a log consumer to the "messages" channel
   * MessagesAppender is pre-configured, so no dynamic addition needed
   * @param consumer The log consumer to add
   * @returns Function to remove this consumer
   */
  public messagesConsumer(consumer: AsyncLogConsumer): RemoveConsumerFunction {
    return this.addLogConsumer("messages", consumer);
  }

  /**
   * Parse string levels in configuration to LogLevel enums
   * @private
   */
  private parseStringLevelsInConfig(config: LoggerFactoryConfig): LoggerFactoryConfig {
    const parsedConfig = { ...config };
    
    // Parse globalLevel if it's a string
    if (parsedConfig.globalLevel && typeof parsedConfig.globalLevel === 'string') {
      parsedConfig.globalLevel = parseLogLevel(parsedConfig.globalLevel);
    }
    
    // Parse appender levels if they're strings
    if (parsedConfig.appenders) {
      parsedConfig.appenders = parsedConfig.appenders.map(appender => {
        const parsedAppender = { ...appender };
        if (parsedAppender.level && typeof parsedAppender.level === 'string') {
          parsedAppender.level = parseLogLevel(parsedAppender.level);
        }
        return parsedAppender;
      });
    }
    
    // Parse group levels if they're strings
    if (parsedConfig.groups) {
      parsedConfig.groups = parsedConfig.groups.map(group => {
        const parsedGroup = { ...group };
        if (parsedGroup.level && typeof parsedGroup.level === 'string') {
          parsedGroup.level = parseLogLevel(parsedGroup.level);
        }
        return parsedGroup;
      });
    }
    
    return parsedConfig;
  }

  /**
   * Load configuration from logger.json file if it exists
   * @private
   */
  private loadConfigFile(): LoggerFactoryConfig {
    try {
      // In a browser environment, we can't read files from filesystem
      // This would need to be loaded via fetch or embedded in the build
      if (typeof window !== 'undefined') {
        // Browser environment - config would need to be embedded or fetched
        return {};
      }
      
      // Node.js environment - try to read logger.json
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'logger.json');
      
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData) as LoggerFactoryConfig;
        // Logger configuration loaded from logger.json
        return config;
      }
    } catch (error) {
      // Failed to load logger.json configuration - using defaults
    }
    
    return {};
  }



  /**
   * Get all channel names that have consumers
   * @returns Array of channel names
   * @private
   */
  private getLogChannelNames(): string[] {
    return Array.from(this.asyncConsumers.keys());
  }

  /**
   * Get the number of consumers for a specific channel name
   * @param channelName The channel name
   * @returns Number of consumers
   * @private
   */
  private getLogConsumerCount(channelName: string): number {
    const consumers = this.asyncConsumers.get(channelName);
    return consumers ? consumers.size : 0;
  }

  /**
   * Clear all consumers for a specific channel name
   * @param channelName The channel name to clear
   * @private
   */
  private clearLogConsumers(channelName: string): void {
    this.asyncConsumers.delete(channelName);
  }

  /**
   * Clear all consumers for all channels
   * @private
   */
  private clearAllLogConsumers(): void {
    this.asyncConsumers.clear();
  }

  /**
   * Get an AsyncConsumerLogChannel for the specified name
   * This creates the channel if it doesn't exist and connects it to the consumers map
   * @param channelName The name of the channel
   * @returns AsyncConsumerLogChannel instance
   * @private
   */
  private getAsyncConsumerLogChannel(channelName: string): AsyncConsumerLogChannel {
    const channel = new AsyncConsumerLogChannel(channelName);
    
    // Override the write method to dispatch to our managed consumers
    const originalWrite = channel.write.bind(channel);
    channel.write = (message) => {
      // Get consumers for this channel name from our map
      const consumers = this.asyncConsumers.get(channelName);
      if (consumers && consumers.size > 0) {
        // Process each consumer asynchronously
        consumers.forEach(consumer => {
          this.processAsyncConsumer(consumer, message);
        });
      }
    };
    
    return channel;
  }

  /**
   * Process a message with a specific async consumer
   * @private
   */
  private async processAsyncConsumer(consumer: AsyncLogConsumer, message: LogMessage): Promise<void> {
    try {
      await consumer.consume(message);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (consumer.onError) {
        try {
          consumer.onError(err, message);
        } catch (onErrorErr) {
          console.error(`LoggerFactory: Consumer onError handler failed:`, onErrorErr);
        }
      } else {
        console.error(`LoggerFactory: Consumer failed:`, err);
      }
    }
  }

  /**
   * Create provider from typescript-logging configuration
   * @private
   */
  private createProviderFromTypescriptLoggingConfig(): Log4TSProvider {
    const tsConfig = this.config.typescriptLoggingConfig!;

    // Process groups if they have our channelConfig
    let processedGroups = tsConfig.groups;
    if (this.config.groups) {
      processedGroups = this.config.groups.map((group) => {
        const processedGroup: Record<string, unknown> = { ...group };

        // Convert our LogLevel to library LogLevel if present
        if (group.level !== undefined) {
          processedGroup.level = mapLogLevel(group.level);
        }

        // Convert our ChannelConfig to library channel if present
        if (group.channelConfig) {
          processedGroup.channel = ChannelFactory.createChannel(
            group.channelConfig,
          );
          delete processedGroup.channelConfig;
        }

        return processedGroup;
      });
    }

    // Create the final config with processed groups
    const finalConfig: Log4TSConfigOptional = {
      ...tsConfig,
      groups: processedGroups,
    };

    return Log4TSProvider.createProvider(
      this.config.providerName!,
      finalConfig,
    );
  }

  /**
   * Create provider from simple configuration
   * @private
   */
  private createProviderFromSimpleConfig(): Log4TSProvider {
    // Create channel from configuration
    const channel = ChannelFactory.createChannel(this.config.defaultChannel!);

    // Process groups if provided
    let groups = this.config.groups;
    if (groups) {
      groups = groups.map((group) => {
        const processedGroup: Record<string, unknown> = { ...group };

        // Convert our LogLevel to library LogLevel if present
        if (group.level !== undefined) {
          processedGroup.level = mapLogLevel(group.level);
        }

        // Convert our ChannelConfig to library channel if present
        if (group.channelConfig) {
          processedGroup.channel = ChannelFactory.createChannel(
            group.channelConfig,
          );
          delete processedGroup.channelConfig;
        }

        return processedGroup;
      });
    } else {
      // Default group if none provided
      groups = [
        {
          identifier: "default",
          expression: new RegExp(".+"), // Matches all logger names
          level: mapLogLevel(this.config.globalLevel!),
        },
      ];
    }

    // Initialize the Log4TS provider with simple configuration
    return Log4TSProvider.createProvider(this.config.providerName!, {
      level: mapLogLevel(this.config.globalLevel!),
      channel: channel,
      groups: groups,
    });
  }

  /**
   * Create provider from appenders configuration
   * @private
   */
  private createProviderFromAppendersConfig(): Log4TSProvider {
    const appenders = this.config.appenders!.filter(
      (appender) => appender.enabled !== false,
    );

    if (appenders.length === 0) {
      throw new Error("At least one enabled appender is required");
    }

    // Create a multi-appender channel that routes messages to appropriate appenders
    const multiAppenderChannel = this.createMultiAppenderChannel(appenders);

    // Collect all unique groups from all appenders
    const allGroups = new Set<string>();
    appenders.forEach((appender) => {
      if (appender.groups) {
        appender.groups.forEach((group) => {
          if (group instanceof RegExp) {
            allGroups.add(group.source);
          } else {
            allGroups.add(group);
          }
        });
      }
    });

    // Create groups configuration - if no specific groups, match everything
    const groups =
      allGroups.size > 0
        ? Array.from(allGroups).map((groupPattern) => ({
            identifier: groupPattern,
            expression: new RegExp(groupPattern),
            level: mapLogLevel(LogLevel.Trace), // Let appenders handle level filtering
          }))
        : [
            {
              identifier: "default",
              expression: new RegExp(".+"),
              level: mapLogLevel(LogLevel.Trace),
            },
          ];

    return Log4TSProvider.createProvider(this.config.providerName!, {
      level: mapLogLevel(LogLevel.Trace), // Let appenders handle level filtering
      channel: multiAppenderChannel,
      groups: groups,
    });
  }

  /**
   * Create a multi-appender channel that routes messages to appropriate appenders
   * @private
   */
  private createMultiAppenderChannel(appenders: AppenderConfig[]): LogChannel {
    return {
      type: "LogChannel",
      write: (logMessage: unknown) => {
        const logName = Array.isArray(logMessage.logNames)
          ? logMessage.logNames[0]
          : logMessage.logNames || "unknown";

        // Find matching appenders for this log message
        const matchingAppenders = appenders.filter((appender) =>
          this.appenderMatches(appender, logName, logMessage.level),
        );

        // Write to all matching appenders
        matchingAppenders.forEach((appender) => {
          try {
            // Special handling for ASYNC_CONSUMER channels
            if (appender.channel.type === ChannelType.ASYNC_CONSUMER) {
              this.handleAsyncConsumerAppender(appender, logMessage);
              return;
            }
            
            const appenderChannel = ChannelFactory.createChannel(
              appender.channel,
            );

            // Create formatted message for this appender
            const formattedMessage = this.formatMessageForAppender(
              logMessage,
              appender,
            );

            if (appenderChannel.type === "LogChannel") {
              appenderChannel.write(formattedMessage);
            } else {
              // Handle RawLogChannel
              const formatArg =
                appender.argumentFormatter ||
                ((arg: unknown) => {
                  if (arg === null || arg === undefined) return String(arg);
                  if (typeof arg === "string") return arg;
                  if (typeof arg === "object") {
                    try {
                      return JSON.stringify(arg);
                    } catch {
                      return String(arg);
                    }
                  }
                  return String(arg);
                });

              appenderChannel.write(formattedMessage, formatArg);
            }
          } catch (error) {
            console.error(`Error in appender ${appender.name}:`, error);
          }
        });
      },
    };
  }

  /**
   * Check if an appender matches the current log message
   * @private
   */
  private appenderMatches(
    appender: AppenderConfig,
    logName: string,
    messageLevel: string | undefined,
  ): boolean {
    // Check level
    if (appender.level !== undefined) {
      const appenderLevelValue = appender.level;
      const messageLevelValue = this.getLogLevelValue(messageLevel);
      if (messageLevelValue < appenderLevelValue) {
        return false;
      }
    }

    // Check groups
    if (appender.groups && appender.groups.length > 0) {
      const matches = appender.groups.some((group) => {
        if (group instanceof RegExp) {
          return group.test(logName);
        } else {
          return logName.includes(group);
        }
      });
      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get numeric value for log level comparison
   * @private
   */
  private getLogLevelValue(level: string | undefined): number {
    // Default to INFO if level is undefined or not a string
    if (!level) {
      return LogLevel.Info;
    }
    
    const levelMap: { [key: string]: number } = {
      TRACE: LogLevel.Trace,
      DEBUG: LogLevel.Debug,
      INFO: LogLevel.Info,
      WARN: LogLevel.Warn,
      ERROR: LogLevel.Error,
      FATAL: LogLevel.Fatal,
    };
    return levelMap[level.toUpperCase()] || LogLevel.Info;
  }

  /**
   * Handle ASYNC_CONSUMER appender by routing to the consumer system
   * @private
   */
  private handleAsyncConsumerAppender(appender: AppenderConfig, logMessage: unknown): void {
    const channelConfig = appender.channel as { channelName: string }; // AsyncConsumerChannelConfig
    const channelName = channelConfig.channelName;
    
    // Get consumers for this channel name from our map
    const consumers = this.asyncConsumers.get(channelName);
    if (consumers && consumers.size > 0) {
      // Create formatted message for this appender
      const formattedMessage = this.formatMessageForAppender(logMessage, appender);
      
      // Convert to our LogMessage interface
      // Apply same regex parsing as ChannelFactory to extract correct logger name
      let loggerName: string;
      let actualMessage: string;
      
      if (formattedMessage.message && typeof formattedMessage.message === 'string') {
        // Check for pre-formatted typescript-logging messages
        const preFormattedMatch = formattedMessage.message.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/);
        
        if (preFormattedMatch) {
          // Extract logger name from pre-formatted message
          loggerName = preFormattedMatch[2];
          actualMessage = preFormattedMatch[3];
        } else {
          // Fallback to library-provided values
          loggerName = Array.isArray(formattedMessage.logNames) 
            ? formattedMessage.logNames[0] 
            : (formattedMessage.logNames || 'unknown');
          actualMessage = formattedMessage.message;
        }
      } else {
        // Fallback to library-provided values
        loggerName = Array.isArray(formattedMessage.logNames) 
          ? formattedMessage.logNames[0] 
          : (formattedMessage.logNames || 'unknown');
        actualMessage = formattedMessage.message || '';
      }
      
      // Extract log level from pre-formatted message if available
      let logLevel = formattedMessage.level?.toString();
      
      if (!logLevel && formattedMessage.message && typeof formattedMessage.message === 'string') {
        // Try to extract level from pre-formatted typescript-logging messages
        const preFormattedMatch = formattedMessage.message.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/);
        if (preFormattedMatch) {
          logLevel = preFormattedMatch[1]; // Extract the log level from the formatted string
        }
      }
      
      const ourLogMessage: LogMessage = {
        level: logLevel || 'INFO',
        timeInMillis: formattedMessage.timeInMillis || Date.now(),
        logName: loggerName,
        message: actualMessage,
        exception: formattedMessage.exception,
        args: formattedMessage.args
      };
      
      // Process each consumer asynchronously
      consumers.forEach(consumer => {
        this.processAsyncConsumer(consumer, ourLogMessage);
      });
    }
  }

  /**
   * Format message for specific appender
   * @private
   */
  private formatMessageForAppender(
    logMessage: unknown,
    appender: AppenderConfig,
  ): unknown {
    const formatted = { ...logMessage };

    // Apply custom date formatter if provided
    if (appender.dateFormatter && logMessage.timeInMillis) {
      formatted.formattedDate = appender.dateFormatter(logMessage.timeInMillis);
    }

    // Add appender name for identification
    formatted.appenderName = appender.name;

    return formatted;
  }
}

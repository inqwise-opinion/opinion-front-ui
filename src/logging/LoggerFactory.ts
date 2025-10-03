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
    default:
      const _exhaustive: never = level;
      throw new Error(`Unknown log level: ${level}`);
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
    const loadedConfig = config && Object.keys(config).length > 0 ? config : this.loadConfigFile();
    
    this.config = {
      providerName: "Opinion",
      globalLevel: LogLevel.Debug,
      defaultChannel: { type: ChannelType.CONSOLE },
      ...loadedConfig,
    };

    // Use appenders config if provided, otherwise use typescript-logging or simple config
    if (this.config.appenders && this.config.appenders.length > 0) {
      this.provider = this.createProviderFromAppendersConfig();
    } else if (this.config.typescriptLoggingConfig) {
      this.provider = this.createProviderFromTypescriptLoggingConfig();
    } else {
      this.provider = this.createProviderFromSimpleConfig();
    }
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
      loggerName = nameOrClass.name;
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
   * On first call, automatically adds the MessagesAppender if no messages appender exists
   * @param consumer The log consumer to add
   * @returns Function to remove this consumer
   */
  public messagesConsumer(consumer: AsyncLogConsumer): RemoveConsumerFunction {
    // On first call, check if we need to add the messages appender
    if (!this.hasMessagesAppenderBeenAdded) {
      this.ensureMessagesAppender();
      this.hasMessagesAppenderBeenAdded = true;
    }
    
    return this.addLogConsumer("messages", consumer);
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
        console.log('Loaded logger configuration from logger.json');
        return config;
      }
    } catch (error) {
      console.warn('Failed to load logger.json configuration:', error);
    }
    
    return {};
  }

  /**
   * Ensure the messages appender exists in the configuration
   * @private
   */
  private ensureMessagesAppender(): void {
    // Check if there's already a messages appender
    const hasMessagesAppender = this.config.appenders?.some(
      appender => appender.name === 'messages' && 
                  appender.channel.type === ChannelType.ASYNC_CONSUMER &&
                  (appender.channel as any).channelName === 'messages'
    );
    
    if (!hasMessagesAppender) {
      // Add the static MessagesAppender to the configuration
      if (!this.config.appenders) {
        this.config.appenders = [];
      }
      
      this.config.appenders.push(LoggerFactory.MessagesAppender);
      
      // We need to recreate the provider with the new appender
      // This is a limitation - ideally we'd want dynamic appender addition
      console.warn('MessagesAppender added to configuration. Note: Provider recreation needed for full functionality.');
    }
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
        const processedGroup: any = { ...group };

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
        const processedGroup: any = { ...group };

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
      write: (logMessage: any) => {
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
    messageLevel: string,
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
  private getLogLevelValue(level: string): number {
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
  private handleAsyncConsumerAppender(appender: AppenderConfig, logMessage: any): void {
    const channelConfig = appender.channel as any; // AsyncConsumerChannelConfig
    const channelName = channelConfig.channelName;
    
    // Get consumers for this channel name from our map
    const consumers = this.asyncConsumers.get(channelName);
    if (consumers && consumers.size > 0) {
      // Create formatted message for this appender
      const formattedMessage = this.formatMessageForAppender(logMessage, appender);
      
      // Convert to our LogMessage interface
      const ourLogMessage: LogMessage = {
        level: formattedMessage.level?.toString() || 'INFO',
        timeInMillis: formattedMessage.timeInMillis || Date.now(),
        logName: Array.isArray(formattedMessage.logNames) 
          ? formattedMessage.logNames[0] 
          : (formattedMessage.logNames || 'unknown'),
        message: formattedMessage.message || '',
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
    logMessage: any,
    appender: AppenderConfig,
  ): any {
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

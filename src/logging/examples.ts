import { 
    LoggerFactory, 
    ChannelType, 
    LogLevel,
    type AsyncLogConsumer,
    type LogMessage,
    type CustomLogChannel,
    type CustomRawLogChannel
} from './index';

// ========================================
// BASIC LOGGER CONFIGURATION EXAMPLES
// ========================================

// Example: Default console logging (simplest option)
export function basicConsoleLoggingExample() {
    console.log('\n--- Basic Console Logging ---');
    
    // Uses console channel by default
    const factory = LoggerFactory.getInstance();
    const logger = factory.getLogger('MyApp');
    
    logger.debug('Debug message - might not show depending on level');
    logger.info('Application started successfully');
    logger.warn('This is a warning message');
    logger.error('An error occurred', new Error('Sample error'));
    
    console.log('✅ Basic console logging complete');
}

// Example: Configure with explicit console channel and custom settings
export function configuredConsoleLoggingExample() {
    console.log('\n--- Configured Console Logging ---');
    
    const factory = LoggerFactory.configure({
        providerName: 'MyAppProvider',
        globalLevel: LogLevel.Debug,
        defaultChannel: {
            type: ChannelType.CONSOLE
        }
    });
    
    // Create multiple loggers for different services
    const userLogger = factory.getLogger('UserService');
    const apiLogger = factory.getLogger('ApiClient');
    const dbLogger = factory.getLogger('Database');
    
    userLogger.info('User service initialized');
    apiLogger.debug('Making API call to /users');
    dbLogger.warn('Database pool nearly full');
    dbLogger.error('Failed to connect to database', new Error('Connection timeout'));
    
    console.log('✅ Configured console logging complete');
}

// Example: Custom LogChannel (formatted messages)
export function customLogChannelExample() {
    console.log('\n--- Custom Log Channel ---');
    
    const customChannel: CustomLogChannel = {
        type: 'LogChannel',
        write: (logMessage) => {
            // Custom formatting - could send to external service, localStorage, etc.
            const timestamp = new Date(logMessage.timeInMillis).toISOString();
            const formatted = `🔧 [CUSTOM] ${timestamp} [${logMessage.level}] ${logMessage.logName}: ${logMessage.message}`;
            console.log(formatted);
            
            // Could also send to external logging service
            // await sendToLoggingService(formatted);
        }
    };

    const factory = LoggerFactory.configure({
        defaultChannel: {
            type: ChannelType.CUSTOM,
            channel: customChannel
        }
    });

    const logger = factory.getLogger('CustomApp');
    logger.info('Using custom log channel');
    logger.warn('Custom channel warning');
    logger.error('Custom channel error', new Error('Custom error'));
    
    console.log('✅ Custom log channel example complete');
}

// Example: Custom RawLogChannel (full control over formatting)
export function customRawChannelExample() {
    console.log('\n--- Custom Raw Channel ---');
    
    const customRawChannel: CustomRawLogChannel = {
        type: 'RawLogChannel',
        write: (rawMessage, formatArg) => {
            // Full control over formatting
            const timestamp = new Date(rawMessage.timeInMillis).toISOString();
            const level = rawMessage.level;
            const logName = rawMessage.logName;
            
            let formatted = `⚙️ [RAW] ${timestamp} [${level}] ${logName}: ${rawMessage.message}`;
            
            // Add formatted arguments if present
            if (rawMessage.args && rawMessage.args.length > 0) {
                const formattedArgs = rawMessage.args.map(arg => formatArg(arg)).join(' ');
                formatted += ` | Args: ${formattedArgs}`;
            }
            
            // Add exception if present
            if (rawMessage.exception) {
                formatted += `\n   ❌ Error: ${rawMessage.exception.message}`;
                if (rawMessage.exception.stack) {
                    formatted += `\n   📋 Stack: ${rawMessage.exception.stack.split('\n').slice(0, 3).join('\n   ')}`;
                }
            }
            
            console.log(formatted);
        }
    };

    const factory = LoggerFactory.configure({
        defaultChannel: {
            type: ChannelType.CUSTOM,
            channel: customRawChannel
        }
    });

    const logger = factory.getLogger('RawCustomApp');
    logger.info('Using custom raw channel', { userId: 123, sessionId: 'abc-def' });
    logger.warn('Raw channel warning', { warningCode: 'W001' });
    logger.error('Error with custom raw formatting', new Error('Test error with stack trace'));
    
    console.log('✅ Custom raw channel example complete');
}

// ========================================
// ASYNC CONSUMER EXAMPLES
// ========================================

// ========================================
// Example 1: Basic Messages Consumer
// ========================================
export function basicMessagesConsumerExample() {
    // Create a simple async consumer that processes all log messages
    const messageProcessor: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const formattedMessage = {
                timestamp: new Date(message.timeInMillis).toISOString(),
                level: message.level,
                logger: message.logName,
                content: message.message,
                error: message.exception?.message
            };
            
            console.log('📝 Processing message:', JSON.stringify(formattedMessage, null, 2));
        },
        onError(error: Error, message: LogMessage): void {
            console.error(`Message processor failed for: "${message.message}":`, error);
        }
    };
    
    // Use the convenient messagesConsumer method
    const factory = LoggerFactory.getInstance();
    const removeConsumer = factory.messagesConsumer(messageProcessor);
    
    // Create a logger and log some messages
    const logger = factory.getLogger('UserService');
    
    logger.info('User session started', { userId: 123, sessionId: 'abc-123' });
    logger.warn('Rate limit approaching', { currentRate: 85, limit: 100 });
    logger.error('Authentication failed', new Error('Invalid credentials'));
    
    // Remove consumer after processing
    setTimeout(() => {
        removeConsumer();
        console.log('✅ Messages consumer removed');
    }, 500);
}

// ========================================
// Example 2: Multiple Consumers - Messages vs Specific Channel
// ========================================
export function multipleConsumersExample() {
    const factory = LoggerFactory.getInstance();
    
    // General message consumer using the convenient method
    const generalProcessor: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('📝 GENERAL: Processing message from', message.logName);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    };
    
    // Audit-specific consumer for sensitive operations
    const auditConsumer: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            if (message.level === 'WARN' || message.level === 'ERROR') {
                console.log('🔍 AUDIT: Logging security event:', message.message);
                // Simulate audit log storage
                await new Promise(resolve => setTimeout(resolve, 75));
            }
        }
    };
    
    // Add general consumer to "messages" channel using convenience method
    const removeGeneral = factory.messagesConsumer(generalProcessor);
    
    // Add audit consumer to specific "audit-logs" channel
    const removeAudit = factory.addLogConsumer('audit-logs', auditConsumer);
    
    console.log('Consumers added: general (messages) and audit (audit-logs)');
    
    const logger = factory.getLogger('SecurityService');
    logger.info('User login attempt', { userId: 456 });
    logger.warn('Multiple failed login attempts', { userId: 456, attempts: 3 });
    logger.error('Account locked due to suspicious activity', { userId: 456 });
    
    // Clean up
    setTimeout(() => {
        removeGeneral();
        removeAudit();
        console.log('✅ All consumers removed');
    }, 600);
}

// ========================================
// Example 3: Error Tracking with Messages Consumer
// ========================================
export function errorTrackingExample() {
    const factory = LoggerFactory.getInstance();
    
    // Error tracking consumer that processes all messages but only acts on errors
    const errorTracker: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            // Only process error and fatal level messages
            if (message.level === 'ERROR' || message.level === 'FATAL') {
                const errorData = {
                    timestamp: new Date(message.timeInMillis).toISOString(),
                    service: message.logName,
                    level: message.level,
                    message: message.message,
                    stackTrace: message.exception?.stack,
                    errorMessage: message.exception?.message
                };
                
                console.log('🚨 ERROR TRACKER: Reporting critical issue');
                console.log(JSON.stringify(errorData, null, 2));
                
                // Simulate sending to error tracking service (e.g., Sentry, Bugsnag)
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        },
        onError(error: Error, message: LogMessage): void {
            console.error('Error tracker itself failed:', error);
            // Fallback: at least log to console
            console.error('Original message that caused tracker failure:', message.message);
        }
    };
    
    // Use messagesConsumer to catch all log messages
    const removeErrorTracker = factory.messagesConsumer(errorTracker);
    
    // Create loggers and generate various log levels
    const apiLogger = factory.getLogger('ApiService');
    const dbLogger = factory.getLogger('DatabaseService');
    const authLogger = factory.getLogger('AuthService');
    
    // These will be processed by error tracker
    apiLogger.info('API request started');
    apiLogger.warn('API rate limit approaching');
    apiLogger.error('API request failed', new Error('Network timeout'));
    
    dbLogger.info('Database connection established');
    dbLogger.fatal('Database corruption detected', new Error('Data integrity check failed'));
    
    authLogger.debug('Token validation started');
    authLogger.error('Authentication failed', new Error('Invalid JWT signature'));
    
    // Clean up
    setTimeout(() => {
        removeErrorTracker();
        console.log('✅ Error tracker removed');
    }, 800);
}

// ========================================
// Example 4: Analytics Consumer with Batching
// ========================================
export function analyticsConsumerExample() {
    const factory = LoggerFactory.getInstance();
    
    // Analytics consumer that batches messages
    class AnalyticsConsumer implements AsyncLogConsumer {
        private batch: LogMessage[] = [];
        private batchTimer: NodeJS.Timeout | null = null;
        
        async consume(message: LogMessage): Promise<void> {
            this.batch.push(message);
            
            // Send batch when it reaches 5 messages or after 2 seconds
            if (this.batch.length >= 5) {
                await this.sendBatch();
            } else if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => this.sendBatch(), 2000);
            }
        }
        
        private async sendBatch(): Promise<void> {
            if (this.batch.length === 0) return;
            
            const batchToSend = [...this.batch];
            this.batch = [];
            
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
                this.batchTimer = null;
            }
            
            console.log(`📈 ANALYTICS: Sending batch of ${batchToSend.length} messages`);
            // Simulate sending to analytics service
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        onError(error: Error, message: LogMessage): void {
            console.error('Analytics consumer failed:', error);
            // Remove failed message from batch
            const index = this.batch.indexOf(message);
            if (index > -1) {
                this.batch.splice(index, 1);
            }
        }
    }
    
    const analyticsConsumer = new AnalyticsConsumer();
    const removeAnalytics = factory.addLogConsumer('analytics', analyticsConsumer);
    
    const logger = factory.getLogger('UserActivity');
    
    // Generate some log messages
    for (let i = 0; i < 3; i++) {
        logger.info(`User action ${i + 1}`, { actionId: i + 1 });
    }
    
    // Clean up after testing
    setTimeout(() => {
        removeAnalytics();
    }, 3000);
}

// ========================================
// Example 5: Consumer Management Operations
// ========================================
export function consumerManagementExample() {
    const factory = LoggerFactory.getInstance();
    
    // Add multiple consumers to different channels
    const consumer1: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('Consumer 1 processed:', message.message);
        }
    };
    
    const consumer2: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('Consumer 2 processed:', message.message);
        }
    };
    
    const consumer3: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('Consumer 3 processed:', message.message);
        }
    };
    
    // Add consumers to different channels
    const remove1 = factory.addLogConsumer('channel-1', consumer1);
    const remove2 = factory.addLogConsumer('channel-1', consumer2);
    const remove3 = factory.addLogConsumer('channel-2', consumer3);
    
    console.log('Added consumers to channels');
    
    // Test logging to trigger the consumers
    const logger1 = factory.getLogger('TestService1');
    const logger2 = factory.getLogger('TestService2');
    
    logger1.info('Message to channel-1 consumers');
    logger2.warn('Message to channel-2 consumers');
    
    // Clean up using the returned removal functions
    setTimeout(() => {
        remove1();
        remove2();
        remove3();
        console.log('All consumers removed');
    }, 500);
}

// ========================================
// Example 5: Real-world Usage with messagesConsumer  
// ========================================
export function realWorldUsageExample() {
    const factory = LoggerFactory.getInstance();
    
    // Application monitoring consumer
    const monitoringConsumer: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            // Monitor all application activity
            const logData = {
                timestamp: new Date(message.timeInMillis).toISOString(),
                service: message.logName,
                level: message.level,
                message: message.message,
                hasError: !!message.exception
            };
            
            console.log('📈 MONITOR:', JSON.stringify(logData));
            
            // In real app: send to monitoring service (DataDog, New Relic, etc.)
            await new Promise(resolve => setTimeout(resolve, 25));
        }
    };
    
    // Performance metrics consumer for specific channel
    const performanceConsumer: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('⚡ PERF: Recording performance metric:', message.message);
            // In real app: send to metrics service
            await new Promise(resolve => setTimeout(resolve, 15));
        }
    };
    
    // Add monitoring to all messages using convenience method
    const removeMonitoring = factory.messagesConsumer(monitoringConsumer);
    
    // Add performance tracking to specific channel
    const removePerformance = factory.addLogConsumer('performance', performanceConsumer);
    
    // Create loggers for different services
    const orderLogger = factory.getLogger('OrderService');
    const paymentLogger = factory.getLogger('PaymentService');
    const inventoryLogger = factory.getLogger('InventoryService');
    
    // Simulate application activity
    orderLogger.info('Processing new order', { orderId: 'ORD-123', items: 3 });
    paymentLogger.info('Payment processing started', { amount: 99.99 });
    inventoryLogger.warn('Low stock alert', { productId: 'P001', remaining: 2 });
    
    paymentLogger.error('Payment declined', new Error('Insufficient funds'));
    orderLogger.info('Order completed successfully', { orderId: 'ORD-123' });
    
    // Clean up
    setTimeout(() => {
        removeMonitoring();
        removePerformance();
        console.log('✅ All monitoring consumers removed');
    }, 400);
}

// ========================================
// Run All Examples
// ========================================

// Run basic logger configuration examples
export function runBasicLoggerExamples() {
    console.log('\n\n🚀 === BASIC LOGGER CONFIGURATION EXAMPLES ===');
    
    basicConsoleLoggingExample();
    
    setTimeout(() => {
        configuredConsoleLoggingExample();
    }, 500);
    
    setTimeout(() => {
        customLogChannelExample();
    }, 1000);
    
    setTimeout(() => {
        customRawChannelExample();
    }, 1500);
    
    setTimeout(() => {
        console.log('\n✨ Basic logger examples complete!');
    }, 2000);
}

// Run async consumer examples
export function runAsyncConsumerExamples() {
    console.log('\n\n🔄 === ASYNC CONSUMER EXAMPLES ===');
    
    setTimeout(() => {
        console.log('\n=== Basic Messages Consumer ===');
        basicMessagesConsumerExample();
    }, 200);
    
    setTimeout(() => {
        console.log('\n=== Multiple Consumers (Messages vs Specific) ===');
        multipleConsumersExample();
    }, 1000);
    
    setTimeout(() => {
        console.log('\n=== Error Tracking with Messages Consumer ===');
        errorTrackingExample();
    }, 1800);
    
    setTimeout(() => {
        console.log('\n=== Analytics Consumer with Batching ===');
        analyticsConsumerExample();
    }, 2800);
    
    setTimeout(() => {
        console.log('\n=== Consumer Management Operations ===');
        consumerManagementExample();
    }, 3600);
    
    setTimeout(() => {
        console.log('\n=== Real-world Usage Example ===');
        realWorldUsageExample();
    }, 4400);
    
    setTimeout(() => {
        console.log('\n✨ Async consumer examples complete!');
    }, 5200);
}

// Run all examples (both basic logger and async consumer examples)
export function runAllLoggingExamples() {
    console.log('🎯 === COMPREHENSIVE LOGGING EXAMPLES ===');
    console.log('This will demonstrate all logging capabilities...');
    
    // Run basic logger examples first
    runBasicLoggerExamples();
    
    // Then run async consumer examples after basic examples complete
    setTimeout(() => {
        runAsyncConsumerExamples();
    }, 2500);
    
    // Final completion message
    setTimeout(() => {
        console.log('\n\n🎉 === ALL LOGGING EXAMPLES COMPLETE ===');
        console.log('You\'ve seen:');
        console.log('  ✅ Basic console logging');
        console.log('  ✅ Configured logging with multiple services');
        console.log('  ✅ Custom log channels with formatting');
        console.log('  ✅ Custom raw channels with full control');
        console.log('  ✅ Async message consumers for all logs');
        console.log('  ✅ Multiple consumers with channel separation');
        console.log('  ✅ Error tracking across all services');
        console.log('  ✅ Analytics with batching patterns');
        console.log('  ✅ Consumer management and cleanup');
        console.log('  ✅ Real-world monitoring scenarios');
        console.log('\n🚀 Ready to implement logging in your application!');
    }, 8000);
}

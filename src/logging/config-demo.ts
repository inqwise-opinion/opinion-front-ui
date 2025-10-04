import { 
    LoggerFactory, 
    LogLevel,
    type AsyncLogConsumer,
    type LogMessage
} from './index';

/**
 * Demonstration of new config file loading and automatic messages appender features
 */

// Example 1: Automatic config file loading
export function demoConfigFileLoading() {
    console.log('🔧 === Config File Loading Demo ===');
    console.log('LoggerFactory will automatically try to load logger.json if no config is provided.');
    
    // This will attempt to load logger.json from the current directory
    const factory = LoggerFactory.getInstance();
    
    // Create some loggers to test the configuration
    const userService = factory.getLogger('UserService');
    const orderController = factory.getLogger('OrderController');
    const apiHelper = factory.getLogger('ApiHelper');
    
    console.log('Testing logging with auto-loaded config...');
    userService.info('User service initialized with auto-config');
    orderController.warn('Order processing queue is full');
    apiHelper.error('API rate limit exceeded', new Error('Too many requests'));
    
    console.log('✅ Config file loading demo complete');
}

// Example 2: Automatic MessagesAppender creation
export function demoAutomaticMessagesAppender() {
    console.log('\n📨 === Automatic Messages Appender Demo ===');
    console.log('First call to messagesConsumer() will automatically add MessagesAppender');
    
    const factory = LoggerFactory.getInstance();
    
    // Create a consumer for messages
    const messageProcessor: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('🎯 MESSAGE PROCESSOR received:', {
                level: message.level,
                logger: message.logName,
                content: message.message,
                timestamp: new Date(message.timeInMillis).toISOString()
            });
            
            // Simulate async processing
            await new Promise(resolve => setTimeout(resolve, 10));
        },
        onError(error: Error, _message: LogMessage): void {
            console.error('Message processor failed:', error);
        }
    };
    
    // First call to messagesConsumer - this will trigger automatic MessagesAppender creation
    console.log('Adding first messages consumer (will create MessagesAppender automatically)...');
    const removeProcessor = factory.messagesConsumer(messageProcessor);
    
    // Create loggers and test messaging
    const testLogger1 = factory.getLogger('TestService1');
    const testLogger2 = factory.getLogger('TestService2');
    
    console.log('Testing automatic message routing...');
    testLogger1.info('This message should be processed by the messages consumer');
    testLogger1.warn('Warning message from TestService1');
    testLogger2.error('Error from TestService2', new Error('Test error'));
    
    // Add a second consumer to the same messages channel
    const analyticsProcessor: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            if (message.level === 'INFO') {
                console.log('📊 ANALYTICS: Info message from', message.logName);
            }
        }
    };
    
    console.log('Adding second messages consumer...');
    const removeAnalytics = factory.messagesConsumer(analyticsProcessor);
    
    // Test with multiple consumers
    testLogger1.info('This should trigger both message processor and analytics');
    testLogger2.debug('Debug message');
    
    // Cleanup
    setTimeout(() => {
        removeProcessor();
        removeAnalytics();
        console.log('✅ Automatic messages appender demo complete');
    }, 500);
}

// Example 3: Combined config file + messages consumer
export function demoCombinedFeatures() {
    console.log('\n🚀 === Combined Config File + Messages Consumer Demo ===');
    
    // This should load the logger.json configuration
    const factory = LoggerFactory.getInstance();
    
    // Create an error tracking consumer
    const errorTracker: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            if (message.level === 'ERROR' || message.level === 'FATAL') {
                console.log('🚨 ERROR TRACKER (from config):', {
                    service: message.logName,
                    error: message.message,
                    exception: message.exception?.message
                });
            }
        }
    };
    
    // Add to error-tracking channel (defined in logger.json)
    const removeErrorTracker = factory.addLogConsumer('error-tracking', errorTracker);
    
    // Create a general messages consumer
    const generalMonitor: AsyncLogConsumer = {
        async consume(message: LogMessage): Promise<void> {
            console.log('🔍 GENERAL MONITOR:', `[${message.level}] ${message.logName}: ${message.message}`);
        }
    };
    
    // This will use the messages appender from logger.json or create it automatically
    const removeMonitor = factory.messagesConsumer(generalMonitor);
    
    // Create loggers that match the config patterns
    const userService = factory.getLogger('UserService');     // Matches .*Service$ pattern
    const orderController = factory.getLogger('OrderController'); // Matches .*Controller$ pattern
    const utilHelper = factory.getLogger('UtilHelper');       // General logger
    
    console.log('Testing with config-based routing...');
    
    // These should go to both console and messages consumers (from config)
    userService.info('User authentication started');
    orderController.warn('Order validation warning');
    utilHelper.debug('Debug information from util');
    
    // These should also go to error-tracking channel (high level + matching pattern)
    userService.error('User authentication failed', new Error('Invalid credentials'));
    orderController.error('Order processing failed', new Error('Payment declined'));
    
    // This should only go to general channels (doesn't match Service/Controller pattern)
    utilHelper.error('Utility error', new Error('Generic error'));
    
    // Cleanup
    setTimeout(() => {
        removeErrorTracker();
        removeMonitor();
        console.log('✅ Combined features demo complete');
    }, 1000);
}

// Example 4: Manual configuration vs auto-loading
export function demoManualVsAutoConfig() {
    console.log('\n⚙️ === Manual vs Auto Config Demo ===');
    
    console.log('1. Auto-loaded config (from logger.json):');
    demoConfigFileLoading();
    
    setTimeout(() => {
        console.log('\n2. Manual config (overrides auto-loading):');
        
        // Manual configuration will override the file loading
        const manualFactory = LoggerFactory.configure({
            providerName: 'ManualConfig',
            globalLevel: LogLevel.Debug,
            appenders: [
                {
                    name: 'console-only',
                    enabled: true,
                    level: LogLevel.Info,
                    channel: { type: 'console' as any },
                    groups: [/.+/]
                }
            ]
        });
        
        const logger = manualFactory.getLogger('ManualTest');
        logger.info('This uses manual configuration, not logger.json');
        logger.debug('Debug message with manual config');
        
        console.log('✅ Manual vs auto config demo complete');
    }, 1500);
}

// Run all demos
export function runConfigDemos() {
    console.log('🎯 === CONFIGURATION & MESSAGES APPENDER DEMOS ===\n');
    
    demoAutomaticMessagesAppender();
    
    setTimeout(() => {
        demoCombinedFeatures();
    }, 2000);
    
    setTimeout(() => {
        demoManualVsAutoConfig();
    }, 4000);
    
    setTimeout(() => {
        console.log('\n🎉 === ALL CONFIG DEMOS COMPLETE ===');
        console.log('Key features demonstrated:');
        console.log('  ✅ Automatic logger.json config file loading');
        console.log('  ✅ Automatic MessagesAppender creation on first messagesConsumer() call');
        console.log('  ✅ ASYNC_CONSUMER channel type for routing to async consumers');
        console.log('  ✅ Integration between config-based appenders and runtime consumers');
        console.log('  ✅ Manual config override of auto-loading');
        console.log('\n💡 Check logger.json for sample configuration structure!');
    }, 7000);
}

// Uncomment to run the demos:
// runConfigDemos();
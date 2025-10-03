import { LoggerFactory } from './LoggerFactory';
import { Logger } from './Logger';
import { LogLevel, ChannelType } from './index';
import type { CustomLogChannel, LogMessage, AsyncLogConsumer } from './index';

/**
 * Integration tests for Logger class with LoggerFactory
 * 
 * These tests verify that Logger works correctly when created through LoggerFactory
 * and integrates properly with different channel configurations and async consumers.
 */

describe('Logger Integration Tests', () => {
    let factory: LoggerFactory;
    let capturedLogs: Array<{level: string, message: string, args: any[]}> = [];
    let testCounter = 0;

    beforeEach(() => {
        capturedLogs = [];
        testCounter++;
        
        // Reset LoggerFactory singleton by clearing any existing instance
        (LoggerFactory as any).instance = undefined;
    });

    afterEach(() => {
        capturedLogs = [];
        (LoggerFactory as any).instance = undefined;
    });

    describe('Basic Logger Factory Integration', () => {
        it('should create Logger through LoggerFactory with default configuration', () => {
            factory = LoggerFactory.configure({ providerName: `TestProvider${testCounter}` });
            const logger = factory.getLogger('TestService');
            
            expect(logger).toBeInstanceOf(Logger);
        });

        it('should create Logger through LoggerFactory with class constructor', () => {
            factory = LoggerFactory.configure({ providerName: `TestProvider${testCounter}` });
            
            class TestService {
                constructor() {}
            }
            
            const logger = factory.getLogger(TestService);
            
            expect(logger).toBeInstanceOf(Logger);
        });

        it('should reuse cached Logger instances', () => {
            factory = LoggerFactory.configure({ providerName: `TestProvider${testCounter}` });
            
            const logger1 = factory.getLogger('CachedService');
            const logger2 = factory.getLogger('CachedService');
            
            expect(logger1).toBe(logger2);
        });
    });

    describe('Logger with Custom Channel', () => {
        it('should log messages through custom channel', (done) => {
            const customChannel: CustomLogChannel = {
                type: 'LogChannel',
                write: (logMessage: LogMessage) => {
                    capturedLogs.push({
                        level: logMessage.level,
                        message: logMessage.message,
                        args: logMessage.args ? [...logMessage.args] : []
                    });
                    
                    // Verify the log was captured - the underlying library may format the message
                    expect(logMessage.level).toBe('INFO');
                    expect(logMessage.message).toContain('Test message through custom channel');
                    expect(logMessage.logName).toBe('CustomChannelLogger');
                    done();
                }
            };

            factory = LoggerFactory.configure({
                providerName: `CustomChannelTest${testCounter}`,
                globalLevel: LogLevel.Info,
                defaultChannel: {
                    type: ChannelType.CUSTOM,
                    channel: customChannel
                }
            });

            const logger = factory.getLogger('CustomChannelLogger');
            logger.info('Test message through custom channel');
        });

        it('should handle error logging with custom channel', (done) => {
            const customChannel: CustomLogChannel = {
                type: 'LogChannel',
                write: (logMessage: LogMessage) => {
                    expect(logMessage.level).toBe('ERROR');
                    expect(logMessage.message).toBe('Error occurred');
                    expect(logMessage.exception).toBeInstanceOf(Error);
                    expect(logMessage.exception?.message).toBe('Test error');
                    done();
                }
            };

            factory = LoggerFactory.configure({
                providerName: `ErrorChannelTest${testCounter}`,
                defaultChannel: {
                    type: ChannelType.CUSTOM,
                    channel: customChannel
                }
            });

            const logger = factory.getLogger('ErrorTestLogger');
            logger.error('Error occurred', new Error('Test error'));
        });
    });

    describe('Logger with Async Consumers', () => {
        it('should work with messagesConsumer for general logging', (done) => {
            factory = LoggerFactory.configure({ providerName: `AsyncProvider${testCounter}` });
            
            let messageCount = 0;
            const messageConsumer: AsyncLogConsumer = {
                async consume(message: LogMessage): Promise<void> {
                    messageCount++;
                    
                    if (messageCount === 1) {
                        expect(message.level).toBe('INFO');
                        expect(message.message).toBe('First message');
                    } else if (messageCount === 2) {
                        expect(message.level).toBe('WARN');
                        expect(message.message).toBe('Second message');
                    } else if (messageCount === 3) {
                        expect(message.level).toBe('ERROR');
                        expect(message.message).toBe('Third message');
                        done();
                    }
                }
            };

            factory.messagesConsumer(messageConsumer);
            
            const logger = factory.getLogger('AsyncTestLogger');
            
            // Small delays to ensure proper async processing order
            logger.info('First message');
            setTimeout(() => logger.warn('Second message'), 10);
            setTimeout(() => logger.error('Third message', new Error('Test error')), 20);
        });

        it('should handle async consumer errors gracefully', (done) => {
            factory = LoggerFactory.configure({ providerName: `ErrorProvider${testCounter}` });
            
            let errorHandled = false;
            const faultyConsumer: AsyncLogConsumer = {
                async consume(message: LogMessage): Promise<void> {
                    throw new Error('Consumer processing failed');
                },
                onError(error: Error, message: LogMessage): void {
                    expect(error.message).toBe('Consumer processing failed');
                    expect(message.message).toBe('Message that causes error');
                    errorHandled = true;
                }
            };

            // Spy on console.error to verify fallback error handling
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            factory.messagesConsumer(faultyConsumer);
            
            const logger = factory.getLogger('FaultyConsumerLogger');
            logger.info('Message that causes error');
            
            // Give async processing time to complete
            setTimeout(() => {
                expect(errorHandled).toBe(true);
                consoleErrorSpy.mockRestore();
                done();
            }, 100);
        });

        it('should support multiple async consumers on messages channel', (done) => {
            factory = LoggerFactory.configure({ providerName: `MultiProvider${testCounter}` });
            
            let consumer1Called = false;
            let consumer2Called = false;
            
            const consumer1: AsyncLogConsumer = {
                async consume(message: LogMessage): Promise<void> {
                    expect(message.message).toBe('Multiple consumer test');
                    consumer1Called = true;
                    checkCompletion();
                }
            };
            
            const consumer2: AsyncLogConsumer = {
                async consume(message: LogMessage): Promise<void> {
                    expect(message.message).toBe('Multiple consumer test');
                    consumer2Called = true;
                    checkCompletion();
                }
            };
            
            function checkCompletion() {
                if (consumer1Called && consumer2Called) {
                    done();
                }
            }

            factory.messagesConsumer(consumer1);
            factory.messagesConsumer(consumer2);
            
            const logger = factory.getLogger('MultiConsumerLogger');
            logger.info('Multiple consumer test');
        });
    });

    describe('Logger Method Coverage', () => {
        beforeEach(() => {
            const captureChannel: CustomLogChannel = {
                type: 'LogChannel',
                write: (logMessage: LogMessage) => {
                    capturedLogs.push({
                        level: logMessage.level,
                        message: logMessage.message,
                        args: logMessage.args ? [...logMessage.args] : []
                    });
                }
            };

            factory = LoggerFactory.configure({
                providerName: `CaptureProvider${testCounter}`,
                defaultChannel: {
                    type: ChannelType.CUSTOM,
                    channel: captureChannel
                }
            });
        });

        it('should handle all log levels correctly', () => {
            const logger = factory.getLogger('AllLevelsLogger');
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            logger.fatal('Fatal message');
            
            // Give some time for async processing
            setTimeout(() => {
                expect(capturedLogs).toHaveLength(5);
                expect(capturedLogs[0].level).toBe('DEBUG');
                expect(capturedLogs[1].level).toBe('INFO');
                expect(capturedLogs[2].level).toBe('WARN');
                expect(capturedLogs[3].level).toBe('ERROR');
                expect(capturedLogs[4].level).toBe('FATAL');
            }, 50);
        });

        it('should handle complex arguments across all methods', () => {
            const logger = factory.getLogger('ComplexArgsLogger');
            
            const userObject = { id: 123, name: 'John', roles: ['admin', 'user'] };
            const metadata = { timestamp: Date.now(), source: 'test' };
            const error = new Error('Complex test error');
            
            logger.debug('Debug with objects', userObject, metadata);
            logger.info('Info with data', userObject);
            logger.warn('Warning with metadata', metadata);
            logger.error('Error with object and error', error, userObject);
            logger.fatal('Fatal with all data', error, userObject, metadata);
            
            setTimeout(() => {
                expect(capturedLogs).toHaveLength(5);
                
                // Verify debug args
                expect(capturedLogs[0].args).toEqual([userObject, metadata]);
                
                // Verify info args
                expect(capturedLogs[1].args).toEqual([userObject]);
                
                // Verify warn args
                expect(capturedLogs[2].args).toEqual([metadata]);
                
                // Verify error with Error object and additional args
                expect(capturedLogs[3].args[0]).toBeInstanceOf(Error);
                expect(capturedLogs[3].args[1]).toEqual(userObject);
                
                // Verify fatal with Error object and additional args
                expect(capturedLogs[4].args[0]).toBeInstanceOf(Error);
                expect(capturedLogs[4].args[1]).toEqual(userObject);
                expect(capturedLogs[4].args[2]).toEqual(metadata);
            }, 50);
        });
    });

    describe('Logger Factory Configuration Integration', () => {
        it('should respect global log level configuration', () => {
            const captureChannel: CustomLogChannel = {
                type: 'LogChannel',
                write: (logMessage: LogMessage) => {
                    capturedLogs.push({
                        level: logMessage.level,
                        message: logMessage.message,
                        args: []
                    });
                }
            };

            // Configure with WARN level - debug and info should be filtered
            factory = LoggerFactory.configure({
                providerName: `LevelProvider${testCounter}`,
                globalLevel: LogLevel.Warn,
                defaultChannel: {
                    type: ChannelType.CUSTOM,
                    channel: captureChannel
                }
            });

            const logger = factory.getLogger('LevelTestLogger');
            
            logger.debug('This should not appear');
            logger.info('This should not appear');
            logger.warn('This should appear');
            logger.error('This should appear');
            logger.fatal('This should appear');
            
            setTimeout(() => {
                // Only warn, error, and fatal should be captured
                expect(capturedLogs).toHaveLength(3);
                expect(capturedLogs.map(log => log.level)).toEqual(['WARN', 'ERROR', 'FATAL']);
            }, 50);
        });

        it('should work with provider name configuration', () => {
            factory = LoggerFactory.configure({
                providerName: `TestProviderName${testCounter}`
            });

            const logger = factory.getLogger('ProviderTestLogger');
            expect(logger).toBeInstanceOf(Logger);
        });
    });

    describe('Edge Cases Integration', () => {
        it('should handle logger creation with empty string name', () => {
            factory = LoggerFactory.configure({ providerName: `EmptyProvider${testCounter}` });
            const logger = factory.getLogger('');
            
            expect(logger).toBeInstanceOf(Logger);
        });

        it('should handle rapid successive logging calls', (done) => {
            const captureChannel: CustomLogChannel = {
                type: 'LogChannel',
                write: (logMessage: LogMessage) => {
                    capturedLogs.push({
                        level: logMessage.level,
                        message: logMessage.message,
                        args: []
                    });
                }
            };

            factory = LoggerFactory.configure({
                providerName: `RapidProvider${testCounter}`,
                defaultChannel: {
                    type: ChannelType.CUSTOM,
                    channel: captureChannel
                }
            });

            const logger = factory.getLogger('RapidLogger');
            
            // Make many rapid calls
            for (let i = 0; i < 100; i++) {
                logger.info(`Message ${i}`);
            }
            
            setTimeout(() => {
                expect(capturedLogs).toHaveLength(100);
                expect(capturedLogs[0].message).toBe('Message 0');
                expect(capturedLogs[99].message).toBe('Message 99');
                done();
            }, 100);
        });
    });
});
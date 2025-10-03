import { Logger } from './Logger';
import { LogErrorType } from './types';
import { Logger as Log4TSLogger } from 'typescript-logging-log4ts-style';

/**
 * Comprehensive tests for the Logger class
 * 
 * Tests all logging methods (debug, info, warn, error, fatal) with various parameter combinations
 * and ensures proper delegation to the underlying typescript-logging library.
 */

describe('Logger', () => {
    let mockLog4TSLogger: jest.Mocked<Log4TSLogger>;
    let logger: Logger;

    beforeEach(() => {
        // Create a mock of the typescript-logging Log4TSLogger
        mockLog4TSLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            fatal: jest.fn(),
            trace: jest.fn(),
            isTraceEnabled: jest.fn(),
            isDebugEnabled: jest.fn(),
            isInfoEnabled: jest.fn(),
            isWarnEnabled: jest.fn(),
            isErrorEnabled: jest.fn(),
            isFatalEnabled: jest.fn(),
        } as any;

        logger = new Logger(mockLog4TSLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('debug method', () => {
        it('should call log4tsLogger.debug with message only', () => {
            const message = 'Debug message';
            
            logger.debug(message);
            
            expect(mockLog4TSLogger.debug).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.debug).toHaveBeenCalledWith(expect.any(Function));
            
            // Test that the function returns the correct message
            const messageFunction = mockLog4TSLogger.debug.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.debug with message and additional arguments', () => {
            const message = 'Debug with args';
            const arg1 = { userId: 123 };
            const arg2 = 'extra info';
            const arg3 = 42;
            
            logger.debug(message, arg1, arg2, arg3);
            
            expect(mockLog4TSLogger.debug).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.debug).toHaveBeenCalledWith(
                expect.any(Function),
                arg1,
                arg2,
                arg3
            );
            
            const messageFunction = mockLog4TSLogger.debug.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should handle empty additional arguments', () => {
            const message = 'Debug message';
            
            logger.debug(message, ...[]);
            
            expect(mockLog4TSLogger.debug).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.debug).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('info method', () => {
        it('should call log4tsLogger.info with message only', () => {
            const message = 'Info message';
            
            logger.info(message);
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.info).toHaveBeenCalledWith(expect.any(Function));
            
            const messageFunction = mockLog4TSLogger.info.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.info with message and additional arguments', () => {
            const message = 'Info with data';
            const sessionId = 'sess-123';
            const userAgent = 'Mozilla/5.0';
            
            logger.info(message, sessionId, userAgent);
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.info).toHaveBeenCalledWith(
                expect.any(Function),
                sessionId,
                userAgent
            );
            
            const messageFunction = mockLog4TSLogger.info.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should handle complex objects as arguments', () => {
            const message = 'User activity';
            const userObject = { id: 456, name: 'John Doe', roles: ['user', 'admin'] };
            const metadata = { timestamp: Date.now(), source: 'web' };
            
            logger.info(message, userObject, metadata);
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.info).toHaveBeenCalledWith(
                expect.any(Function),
                userObject,
                metadata
            );
        });
    });

    describe('warn method', () => {
        it('should call log4tsLogger.warn with message only', () => {
            const message = 'Warning message';
            
            logger.warn(message);
            
            expect(mockLog4TSLogger.warn).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.warn).toHaveBeenCalledWith(expect.any(Function));
            
            const messageFunction = mockLog4TSLogger.warn.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.warn with message and additional arguments', () => {
            const message = 'Rate limit warning';
            const currentRate = 85;
            const maxRate = 100;
            const timeWindow = '1 minute';
            
            logger.warn(message, currentRate, maxRate, timeWindow);
            
            expect(mockLog4TSLogger.warn).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.warn).toHaveBeenCalledWith(
                expect.any(Function),
                currentRate,
                maxRate,
                timeWindow
            );
        });
    });

    describe('error method', () => {
        it('should call log4tsLogger.error with message only', () => {
            const message = 'Error message';
            
            logger.error(message);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(expect.any(Function));
            
            const messageFunction = mockLog4TSLogger.error.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.error with message and Error object', () => {
            const message = 'Database connection failed';
            const error = new Error('Connection timeout');
            
            logger.error(message, error);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                error
            );
            
            const messageFunction = mockLog4TSLogger.error.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.error with message, Error object, and additional arguments', () => {
            const message = 'API request failed';
            const error = new Error('Network timeout');
            const requestId = 'req-456';
            const retryCount = 3;
            
            logger.error(message, error, requestId, retryCount);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                error,
                requestId,
                retryCount
            );
        });

        it('should convert string error to Error object', () => {
            const message = 'Something went wrong';
            const errorString = 'Invalid input';
            
            logger.error(message, errorString);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                expect.any(Error)
            );
            
            // Check that string was converted to Error object
            const errorArg = mockLog4TSLogger.error.mock.calls[0][1] as Error;
            expect(errorArg).toBeInstanceOf(Error);
            expect(errorArg.message).toBe(errorString);
        });

        it('should handle string error with additional arguments', () => {
            const message = 'Validation failed';
            const errorString = 'Missing required field';
            const fieldName = 'email';
            const validationRules = ['required', 'email'];
            
            logger.error(message, errorString, fieldName, validationRules);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                expect.any(Error),
                fieldName,
                validationRules
            );
            
            const errorArg = mockLog4TSLogger.error.mock.calls[0][1] as Error;
            expect(errorArg.message).toBe(errorString);
        });

        it('should call log4tsLogger.error with message and non-error arguments', () => {
            const message = 'Process failed';
            const statusCode = 500;
            const responseBody = { error: 'Internal server error' };
            
            logger.error(message, statusCode, responseBody);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                statusCode,
                responseBody
            );
        });

        it('should handle mixed argument types correctly', () => {
            const message = 'Mixed args test';
            const numberArg = 42;
            const stringArg = 'test';
            const objectArg = { key: 'value' };
            
            logger.error(message, numberArg, stringArg, objectArg);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                numberArg,
                stringArg,
                objectArg
            );
        });
    });

    describe('fatal method', () => {
        it('should call log4tsLogger.fatal with message only', () => {
            const message = 'Fatal error';
            
            logger.fatal(message);
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledWith(expect.any(Function));
            
            const messageFunction = mockLog4TSLogger.fatal.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(message);
        });

        it('should call log4tsLogger.fatal with message and Error object', () => {
            const message = 'System shutdown';
            const error = new Error('Critical system failure');
            
            logger.fatal(message, error);
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledWith(
                expect.any(Function),
                error
            );
        });

        it('should convert string error to Error object in fatal', () => {
            const message = 'Application crash';
            const errorString = 'Out of memory';
            
            logger.fatal(message, errorString);
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledTimes(1);
            
            const errorArg = mockLog4TSLogger.fatal.mock.calls[0][1] as Error;
            expect(errorArg).toBeInstanceOf(Error);
            expect(errorArg.message).toBe(errorString);
        });

        it('should call log4tsLogger.fatal with message, error, and additional arguments', () => {
            const message = 'Database corruption detected';
            const error = new Error('Data integrity check failed');
            const tableName = 'users';
            const corruptedRecords = 1523;
            
            logger.fatal(message, error, tableName, corruptedRecords);
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledWith(
                expect.any(Function),
                error,
                tableName,
                corruptedRecords
            );
        });

        it('should handle non-error arguments in fatal', () => {
            const message = 'Critical metrics';
            const cpuUsage = 99.8;
            const memoryUsage = 95.2;
            const diskSpace = 1.2; // GB remaining
            
            logger.fatal(message, cpuUsage, memoryUsage, diskSpace);
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledWith(
                expect.any(Function),
                cpuUsage,
                memoryUsage,
                diskSpace
            );
        });
    });

    describe('isLogErrorType method (private)', () => {
        // Testing the private method indirectly through error/fatal methods
        
        it('should identify Error objects as LogErrorType', () => {
            const message = 'Test error identification';
            const error = new Error('Test error');
            
            logger.error(message, error);
            
            // Should be treated as error parameter, not as regular argument
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                error
            );
        });

        it('should identify strings as LogErrorType', () => {
            const message = 'Test string identification';
            const errorString = 'String error';
            
            logger.error(message, errorString);
            
            // Should be converted to Error object
            const errorArg = mockLog4TSLogger.error.mock.calls[0][1];
            expect(errorArg).toBeInstanceOf(Error);
        });

        it('should not identify numbers as LogErrorType', () => {
            const message = 'Test number identification';
            const numberArg = 404;
            
            logger.error(message, numberArg);
            
            // Should be treated as regular argument
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                numberArg
            );
        });

        it('should not identify objects as LogErrorType', () => {
            const message = 'Test object identification';
            const objectArg = { status: 'error', code: 500 };
            
            logger.error(message, objectArg);
            
            // Should be treated as regular argument
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                objectArg
            );
        });

        it('should not identify null/undefined as LogErrorType', () => {
            const message = 'Test null identification';
            
            logger.error(message, null);
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledWith(
                expect.any(Function),
                null
            );
        });
    });

    describe('method overloads', () => {
        it('should support all debug overloads', () => {
            // Test different call patterns
            logger.debug('Simple message');
            logger.debug('Message with args', 'arg1', 2, { key: 'value' });
            
            expect(mockLog4TSLogger.debug).toHaveBeenCalledTimes(2);
        });

        it('should support all info overloads', () => {
            logger.info('Simple info');
            logger.info('Info with data', { userId: 123 }, 'session-abc');
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledTimes(2);
        });

        it('should support all warn overloads', () => {
            logger.warn('Simple warning');
            logger.warn('Warning with context', 'context1', 'context2');
            
            expect(mockLog4TSLogger.warn).toHaveBeenCalledTimes(2);
        });

        it('should support all error overloads', () => {
            const testError = new Error('Test error');
            
            // All possible error overloads
            logger.error('Simple error');
            logger.error('Error with args', 'arg1', 'arg2');
            logger.error('Error with Error object', testError);
            logger.error('Error with Error and args', testError, 'context');
            
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(4);
        });

        it('should support all fatal overloads', () => {
            const fatalError = new Error('Fatal error');
            
            logger.fatal('Simple fatal');
            logger.fatal('Fatal with args', 'arg1');
            logger.fatal('Fatal with Error', fatalError);
            logger.fatal('Fatal with Error and args', fatalError, 'critical');
            
            expect(mockLog4TSLogger.fatal).toHaveBeenCalledTimes(4);
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            logger.info('');
            logger.error('', new Error(''));
            logger.warn('', '');
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.warn).toHaveBeenCalledTimes(1);
        });

        it('should handle undefined arguments gracefully', () => {
            logger.debug('Debug message', undefined);
            logger.info('Info message', undefined, null);
            
            expect(mockLog4TSLogger.debug).toHaveBeenCalledWith(
                expect.any(Function),
                undefined
            );
            expect(mockLog4TSLogger.info).toHaveBeenCalledWith(
                expect.any(Function),
                undefined,
                null
            );
        });

        it('should handle very long messages', () => {
            const longMessage = 'A'.repeat(10000);
            
            logger.info(longMessage);
            
            const messageFunction = mockLog4TSLogger.info.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(longMessage);
        });

        it('should handle special characters in messages', () => {
            const specialMessage = 'Message with 🎉 emojis and special chars: ñáéíóú @#$%^&*()';
            
            logger.debug(specialMessage);
            
            const messageFunction = mockLog4TSLogger.debug.mock.calls[0][0] as Function;
            expect(messageFunction()).toBe(specialMessage);
        });

        it('should handle circular objects in arguments', () => {
            const circularObj: any = { name: 'test' };
            circularObj.self = circularObj;
            
            // Should not throw error
            expect(() => {
                logger.info('Circular object test', circularObj);
            }).not.toThrow();
            
            expect(mockLog4TSLogger.info).toHaveBeenCalledWith(
                expect.any(Function),
                circularObj
            );
        });
    });

    describe('message function behavior', () => {
        it('should pass message as function to underlying logger', () => {
            const testMessage = 'Test function message';
            
            logger.info(testMessage);
            
            // Verify the message is passed as a function
            const messageFunction = mockLog4TSLogger.info.mock.calls[0][0];
            expect(typeof messageFunction).toBe('function');
            expect(messageFunction()).toBe(testMessage);
        });

        it('should create new message function for each call', () => {
            logger.debug('First message');
            logger.debug('Second message');
            
            const firstMessageFn = mockLog4TSLogger.debug.mock.calls[0][0] as Function;
            const secondMessageFn = mockLog4TSLogger.debug.mock.calls[1][0] as Function;
            
            expect(firstMessageFn()).toBe('First message');
            expect(secondMessageFn()).toBe('Second message');
            expect(firstMessageFn).not.toBe(secondMessageFn);
        });
    });

    describe('constructor', () => {
        it('should require a Log4TSLogger instance', () => {
            const mockLogger = {} as Log4TSLogger;
            const newLogger = new Logger(mockLogger);
            
            expect(newLogger).toBeInstanceOf(Logger);
        });

        it('should store the provided Log4TSLogger', () => {
            // Test that the logger uses the provided instance
            const customMockLogger = {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                fatal: jest.fn(),
            } as any;
            
            const customLogger = new Logger(customMockLogger);
            customLogger.info('test');
            
            expect(customMockLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLog4TSLogger.info).not.toHaveBeenCalled();
        });
    });
});
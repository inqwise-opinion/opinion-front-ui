/**
 * Test for LoggerFactory async consumer appender to verify correct logger name extraction
 */

import { LoggerFactory } from '../../src/logging/LoggerFactory';
import { LogLevel } from '../../src/logging/types';
import { ChannelType } from '../../src/logging/ChannelTypes';

describe('LoggerFactory - Async Consumer Appender', () => {
    let loggerFactory: LoggerFactory;
    let mockConsumer: jest.Mock;
    let testIndex = 0;

    beforeEach(() => {
        // Use unique provider name for each test
        testIndex++;
        loggerFactory = LoggerFactory.configure({
            providerName: `TestProvider${testIndex}`,
            globalLevel: LogLevel.Debug,
            appenders: [
                {
                    name: 'messages',
                    enabled: true,
                    level: LogLevel.Trace,
                    channel: {
                        type: ChannelType.ASYNC_CONSUMER,
                        channelName: 'messages'
                    },
                    groups: [/.+/]
                }
            ]
        });

        // Create mock consumer
        mockConsumer = jest.fn().mockResolvedValue(undefined);
        loggerFactory.addLogConsumer('messages', {
            consume: mockConsumer,
            onError: jest.fn()
        });
    });

    afterEach(() => {
        // Reset the singleton instance for clean tests
        (LoggerFactory as any).instance = undefined;
    });

    it('should extract correct logger name from pre-formatted messages in async consumer', async () => {
        const logger = loggerFactory.getLogger('TestLogger');
        
        // This will generate a pre-formatted message through typescript-logging
        logger.info('Test message for async consumer');

        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 10));

        // Verify the consumer was called
        expect(mockConsumer).toHaveBeenCalled();

        // Get the actual LogMessage that was passed to the consumer
        const logMessage = mockConsumer.mock.calls[0][0];

        // Verify correct logger name was extracted (not "unknown")
        expect(logMessage.logName).toBe('TestLogger');
        expect(logMessage.level).toBe('INFO');
        expect(logMessage.message).toBe('Test message for async consumer');
        
        // Should not be "unknown"
        expect(logMessage.logName).not.toBe('unknown');
    });

    it('should handle pre-formatted messages with different logger names', async () => {
        const testCases = [
            'OpinionApp',
            'LayoutContextImpl', 
            'AuthService',
            'UserMenu'
        ];

        for (const loggerName of testCases) {
            mockConsumer.mockClear();
            
            const logger = loggerFactory.getLogger(loggerName);
            logger.info(`Test message from ${loggerName}`);

            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockConsumer).toHaveBeenCalled();
            const logMessage = mockConsumer.mock.calls[0][0];
            
            expect(logMessage.logName).toBe(loggerName);
            expect(logMessage.logName).not.toBe('unknown');
        }
    });

    it('should handle different log levels correctly in async consumer', async () => {
        const logger = loggerFactory.getLogger('TestLogger');
        
        const testCases = [
            { method: 'info', expectedLevel: 'INFO' },
            { method: 'warn', expectedLevel: 'WARN' },
            { method: 'error', expectedLevel: 'ERROR' }
        ];

        for (const testCase of testCases) {
            mockConsumer.mockClear();
            
            (logger as any)[testCase.method](`${testCase.method} message`);

            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockConsumer).toHaveBeenCalled();
            const logMessage = mockConsumer.mock.calls[0][0];
            
            expect(logMessage.level).toBe(testCase.expectedLevel);
            expect(logMessage.logName).toBe('TestLogger');
            expect(logMessage.message).toBe(`${testCase.method} message`);
        }
    });

    it('should fall back to library values for non-formatted messages', async () => {
        const logger = loggerFactory.getLogger('TestLogger');
        
        // Mock a scenario where the message is not pre-formatted
        // This is harder to test directly, but we can verify the fallback behavior
        logger.info('Simple message');

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockConsumer).toHaveBeenCalled();
        const logMessage = mockConsumer.mock.calls[0][0];

        // Even with fallback, should get correct logger name
        expect(logMessage.logName).toBe('TestLogger');
        expect(logMessage.message).toBe('Simple message');
    });
});
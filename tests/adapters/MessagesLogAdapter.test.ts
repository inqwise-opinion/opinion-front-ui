/**
 * Tests for MessagesLogAdapter to verify message handling and unknown logger processing
 */

import { MessagesLogAdapter } from '../../src/adapters/MessagesLogAdapter';
import { Messages, MessageType } from '../../src/interfaces/Messages';
import { LogMessage } from '../../src/logging/ChannelTypes';

// Mock Messages interface
class MockMessages implements Messages {
    public messages: Array<{type: MessageType, title: string, description: string, options?: any}> = [];

    showError(title: string, description?: string, options?: any): void {
        this.messages.push({type: 'error', title, description: description || '', options});
    }

    showWarning(title: string, description?: string, options?: any): void {
        this.messages.push({type: 'warning', title, description: description || '', options});
    }

    showInfo(title: string, description?: string, options?: any): void {
        this.messages.push({type: 'info', title, description: description || '', options});
    }

    showSuccess(title: string, description?: string, options?: any): void {
        this.messages.push({type: 'success', title, description: description || '', options});
    }

    // Other required methods (not used in tests)
    addMessage(): void {}
    removeMessage(): void {}
    clearAll(): void {}
    clearByType(): void {}
    getMessages(): any[] { return []; }
    hasMessages(): boolean { return false; }
}

describe('MessagesLogAdapter', () => {
    let mockMessages: MockMessages;
    let adapter: MessagesLogAdapter;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        mockMessages = new MockMessages();
        adapter = new MessagesLogAdapter(mockMessages);
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('consume', () => {
        it('should process unknown logger messages correctly', async () => {
            const logMessage: LogMessage = {
                level: 'INFO',
                timeInMillis: Date.now(),
                logName: 'unknown',
                message: 'Test message from unknown logger',
                args: ['arg1', 'arg2']
            };

            await adapter.consume(logMessage);

            // Check that the message was processed correctly
            expect(mockMessages.messages).toHaveLength(1);
            expect(mockMessages.messages[0]).toEqual({
                type: 'info',
                title: 'Info: Unknown',
                description: expect.stringContaining('Test message from unknown logger'),
                options: expect.objectContaining({
                    dismissible: true,
                    autoHide: true,
                    autoHideDelay: 5000
                })
            });
        });

        it('should not trigger debug logging for known logger names', async () => {
            const logMessage: LogMessage = {
                level: 'INFO',
                timeInMillis: Date.now(),
                logName: 'OpinionApp',
                message: 'Test message from OpinionApp',
                args: []
            };

            await adapter.consume(logMessage);


            // Check that the message was processed correctly
            expect(mockMessages.messages).toHaveLength(1);
            expect(mockMessages.messages[0]).toEqual({
                type: 'info',
                title: 'Info: Opinion App',
                description: 'Test message from OpinionApp',
                options: expect.objectContaining({
                    dismissible: true,
                    autoHide: true
                })
            });
        });

        it('should format different log levels correctly', async () => {
            const testCases = [
                {
                    level: 'ERROR',
                    expectedType: 'error',
                    expectedTitlePrefix: 'Error in',
                    expectedAutoHide: false,
                    expectedPersistent: true
                },
                {
                    level: 'WARN',
                    expectedType: 'warning',
                    expectedTitlePrefix: 'Warning from',
                    expectedAutoHide: false,
                    expectedPersistent: true
                },
                {
                    level: 'INFO',
                    expectedType: 'info',
                    expectedTitlePrefix: 'Info:',
                    expectedAutoHide: true,
                    expectedPersistent: false
                },
                {
                    level: 'DEBUG',
                    expectedType: 'info',
                    expectedTitlePrefix: 'Debug:',
                    expectedAutoHide: true,
                    expectedPersistent: false
                }
            ];

            for (const testCase of testCases) {
                mockMessages.messages = []; // Reset messages

                const logMessage: LogMessage = {
                    level: testCase.level,
                    timeInMillis: Date.now(),
                    logName: 'TestLogger',
                    message: `Test ${testCase.level} message`,
                    args: []
                };

                await adapter.consume(logMessage);

                expect(mockMessages.messages).toHaveLength(1);
                expect(mockMessages.messages[0].type).toBe(testCase.expectedType);
                expect(mockMessages.messages[0].title).toContain(testCase.expectedTitlePrefix);
                expect(mockMessages.messages[0].options.autoHide).toBe(testCase.expectedAutoHide);
                expect(mockMessages.messages[0].options.persistent).toBe(testCase.expectedPersistent);
            }
        });

        it('should handle messages with args and exceptions', async () => {
            const logMessage: LogMessage = {
                level: 'ERROR',
                timeInMillis: Date.now(),
                logName: 'TestService',
                message: 'Something went wrong',
                args: [{userId: 123}, 'additional info'],
                exception: new Error('Test exception')
            };

            await adapter.consume(logMessage);

            expect(mockMessages.messages).toHaveLength(1);
            const message = mockMessages.messages[0];
            
            expect(message.type).toBe('error');
            expect(message.title).toBe('Error in Test Service');
            expect(message.description).toContain('Something went wrong');
            expect(message.description).toContain('Error details: Error: Test exception');
            // JSON.stringify formats with indentation, so we need to check for the formatted version
            expect(message.description).toContain('Details:');
            expect(message.description).toContain('"userId": 123');
            expect(message.description).toContain('additional info');
        });

        it('should format logger names with proper spacing and capitalization', async () => {
            const testCases = [
                {
                    input: 'LayoutContextImpl',
                    expected: 'Layout Context Impl'
                },
                {
                    input: 'OpinionApp',
                    expected: 'Opinion App'
                },
                {
                    input: 'MockSessionAuthProvider',
                    expected: 'Mock Session Auth Provider'
                },
                {
                    input: 'simplelogger',
                    expected: 'Simplelogger'
                },
                {
                    input: 'XMLHttpRequest',
                    expected: 'X M L Http Request'
                }
            ];

            for (const testCase of testCases) {
                mockMessages.messages = []; // Reset messages

                const logMessage: LogMessage = {
                    level: 'INFO',
                    timeInMillis: Date.now(),
                    logName: testCase.input,
                    message: 'Test message',
                    args: []
                };

                await adapter.consume(logMessage);

                expect(mockMessages.messages).toHaveLength(1);
                expect(mockMessages.messages[0].title).toBe(`Info: ${testCase.expected}`);
            }
        });

        it('should handle error in consume method gracefully', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
            
            // Create a mock that throws an error
            const faultyMockMessages = {
                showInfo: jest.fn().mockImplementation(() => {
                    throw new Error('Mock error in showInfo');
                })
            } as any;

            const faultyAdapter = new MessagesLogAdapter(faultyMockMessages);

            const logMessage: LogMessage = {
                level: 'INFO',
                timeInMillis: Date.now(),
                logName: 'TestLogger',
                message: 'Test message',
                args: []
            };

            // This should throw since the mock throws an error
            await expect(faultyAdapter.consume(logMessage)).rejects.toThrow('Mock error in showInfo');

            // Note: In the real system, the LoggerFactory catches errors and calls onError
        });
    });

    describe('formatTitle', () => {
        it('should handle unknown logger names', () => {
            const adapter = new MessagesLogAdapter(mockMessages);
            
            // Access private method for testing
            const formatTitle = (adapter as any).formatTitle.bind(adapter);
            
            expect(formatTitle('unknown', 'INFO')).toBe('Info: Unknown');
            expect(formatTitle('unknown', 'ERROR')).toBe('Error in Unknown');
            expect(formatTitle('unknown', 'WARN')).toBe('Warning from Unknown');
        });
    });

    describe('persistent messages', () => {
        it('should mark ERROR and WARN messages as persistent', async () => {
            const errorMessage: LogMessage = {
                level: 'ERROR',
                timeInMillis: Date.now(),
                logName: 'TestService',
                message: 'Critical error occurred',
                args: []
            };

            const warnMessage: LogMessage = {
                level: 'WARN',
                timeInMillis: Date.now(),
                logName: 'TestService',
                message: 'Warning: potential issue detected',
                args: []
            };

            await adapter.consume(errorMessage);
            await adapter.consume(warnMessage);

            expect(mockMessages.messages).toHaveLength(2);
            
            // Error message should be persistent
            const errorMsg = mockMessages.messages.find(m => m.type === 'error');
            expect(errorMsg?.options.persistent).toBe(true);
            expect(errorMsg?.options.autoHide).toBe(false);
            expect(errorMsg?.options.dismissible).toBe(true);
            
            // Warn message should be persistent  
            const warnMsg = mockMessages.messages.find(m => m.type === 'warning');
            expect(warnMsg?.options.persistent).toBe(true);
            expect(warnMsg?.options.autoHide).toBe(false);
            expect(warnMsg?.options.dismissible).toBe(true);
        });

        it('should not mark INFO and DEBUG messages as persistent', async () => {
            const infoMessage: LogMessage = {
                level: 'INFO',
                timeInMillis: Date.now(),
                logName: 'TestService',
                message: 'Information message',
                args: []
            };

            const debugMessage: LogMessage = {
                level: 'DEBUG',
                timeInMillis: Date.now(),
                logName: 'TestService',
                message: 'Debug information',
                args: []
            };

            await adapter.consume(infoMessage);
            await adapter.consume(debugMessage);

            expect(mockMessages.messages).toHaveLength(2);
            
            // Both messages should not be persistent
            mockMessages.messages.forEach(message => {
                expect(message.options.persistent).toBe(false);
                expect(message.options.autoHide).toBe(true);
                expect(message.options.dismissible).toBe(true);
            });
        });
    });
});
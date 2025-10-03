/**
 * Tests for ChannelFactory message parsing and formatting
 */

import { ChannelFactory } from './ChannelFactory';

describe('ChannelFactory', () => {
    let consoleSpy: jest.SpyInstance;
    let logMethod: jest.Mock;

    beforeEach(() => {
        // Mock console methods
        logMethod = jest.fn();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(logMethod);
        jest.spyOn(console, 'error').mockImplementation(jest.fn());
        jest.spyOn(console, 'warn').mockImplementation(jest.fn());
        jest.spyOn(console, 'debug').mockImplementation(jest.fn());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getDefaultConsoleChannel', () => {
        it('should parse pre-formatted typescript-logging messages correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            // Mock pre-formatted message from typescript-logging
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 INFO  [OpinionApp] LoggerFactory integrated with Messages system",
                level: "INFO",
                logNames: ["unknown"], // This would be ignored in favor of parsed name
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            // Should extract the correct logger name from the message
            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] OpinionApp: LoggerFactory integrated with Messages system/)
            );
        });

        it('should parse DEBUG messages correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(jest.fn());
            
            const mockLogMessage = {
                message: "2025-10-03 15:53:46,866 DEBUG [LayoutContextImpl] Adding listener for event: user-menu-mode-change",
                level: "DEBUG",
                logNames: ["unknown"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(debugSpy).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] LayoutContextImpl: Adding listener for event: user-menu-mode-change/)
            );
        });

        it('should handle ERROR messages correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 ERROR [AppService] Something went wrong",
                level: "ERROR",
                logNames: ["unknown"],
                args: [],
                exception: null
            };

            // Mock console.error since ERROR level should use it
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());

            channel.write(mockLogMessage);

            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] AppService: Something went wrong/)
            );
        });

        it('should fall back to library values when regex does not match', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "This is a regular message without timestamp formatting",
                level: "INFO",
                logNames: ["TestLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            // Should use library-provided logger name
            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] TestLogger: This is a regular message without timestamp formatting/)
            );
        });

        it('should handle logNames array correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "Simple message",
                level: "WARN",
                logNames: ["FirstLogger", "SecondLogger"], // Should use first one
                args: [],
                exception: null
            };

            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

            channel.write(mockLogMessage);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] FirstLogger: Simple message/)
            );
        });

        it('should use "unknown" fallback when logNames is missing', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "Message without logger names",
                level: "INFO",
                logNames: undefined,
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] unknown: Message without logger names/)
            );
        });

        it('should handle arguments correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 INFO  [TestLogger] Message with args",
                level: "INFO",
                logNames: ["TestLogger"],
                args: [{ userId: 123 }, "test string"],
                exception: null
            };

            channel.write(mockLogMessage);

            // Check main message
            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] TestLogger: Message with args/)
            );

            // Check args were logged
            expect(logMethod).toHaveBeenCalledWith('  └─ Args:', { userId: 123 }, "test string");
        });

        it('should handle exceptions correctly', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
            
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 ERROR [TestLogger] Error occurred",
                level: "ERROR",
                logNames: ["TestLogger"],
                args: [],
                exception: new Error("Test exception")
            };

            channel.write(mockLogMessage);

            // Check exception was logged
            expect(errorSpy).toHaveBeenCalledWith('  └─ Exception:', expect.any(Error));
        });

        it('should handle unmatched messages with fallback', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "Unformatted message",
                level: "INFO",
                logNames: ["unknown"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            // Should use fallback values
            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] unknown: Unformatted message/)
            );
        });

        it('should handle different log levels with appropriate console methods', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(jest.fn());

            // Test ERROR level
            channel.write({
                message: "2025-10-03 17:47:25,102 ERROR [Test] Error message",
                level: "ERROR",
                logNames: ["Test"]
            });

            // Test WARN level  
            channel.write({
                message: "2025-10-03 17:47:25,102 WARN [Test] Warning message",
                level: "WARN",
                logNames: ["Test"]
            });

            // Test DEBUG level
            channel.write({
                message: "2025-10-03 17:47:25,102 DEBUG [Test] Debug message", 
                level: "DEBUG",
                logNames: ["Test"]
            });

            expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/ERROR.*Test.*Error message/));
            expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN.*Test.*Warning message/));
            expect(debugSpy).toHaveBeenCalledWith(expect.stringMatching(/DEBUG.*Test.*Debug message/));
        });
    });

    describe('Regex Pattern Tests', () => {
        const testPattern = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3}\s+(\w+)\s+\[([^\]]+)\]\s+(.*)$/;

        it('should match standard typescript-logging format', () => {
            const message = "2025-10-03 17:47:25,102 INFO  [OpinionApp] LoggerFactory integrated with Messages system";
            const match = message.match(testPattern);
            
            expect(match).toBeTruthy();
            expect(match![1]).toBe('INFO');
            expect(match![2]).toBe('OpinionApp');
            expect(match![3]).toBe('LoggerFactory integrated with Messages system');
        });

        it('should match DEBUG level messages', () => {
            const message = "2025-10-03 15:53:46,866 DEBUG [LayoutContextImpl] Adding listener for event: user-menu-mode-change";
            const match = message.match(testPattern);
            
            expect(match).toBeTruthy();
            expect(match![1]).toBe('DEBUG');
            expect(match![2]).toBe('LayoutContextImpl');
            expect(match![3]).toBe('Adding listener for event: user-menu-mode-change');
        });

        it('should not match malformed messages', () => {
            const badMessages = [
                "Just a regular message",
                "2025-10-03 17:47:25 INFO OpinionApp Missing brackets",
                "2025-10-03 17:47:25,102 [OpinionApp] Missing level",
                "17:47:25,102 INFO [OpinionApp] Missing date"
            ];

            badMessages.forEach(message => {
                expect(message.match(testPattern)).toBeNull();
            });
        });

        it('should handle different log levels', () => {
            const levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
            
            levels.forEach(level => {
                const message = `2025-10-03 17:47:25,102 ${level} [TestLogger] Test message`;
                const match = message.match(testPattern);
                
                expect(match).toBeTruthy();
                expect(match![1]).toBe(level);
            });
        });
    });
});
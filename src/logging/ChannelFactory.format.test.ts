/**
 * Tests for format field support in ChannelFactory
 */

import { ChannelFactory } from './ChannelFactory';
import { LogFormatPresets } from './ChannelTypes';

describe('ChannelFactory Format Support', () => {
    let consoleSpy: jest.SpyInstance;
    let logMethod: jest.Mock;
    let errorMethod: jest.Mock;
    let warnMethod: jest.Mock;
    let debugMethod: jest.Mock;

    beforeEach(() => {
        logMethod = jest.fn();
        errorMethod = jest.fn();
        warnMethod = jest.fn();
        debugMethod = jest.fn();

        consoleSpy = jest.spyOn(console, 'log').mockImplementation(logMethod);
        jest.spyOn(console, 'error').mockImplementation(errorMethod);
        jest.spyOn(console, 'warn').mockImplementation(warnMethod);
        jest.spyOn(console, 'debug').mockImplementation(debugMethod);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('String template formats', () => {
        it('should format with simple template', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}');
            
            const mockLogMessage = {
                message: "Test message",
                level: "INFO",
                logNames: ["TestLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith('INFO TestLogger: Test message');
        });

        it('should format with detailed template including timestamp', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{timestamp} [{level}] {logger}: {message}');
            
            const mockLogMessage = {
                message: "Detailed test message",
                level: "DEBUG",
                logNames: ["DetailedLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(debugMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] DetailedLogger: Detailed test message/)
            );
        });

        it('should format with args placeholder', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}{args}');
            
            const mockLogMessage = {
                message: "Message with args",
                level: "WARN",
                logNames: ["ArgsLogger"],
                args: ["arg1", { key: "value" }],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(warnMethod).toHaveBeenCalledWith(
                'WARN ArgsLogger: Message with args [arg1, {"key":"value"}]'
            );
        });

        it('should handle empty args gracefully', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}{args}');
            
            const mockLogMessage = {
                message: "Message without args",
                level: "ERROR",
                logNames: ["NoArgsLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(errorMethod).toHaveBeenCalledWith('ERROR NoArgsLogger: Message without args');
        });
    });

    describe('Predefined format presets', () => {
        it('should use SIMPLE preset', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel(LogFormatPresets.SIMPLE);
            
            const mockLogMessage = {
                message: "Simple format test",
                level: "INFO",
                logNames: ["SimpleLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] SimpleLogger: Simple format test/)
            );
        });

        it('should use COMPACT preset', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel(LogFormatPresets.COMPACT);
            
            const mockLogMessage = {
                message: "Compact format test",
                level: "WARN",
                logNames: ["CompactLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(warnMethod).toHaveBeenCalledWith('WARN CompactLogger: Compact format test');
        });

        it('should use DETAILED preset with args', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel(LogFormatPresets.DETAILED);
            
            const mockLogMessage = {
                message: "Detailed format test",
                level: "DEBUG",
                logNames: ["DetailedLogger"],
                args: ["detail1", "detail2"],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(debugMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[DetailedLogger\] Detailed format test\s*\[detail1, detail2\]/)
            );
        });

        it('should use JSON preset', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel(LogFormatPresets.JSON);
            
            const mockLogMessage = {
                message: "JSON format test",
                level: "ERROR",
                logNames: ["JSONLogger"],
                args: ["jsonArg"],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(errorMethod).toHaveBeenCalledWith(
                expect.stringContaining('"level":"ERROR"')
            );
            expect(errorMethod).toHaveBeenCalledWith(
                expect.stringContaining('"logger":"JSONLogger"')
            );
            expect(errorMethod).toHaveBeenCalledWith(
                expect.stringContaining('"message":"JSON format test"')
            );
        });
    });

    describe('Function-based formats', () => {
        it('should use custom function format', () => {
            const customFormat = (logMessage: any) => 
                `CUSTOM[${logMessage.level}] ${logMessage.logName.toUpperCase()}: ${logMessage.message}`;
            
            const channel = ChannelFactory.getDefaultConsoleChannel(customFormat);
            
            const mockLogMessage = {
                message: "Custom format test",
                level: "INFO",
                logNames: ["CustomLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith('CUSTOM[INFO] CUSTOMLOGGER: Custom format test');
        });

        it('should handle function format with all fields', () => {
            const customFormat = (logMessage: any) => 
                `${logMessage.timeInMillis}|${logMessage.level}|${logMessage.logName}|${logMessage.message}|${logMessage.args?.length || 0}`;
            
            const channel = ChannelFactory.getDefaultConsoleChannel(customFormat);
            
            const mockLogMessage = {
                message: "Full format test",
                level: "DEBUG",
                logNames: ["FullLogger"],
                args: ["a", "b", "c"],
                exception: null,
                timeInMillis: 1696348800000
            };

            channel.write(mockLogMessage);

            expect(debugMethod).toHaveBeenCalledWith(
                expect.stringContaining('1696348800000|DEBUG|FullLogger|Full format test|3')
            );
        });
    });

    describe('Fallback behavior', () => {
        it('should use default format when no format specified', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "Default format test",
                level: "INFO",
                logNames: ["DefaultLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] DefaultLogger: Default format test/)
            );
        });

        it('should handle missing logger names gracefully', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}');
            
            const mockLogMessage = {
                message: "Unknown logger test",
                level: "WARN",
                logNames: undefined,
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(warnMethod).toHaveBeenCalledWith('WARN unknown: Unknown logger test');
        });

        it('should handle array of logger names', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}');
            
            const mockLogMessage = {
                message: "Array logger test",
                level: "ERROR",
                logNames: ["FirstLogger", "SecondLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(errorMethod).toHaveBeenCalledWith('ERROR FirstLogger: Array logger test');
        });
    });

    describe('Legacy pre-formatted message parsing with formats', () => {
        it('should still parse pre-formatted messages when no format specified', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 INFO  [OpinionApp] Pre-formatted message test",
                level: "INFO",
                logNames: ["unknown"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            expect(logMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] OpinionApp: Pre-formatted message test/)
            );
        });

        it('should bypass pre-formatted parsing when custom format is used', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level}: {message}');
            
            const mockLogMessage = {
                message: "2025-10-03 17:47:25,102 INFO  [OpinionApp] Pre-formatted message test",
                level: "WARN",
                logNames: ["TestLogger"],
                args: [],
                exception: null
            };

            channel.write(mockLogMessage);

            // Should use the raw message content, not parse it
            expect(warnMethod).toHaveBeenCalledWith('WARN: 2025-10-03 17:47:25,102 INFO  [OpinionApp] Pre-formatted message test');
        });
    });

    describe('Args and exceptions with custom formats', () => {
        it('should not show separate args/exceptions when using custom format', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel('{level} {logger}: {message}');
            
            const mockLogMessage = {
                message: "Test with extras",
                level: "INFO",
                logNames: ["TestLogger"],
                args: ["should", "not", "show"],
                exception: new Error("Should not show")
            };

            channel.write(mockLogMessage);

            // Should only call the main log method, not separate args/exception logs
            expect(logMethod).toHaveBeenCalledTimes(1);
            expect(logMethod).toHaveBeenCalledWith('INFO TestLogger: Test with extras');
            
            // Should NOT call console.log for args
            expect(consoleSpy).not.toHaveBeenCalledWith('  └─ Args:', expect.anything());
            expect(consoleSpy).not.toHaveBeenCalledWith('  └─ Exception:', expect.anything());
        });

        it('should show separate args/exceptions when using default format', () => {
            const channel = ChannelFactory.getDefaultConsoleChannel();
            
            const mockLogMessage = {
                message: "Test with extras default",
                level: "ERROR",
                logNames: ["TestLogger"],
                args: ["arg1", "arg2"],
                exception: new Error("Test error")
            };

            channel.write(mockLogMessage);

            // Should call main log method
            expect(errorMethod).toHaveBeenCalledWith(
                expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] TestLogger: Test with extras default/)
            );
            
            // Should also call separate methods for args and exception
            expect(logMethod).toHaveBeenCalledWith('  └─ Args:', 'arg1', 'arg2');
            expect(jest.spyOn(console, 'error')).toHaveBeenCalledWith('  └─ Exception:', expect.any(Error));
        });
    });
});
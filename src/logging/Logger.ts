import { Logger as Log4TSLogger } from 'typescript-logging-log4ts-style';
import { LogErrorType } from './types';

/**
 * Wrapper Logger class that provides simplified logging interface
 * Built on top of typescript-logging log4ts-style library
 */
export class Logger {
    private readonly log4tsLogger: Log4TSLogger;

    constructor(log4tsLogger: Log4TSLogger) {
        this.log4tsLogger = log4tsLogger;
    }

    /**
     * Log debug messages
     */
    debug(message: string): void;
    debug(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void {
        this.log4tsLogger.debug(() => message, ...args);
    }

    /**
     * Log info messages
     */
    info(message: string): void;
    info(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void {
        this.log4tsLogger.info(() => message, ...args);
    }

    /**
     * Log warning messages
     */
    warn(message: string): void;
    warn(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void {
        this.log4tsLogger.warn(() => message, ...args);
    }

    /**
     * Log error messages with optional error object
     */
    error(message: string): void;
    error(message: string, ...args: unknown[]): void;
    error(message: string, error: LogErrorType): void;
    error(message: string, error: LogErrorType, ...args: unknown[]): void;
    error(message: string, errorOrFirstArg?: LogErrorType | unknown, ...remainingArgs: unknown[]): void {
        if (this.isLogErrorType(errorOrFirstArg)) {
            // Called with error parameter
            const error = errorOrFirstArg;
            if (typeof error === 'string') {
                // Convert string error to Error object for consistent handling
                const errorObj = new Error(error);
                this.log4tsLogger.error(() => message, errorObj, ...remainingArgs);
            } else {
                this.log4tsLogger.error(() => message, error, ...remainingArgs);
            }
        } else {
            // Called without error parameter (standard args)
            const allArgs = errorOrFirstArg !== undefined ? [errorOrFirstArg, ...remainingArgs] : remainingArgs;
            this.log4tsLogger.error(() => message, ...allArgs);
        }
    }

    /**
     * Log fatal messages with optional error object
     */
    fatal(message: string): void;
    fatal(message: string, ...args: unknown[]): void;
    fatal(message: string, error: LogErrorType): void;
    fatal(message: string, error: LogErrorType, ...args: unknown[]): void;
    fatal(message: string, errorOrFirstArg?: LogErrorType | unknown, ...remainingArgs: unknown[]): void {
        if (this.isLogErrorType(errorOrFirstArg)) {
            // Called with error parameter
            const error = errorOrFirstArg;
            if (typeof error === 'string') {
                // Convert string error to Error object for consistent handling
                const errorObj = new Error(error);
                this.log4tsLogger.fatal(() => message, errorObj, ...remainingArgs);
            } else {
                this.log4tsLogger.fatal(() => message, error, ...remainingArgs);
            }
        } else {
            // Called without error parameter (standard args)
            const allArgs = errorOrFirstArg !== undefined ? [errorOrFirstArg, ...remainingArgs] : remainingArgs;
            this.log4tsLogger.fatal(() => message, ...allArgs);
        }
    }

    /**
     * Type guard to check if a parameter is a LogErrorType
     */
    private isLogErrorType(value: unknown): value is LogErrorType {
        return typeof value === 'string' || value instanceof Error;
    }
}
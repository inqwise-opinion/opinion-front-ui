/**
 * Log levels for controlling logging output
 */
export enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
    Fatal = 5,
    Off = 6
}

/**
 * Type definition for error objects that can be logged
 * Supports both Exception/Error objects and string messages
 */
export type LogErrorType = Error | string;

/**
 * Type for class constructors - used for extracting class names in logger factory
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

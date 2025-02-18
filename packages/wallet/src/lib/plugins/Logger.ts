/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoggerError } from "./Errors";

const isBrowser = typeof window !== "undefined";

// Define log levels
enum LogLevel {
  DEBUG = 0,
  DEBUG_TRACE = 1,
  INFO = 2,
  INFO_TRACE = 3,
  WARN = 4,
  ERROR = 5,
  ERROR_TRACE = 6,
  TRACE = 7,
}

enum LogLevelDirection {
  NONE = 0,
  CONTAINS = 1,
  LESSTHAN = 2,
  GREATERTHAN = 3,
  EQUAL = 4,
  GREATERTHANOREQUAL = 5,
  LESSTHANOREQUAL = 6,
}

// Color styles for browser console logs
const COLORS = {
  DEBUG: "color: purple; font-weight: bold;",
  DEBUG_TRACE: "color: purple; font-weight: bold;",
  INFO: "color: green; font-weight: bold;",
  INFO_TRACE: "color: green; font-weight: bold;",
  WARN: "color: orange; font-weight: bold;",
  ERROR: "color: red; font-weight: bold;",
  ERROR_TRACE: "color: red; font-weight: bold;",
  TRACE: "color: blue; font-weight: bold;",
};

/**
 * Logger class with structured logging, log levels, and optional regex filtering.
 */
class Logger {
  private logLevel: LogLevel;
  private logLevelDirection: LogLevelDirection;
  private logsIncluded: string[] = [];
  private logRegEx: RegExp = /^(DEBUG|DEBUG_TRACE|INFO|INFO_TRACE|WARN|ERROR|ERROR_TRACE|TRACE)$/;
  private logFilterEnabled: boolean = false;
  private stackIndex = 4; // Adjusted index for better accuracy.

  constructor(level: LogLevel = LogLevel.DEBUG, direction: LogLevelDirection = LogLevelDirection.LESSTHAN, logsIncluded: string[] = ['DEBUG', 'DEBUG_TRACE', 'INFO', 'INFO_TRACE', 'WARN', 'ERROR', 'ERROR_TRACE', 'TRACE']) {
    this.logLevel = level;
    this.logLevelDirection = direction;
    this.logsIncluded = logsIncluded;
  }

  /**
   * Updates the logging level.
   */
  setLevel(level: keyof typeof LogLevel, direction: keyof typeof LogLevelDirection, logsIncluded: string[] = ['DEBUG', 'DEBUG_TRACE', 'INFO', 'INFO_TRACE', 'WARN', 'ERROR', 'ERROR_TRACE', 'TRACE']): void {
    this.logLevel = LogLevel[level];
    this.logLevelDirection = LogLevelDirection[direction];
    this.logsIncluded = logsIncluded;
  }

  /**
   * Enables or disables regex-based log filtering.
   */
  setLogFilterEnabled(enabled: boolean): void {
    this.logFilterEnabled = enabled;
  }

  /**
   * Sets a regex pattern to filter log messages.
   */
  setLogFilterRegex(pattern: string): void {
    try {
      this.logRegEx = new RegExp(pattern, "i"); // Case-insensitive
    } catch (error) {
      this.error("Invalid regex pattern:", error);
    }
  }

  setStackIndex(index: number): void {
    if (index < 0) throw new Error("Stack index must be a positive number");
    this.stackIndex = index;
  }

  /**
   * Formats timestamp.
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Gets caller information from stack trace.
   */
  private getCallerInfo(): string {
    const stack = new Error().stack;
    if (!stack) return "Unknown Caller";
    const stackLines = stack.split("\n").length;
    const adjustedIndex = Math.min(this.stackIndex, stackLines - 1) ?? this.stackIndex;
    const callerLine = stack.split( "\n" )[ adjustedIndex ]?.trim();
    return callerLine || "Unknown Caller";
  }

  /**
   * Normalizes error/input to ensure correct logging.
   */
  private normalizeInput(input: unknown): { message: string; stack?: string } {
    if (input instanceof Error) {
      return { message: input.message, stack: input.stack };
    } else if (typeof input === "string") {
      return { message: input };
    } else if (input === null || input === undefined) {
      return { message: String(input) };
    } else {
      return { message: JSON.stringify(input, null, 2) };
    }
  }

  /**
   * Generic logging function.
   */
  private log(level: LogLevel, label: string, color: string, input: unknown, includeStack = false, ...args: any[]): void {
    try {
      switch(this.logLevelDirection) {
        case LogLevelDirection.NONE:
          return;
        case LogLevelDirection.CONTAINS:
          if (!this.logsIncluded.includes(label)) return;
          break;
        case LogLevelDirection.GREATERTHAN:
          if (level > this.logLevel) return;
          break;
        case LogLevelDirection.EQUAL:
          if (level === this.logLevel) return;
          break;
        case LogLevelDirection.GREATERTHANOREQUAL:
          if (level >= this.logLevel) return;
          break;
        case LogLevelDirection.LESSTHANOREQUAL:
          if (level <= this.logLevel) return;
          break;
        case LogLevelDirection.LESSTHAN:
        default:
          if (level < this.logLevel) return;
          break;
      }
    } catch (error) {
      if (level < this.logLevel) return;
    }

    const { message, stack } = this.normalizeInput(input);
    const callerInfo = this.getCallerInfo();
    const timestamp = this.getTimestamp();
    const stackTrace = includeStack ? stack || new LoggerError('', 'Stack Tracing:').stack : null;

    // Apply regex filter if enabled
    if (this.logFilterEnabled && !this.logRegEx.test(message)) return;

    if (isBrowser) {
      if (level === LogLevel.TRACE) {
        console.trace(`%c[${label}] ${timestamp} - ${callerInfo} - ${message}`, color, ...args);
      } else {
        if (includeStack) {
          console.trace(`%c[${label}] ${timestamp} ${callerInfo} - ${message}\n${stackTrace}`, color, ...args);
        } else {
          console.log(`%c[${label}] ${timestamp} - ${callerInfo} - ${message}`, color, ...args);
        }
      }
    } else {
      const colorCode = this.getConsoleColor(label);
      if (level === LogLevel.TRACE) {
        console.trace(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\x1b[0m`, ...args);
      } else {
        if (includeStack && stackTrace) {
          console.trace(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\n${stackTrace}\x1b[0m`);
        } else {
          console.log(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\x1b[0m`, ...args);
        }
      }
    }
  }

  private getConsoleColor(label: string): string {
    return COLORS[label as keyof typeof COLORS] || "\x1b[0m";
  }

  debug(input: unknown, ...args: any[]): void {
    this.log(LogLevel.DEBUG, "DEBUG", COLORS.DEBUG, input, false, ...args);
  }

  debugStack(input: unknown, ...args: any[]): void {
    this.log(LogLevel.DEBUG_TRACE, "DEBUG_TRACE", COLORS.DEBUG, input, true, ...args);
  }

  info(input: unknown, ...args: any[]): void {
    this.log(LogLevel.INFO, "INFO", COLORS.INFO, input, false, ...args);
  }

  infoStack(input: unknown, ...args: any[]): void {
    this.log(LogLevel.INFO_TRACE, "INFO_TRACE", COLORS.INFO, input, false, ...args);
  }

  warn(input: unknown, ...args: any[]): void {
    this.log(LogLevel.WARN, "WARN", COLORS.WARN, input, false, ...args);
  }

  error(input: unknown, ...args: any[]): void {
    this.log(LogLevel.ERROR, "ERROR", COLORS.ERROR, input, false, ...args);
  }

  errorStack(error: unknown, ...args: any[]): void {
    this.log(LogLevel.ERROR_TRACE, "ERROR_TRACE", COLORS.ERROR, error, true, ...args);
  }

  trace(input: unknown, ...args: any[]): void {
    this.log(LogLevel.TRACE, "TRACE", COLORS.TRACE, input, false, ...args);
  }
}

// Singleton instance
const log = new Logger(LogLevel.DEBUG);

export { log, Logger, LogLevel, LogLevelDirection };

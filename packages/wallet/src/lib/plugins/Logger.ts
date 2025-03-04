/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoggerError } from "./Errors";
import { openDB } from "idb"; // IndexedDB support
import Dexie from "dexie"; // Dexie.js for IndexedDB
// import { browser_ext } from "$lib/common/environment";
// import { initSQLite, saveToSQLite } from "./LoggerSQLite"; // SQLite integration

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

const MAX_STORED_LOGS = 500; // Maximum number of logs to keep in storage
const STORAGE_KEY = "yakklLogs"; // Key for localStorage

// Add these interfaces
export interface LogEntry {
  timestamp: string;
  label: string;
  message: string;
  callerInfo: string;
  stack?: string;
  args?: any[];
}

/**
 * Logger class with structured logging, log levels, and optional regex filtering.
 */
class Logger {
  private static instance: Logger | null = null;
  private logLevel: LogLevel;
  private logLevelDirection: LogLevelDirection;
  private logsIncluded: string[] = [];
  private logRegEx: RegExp = /^(DEBUG|DEBUG_TRACE|INFO|INFO_TRACE|WARN|ERROR|ERROR_TRACE|TRACE)$/;
  private logFilterEnabled: boolean = false;
  private stackIndex = 4;
  private backend: string = "localStorage"; // Default logging backend. 'console' should always display and the other values will only get used if persist is true

  constructor(
    level: LogLevel = LogLevel.DEBUG,
    direction: LogLevelDirection = LogLevelDirection.LESSTHAN,
    logsIncluded: string[] = [
      "DEBUG",
      "DEBUG_TRACE",
      "INFO",
      "INFO_TRACE",
      "WARN",
      "ERROR",
      "ERROR_TRACE",
      "TRACE",
    ]
  ) {
    this.logLevel = level;
    this.logLevelDirection = direction;
    this.logsIncluded = logsIncluded;
  }

  // Add singleton getter
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

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
    } catch (error: any) {
      this.error("Invalid regex pattern:", false, error);
    }
  }

  setStackIndex(index: number): void {
    if (index < 0) throw new Error("Stack index must be a positive number");
    this.stackIndex = index;
  }

  /**
   * Updates the logging backend dynamically.
   */
  setBackend(backendType: string): void {
    this.backend = backendType;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private getCallerInfo(): string {
    const stack = new Error().stack;
    if (!stack) return "Unknown Caller";
    const stackLines = stack.split("\n").length;
    const adjustedIndex = Math.min(this.stackIndex, stackLines - 1) ?? this.stackIndex;
    const callerLine = stack.split("\n")[adjustedIndex]?.trim();
    return callerLine || "Unknown Caller";
  }

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

  private persistLog(entry: LogEntry): void {
    try {
      switch (this.backend) {
        case "indexedDB":
          this.persistLogIndexedDB(entry);
          break;
        case "dexie":
          this.persistLogDexie(entry);
          break;
        case "sqlite":
          this.persistLogSQLite(entry);
          break;
        case "background":
          this.persistLogBackground(entry);
          break;
        case "localStorage":
        default:
          this.persistLogLocalStorage(entry);
          break;
      }
    } catch (error: any) {
      this.error('Failed to persist log:', false, error);
    }
  }

  private persistLogLocalStorage(log: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      // Ensure args are serializable
      if (log.args) {
        log.args = log.args.map(arg => {
          try {
            // Test if the arg can be properly serialized
            JSON.parse(JSON.stringify(arg));
            return arg;
          } catch {
            // If not serializable, convert to string representation
            return String(arg);
          }
        });
      }

      logs.push(log);
      while (logs.length > MAX_STORED_LOGS) {
        logs.shift();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

      this.debug('Persisted log to localStorage:', false, log);
    } catch (error: any) {
      console.error('Failed to persist to localStorage:', error);
    }
  }

  private persistLogIndexedDB(log: LogEntry): void {
    const dbPromise = openDB(STORAGE_KEY, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("logs")) {
          db.createObjectStore("logs", {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      },
    });

    // Ensure args are serializable
    if (log.args) {
      log.args = log.args.map(arg => {
        try {
          JSON.parse(JSON.stringify(arg));
          return arg;
        } catch {
          return String(arg);
        }
      });
    }

    dbPromise.then(async (db) => {
      const tx = db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");
      await store.add(log);

      // Keep only latest logs
      const allLogs = await store.getAll();
      while (allLogs.length > MAX_STORED_LOGS) {
        await store.delete(allLogs[0].id);
        allLogs.shift();
      }
      await tx.done;
    });
  }

  private persistLogDexie(log: LogEntry): void {
    const dexieDB = new Dexie(STORAGE_KEY);
    dexieDB.version(1).stores({
      logs: "++id, timestamp, label, message, args"
    });

    // Ensure args are serializable
    if (log.args) {
      log.args = log.args.map(arg => {
        try {
          JSON.parse(JSON.stringify(arg));
          return arg;
        } catch {
          return String(arg);
        }
      });
    }

    dexieDB.table("logs").add(log);

    // Keep only latest logs
    dexieDB.table("logs").count().then((count) => {
      if (count > MAX_STORED_LOGS) {
        dexieDB.table("logs").orderBy("id").first((firstLog) => {
          if (firstLog) {
            dexieDB.table("logs").delete(firstLog.id);
          }
        });
      }
    });
  }

  private persistLogSQLite(log: LogEntry): void {
    // saveToSQLite(log);
    // Keep only the latest MAX_STORED_LOGS entries
    // const db = initSQLite();
    // db.transaction((tx) => {
    //   tx.executeSql("SELECT COUNT(*) FROM logs", [], (tx, result) => {
    //     const count = result.rows.item(0)["COUNT(*)"];
    //     if (count > MAX_STORED_LOGS) {
    //       tx.executeSql("DELETE FROM logs WHERE id = (SELECT MIN(id) FROM logs)");
    //     }
    //   });
    //   tx.executeSql("INSERT INTO logs (timestamp, label, message) VALUES (?, ?, ?)", [log.timestamp, log.label, log.message]);
    // });
  }

  private persistLogBackground(log: LogEntry): void {
    browser_ext.runtime.sendMessage({ type: "LOG_MESSAGE", key: STORAGE_KEY, maxStored: MAX_STORED_LOGS, log: log });
  }

  // Add utility methods for persistent logs
  clearPersistedLogs(): void {
    switch (this.backend) {
      case "indexedDB":
        openDB(STORAGE_KEY, 1).then((db) => {
            db.transaction("logs", "readwrite").objectStore("logs").clear();
          }
        );
        break;
      case "dexie":
        const dexieDB = new Dexie(STORAGE_KEY);
        dexieDB.version(1).stores({ logs: "++id, message, timestamp" });
        dexieDB.table("logs").clear();
        break;
      case "sqlite":
      //   const db = initSQLite();
      //   db.transaction((tx) => {
      //     tx.executeSql("DELETE FROM logs");
      //   });
        break;
      case "background":
        browser_ext.runtime.sendMessage({ type: "CLEAR_LOGS", key: STORAGE_KEY });
        break;

      case "localStorage":
      default:
        localStorage.removeItem(STORAGE_KEY);
        break;
      }
  }

  getPersistedLogs(): LogEntry[] {
    try {
      switch (this.backend) {
        case "indexedDB":
          openDB(STORAGE_KEY, 1).then((db) => {
            return db.transaction("logs", "readonly").objectStore("logs").getAll();
          });
        case "dexie":
          // const dexieDB = new Dexie(STORAGE_KEY);
          // dexieDB.version(1).stores({ logs: "++id, message, timestamp" });
          // return dexieDB.table("logs").toArray();
          break
        case "sqlite":
        //   const db = initSQLite();
        //   return new Promise((resolve, reject) => {
        //     db.transaction((tx) => {
        //       tx.executeSql("SELECT * FROM logs", [], (tx, result) => {
        //         const logs: LogEntry[] = [];
        //         for (let i = 0; i < result.rows.length; i++) {
        //           logs.push(result.rows.item(i));
        //         }
        //         resolve(logs);
        //       }, (tx, error) => {
        //         reject(error);
        //       });
        //     });
        //   });
          break;
        case "background":
          // Send to request a background script to fetch logs by sending to a more local listener for the logs
          // return browser_ext.runtime.sendMessage({ type: "GET_LOGS", key: STORAGE_KEY });
          break;
        case "localstorage":
        default:
          return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      }
    } catch {
      this.error("Failed to retrieve persisted logs");
      return [];
    }
  }

  /**
   * Generic logging function.
   */
  private log(
    level: LogLevel,
    label: string,
    color: string,
    input: unknown,
    includeStack = false,
    persist = false,
    ...args: any[]
  ): void {
    try {
      switch (this.logLevelDirection) {
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
    const stackTrace = includeStack ? stack || new LoggerError("", "Stack Tracing:").stack : null;

    if (this.logFilterEnabled && !this.logRegEx.test(message)) return;

    const logEntry: LogEntry = {
      timestamp,
      label,
      message,
      callerInfo,
      stack: includeStack ? stack : undefined,
      args: args.length > 0 ? args : undefined,
    };

    // Logging backends
    switch (this.backend) {
      case "indexedDB":
      case "dexie":
      case "sqlite":
      case "background":
      case "localStorage":
        if (persist === true) {
          console.log('Persisting log:', logEntry);
          this.persistLog(logEntry);
        } // Fall through to console always
      case "console":
      default:
        // if (isBrowser) {

        if (level === LogLevel.TRACE) {
          console.trace(`%c[${label}] ${timestamp} - ${callerInfo} - ${message}`, color, ...args);
        } else {
          if (includeStack) {
            console.trace(`%c[${label}] ${timestamp} ${callerInfo} - ${message}\n${stackTrace}`, color, ...args);
          } else {
            console.log(`%c[${label}] ${timestamp} - ${callerInfo} - ${message}`, color, ...args);
          }
        }
        // } else {
        //   const colorCode = this.getConsoleColor(label);
        //   if (level === LogLevel.TRACE) {
        //     console.trace(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\x1b[0m`, ...args);
        //   } else {
        //     if (includeStack && stackTrace) {
        //       console.trace(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\n${stackTrace}\x1b[0m`);
        //     } else {
        //       console.log(`${colorCode}[${label}] ${timestamp} - ${callerInfo} - ${message}\x1b[0m`, ...args);
        //     }
        //   }
        // }
        break;
    }
  }

  debug(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.DEBUG, "DEBUG", COLORS.DEBUG, input, false, persist, ...args);
  }

  debugStack(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.DEBUG_TRACE, "DEBUG_TRACE", COLORS.DEBUG, input, true, persist, ...args);
  }

  info(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.INFO, "INFO", COLORS.INFO, input, false, persist, ...args);
  }

  infoStack(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.INFO_TRACE, "INFO_TRACE", COLORS.INFO, input, false, persist, ...args);
  }

  warn(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.WARN, "WARN", COLORS.WARN, input, false, persist, ...args);
  }

  error(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.ERROR, "ERROR", COLORS.ERROR, input, false, persist, ...args);
  }

  errorStack(error: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.ERROR_TRACE, "ERROR_TRACE", COLORS.ERROR, false, persist, ...args);
  }

  trace(input: unknown, persist: boolean = false, ...args: any[]): void {
    this.log(LogLevel.TRACE, "TRACE", COLORS.TRACE, input, false, persist, ...args);
  }
}

// Singleton instance
const log = Logger.getInstance();

export { log, Logger, LogLevel, LogLevelDirection };


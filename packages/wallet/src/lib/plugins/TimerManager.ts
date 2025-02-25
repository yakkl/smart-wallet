import { writable } from "svelte/store";
import { log } from "$plugins/Logger";

type TimerCallback = () => void;

export interface Timer {
  id: string;
  callback: TimerCallback;
  duration: number;
  handleIntervalID: NodeJS.Timeout | null;
}

export const timerManagerStore = writable<TimerManager | null>(null);

export class TimerManager {
  private timers: Map<string, Timer> = new Map();
  private static instance: TimerManager | null = null;

  constructor() {
    if (TimerManager.instance) {
      if (!timerManagerStore) {
        timerManagerStore.set(this);
      }
      return TimerManager.instance;
    }
    TimerManager.instance = this;
    timerManagerStore.set(this);
  }

  public static getInstance(): TimerManager {
    return TimerManager.instance ?? new TimerManager();
  }

  public static clearInstance(): void {
    if (this.instance) {
      this.instance.stopAll(); // Fully clear all timers
      this.instance.removeAll();
    }
    this.instance = null;
    timerManagerStore.set(null);
  }

  public static resetInstance(): TimerManager {
    this.clearInstance();
    return this.getInstance();
  }

  /**
   * Add a new timer.
   * @param id - Unique ID for the timer.
   * @param callback - Function to execute when the timer triggers.
   * @param duration - Duration in milliseconds.
   */
  addTimer(id: string, callback: TimerCallback, duration: number): void {
    if (this.timers.has(id)) {
      log.info(`Timer "${id}" already exists.`);
      return;
    }
    this.timers.set(id, { id, callback, duration, handleIntervalID: null });
    log.info(`Timer "${id}" added.`);
  }

  hasTimer(id: string) {
    if (this.timers.has(id)) {
      log.info(`Timer "${id}" exists.`);
      return true;
    }
    return false;
  }

  /**
   * Start a timer by ID.
   */
  startTimer(id: string): void {
    this.startTimerDelayed(id);
  }

  // This and startTimerImmediate are the same. This is for consistency with TimeoutManagerTimeout
  startTimerDelayed(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.error(`Timer "${id}" not found.`);
    if (timer.handleIntervalID) return log.warn(`Timer "${id}" is already running.`);

    timer.handleIntervalID = setInterval(timer.callback, timer.duration);
    log.info(`Started timer "${id}" (${timer.duration}ms).`);
  }

  startTimerImmediate(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.error(`Timer "${id}" not found.`);
    if (timer.handleIntervalID) return log.warn(`Timer "${id}" is already running.`);

    timer.handleIntervalID = setInterval(timer.callback, timer.duration);
    log.info(`Started timer "${id}" (${timer.duration}ms).`);
  }

  /**
   * Stop a timer by ID.
   */
  stopTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.warn(`Timer "${id}" not found.`);
    if (!timer.handleIntervalID) return log.warn(`Timer "${id}" is not running.`);

    clearInterval(timer.handleIntervalID);
    timer.handleIntervalID = null;
    log.info(`Stopped timer "${id}".`);
  }

  /**
   * Start all timers.
   */
  startAll(): void {
    this.timers.forEach((_, id) => this.startTimer(id));
  }

  /**
   * Stop all timers.
   */
  stopAll(): void {
    this.timers.forEach((_, id) => this.stopTimer(id));
  }

  /**
   * Remove a timer by ID.
   */
  removeTimer(id: string): void {
    this.stopTimer(id); // Ensure cleanup before removal
    if (!this.timers.delete(id)) {
      log.warn(`Attempted to remove non-existent timer "${id}".`);
    } else {
      log.info(`Removed timer "${id}".`);
    }
  }

  /**
   * Remove all timers.
   */
  removeAll(): void {
    this.stopAll();
    this.timers.clear();
    log.info(`Removed all timers.`);
  }

  /**
   * Check if a timer is running.
   */
  isRunning(id: string): boolean {
    return !!this.timers.get(id)?.handleIntervalID;
  }

  getTimeoutID(id: string): NodeJS.Timeout | null {
    return this.timers.get(id)?.handleIntervalID ?? null;
  }
  /**
   * List active timers.
   */
  getRunningTimers(): string[] {
    return Array.from(this.timers.entries())
      .filter(([_, timer]) => timer.handleIntervalID !== null)
      .map(([id]) => id);
  }

  /**
   * List all registered timers.
   */
  listTimers(): string[] {
    return Array.from(this.timers.keys());
  }
}

// Singleton instance
export const timerManager = TimerManager.getInstance();

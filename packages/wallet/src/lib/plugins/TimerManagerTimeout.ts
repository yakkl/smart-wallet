import { writable } from "svelte/store";
import { log } from "$plugins/Logger";

type TimerCallback = () => void;

export interface Timer {
  id: string;
  callback: TimerCallback;
  duration: number;
  handleTimeoutID: NodeJS.Timeout | null;
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
      this.instance.stopAll();
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
   * Adds a new timer.
   */
  addTimer(id: string, callback: TimerCallback, duration: number): void {
    if (this.timers.has(id)) {
      log.info(`Timer "${id}" already exists.`);
      return;
    }
    this.timers.set(id, { id, callback, duration, handleTimeoutID: null });
    log.info(`Timer "${id}" added.`);
  }

  hasTimer(id: string): boolean {
    return this.timers.has(id);
  }

  /**
   * Runs the timer using `setTimeout` instead of `setInterval`.
   */
  private runTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;

    timer.handleTimeoutID = setTimeout(() => {
      if (!this.timers.has(id)) return; // Ensure timer still exists
      timer.callback();
      this.runTimer(id); // Recursively re-run
    }, timer.duration);

    log.info(`Scheduled next execution for timer "${id}" (${timer.duration}ms).`);
  }

  /**
   * Start a timer immediately, then schedule the next execution.
   */

  startTimer(id: string): void {
    this.startTimerDelayed(id);
  }

  // Change this out in startTimer if you want the default of delayed
  startTimerImmediate(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.error(`Timer "${id}" not found.`);
    if (timer.handleTimeoutID) return log.warn(`Timer "${id}" is already running.`);

    // Execute the callback immediately before scheduling
    timer.callback();
    this.runTimer(id);
  }

  startTimerDelayed(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.error(`Timer "${id}" not found.`);
    if (timer.handleTimeoutID) return log.warn(`Timer "${id}" is already running.`);

    this.runTimer(id);
  }

  /**
   * Stops a timer.
   */
  stopTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return log.warn(`Timer "${id}" not found.`);
    if (!timer.handleTimeoutID) return log.warn(`Timer "${id}" is not running.`);

    clearTimeout(timer.handleTimeoutID);
    timer.handleTimeoutID = null;
    log.info(`Stopped timer "${id}".`);
  }

  /**
   * Starts all timers.
   */
  startAll(): void {
    this.timers.forEach((_, id) => this.startTimer(id));
  }

  /**
   * Stops all timers.
   */
  stopAll(): void {
    this.timers.forEach((_, id) => this.stopTimer(id));
  }

  /**
   * Removes a timer.
   */
  removeTimer(id: string): void {
    this.stopTimer(id);
    if (!this.timers.delete(id)) {
      log.warn(`Attempted to remove non-existent timer "${id}".`);
    } else {
      log.info(`Removed timer "${id}".`);
    }
  }

  /**
   * Removes all timers.
   */
  removeAll(): void {
    this.stopAll();
    this.timers.clear();
    log.info("Removed all timers.");
  }

  /**
   * Checks if a timer is running.
   */
  isRunning(id: string): boolean {
    return !!this.timers.get(id)?.handleTimeoutID;
  }

  getTimeoutID(id: string): NodeJS.Timeout | null {
    return this.timers.get(id)?.handleTimeoutID ?? null;
  }

  /**
   * Lists running timers.
   */
  getRunningTimers(): string[] {
    return Array.from(this.timers.entries())
      .filter(([_, timer]) => timer.handleTimeoutID !== null)
      .map(([id]) => id);
  }

  /**
   * Lists all registered timers.
   */
  listTimers(): string[] {
    return Array.from(this.timers.keys());
  }
}

// Singleton instance
export const timerManager = TimerManager.getInstance();

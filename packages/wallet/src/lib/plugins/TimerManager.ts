import { writable } from "svelte/store";

type TimerCallback = () => void;

export interface Timer {
  id: string;
  callback: TimerCallback;
  duration: number;
  handleIntervalID: NodeJS.Timeout | null; // Stores the interval/timeout handle
}

export const timerManagerStore = writable<TimerManager | null>(null);

export class TimerManager {
  private timers: Map<string, Timer>;
  private static instance: TimerManager | null = null;

  constructor() {
    this.timers = new Map();
  }

  public static getInstance(): TimerManager {
    try {
      if (!TimerManager.instance) {
        TimerManager.instance = new TimerManager();
      }
      return TimerManager.instance;
    }
    catch (error) {
      console.log("[ERROR]: Failed to get TimerManager instance:", error);
      throw error;
    }
  }

  public static clearInstance(): void {
    if (this.instance) {
      this.instance.removeAll();
    }
    this.instance = null;
    timerManagerStore.set(null); // Ensure the store is in sync
  }

  public static setInstance(instance: TimerManager): void {
    this.clearInstance();
    this.instance = instance;
    timerManagerStore.set(instance);
  }

  /**
   * Add a new timer.
   * @param id - Unique ID for the timer.
   * @param callback - Function to execute when the timer triggers.
   * @param duration - Duration for the timer in milliseconds.
   */
  addTimer(id: string, callback: TimerCallback, duration: number): void {
    if (this.timers.has(id)) {
      console.warn(`Timer with ID "${id}" already exists.`);
      return;
    }

    this.timers.set(id, { id, callback, duration, handleIntervalID: null });
  }

  /**
   * Start a specific timer by ID.
   * @param id - Timer ID to start.
   */
  startTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      console.error(`Timer with ID "${id}" not found.`);
      return;
    }

    if (timer.handleIntervalID) {
      console.warn(`Timer with ID "${id}" is already running.`);
      return;
    }

    timer.handleIntervalID = setInterval(timer.callback, timer.duration);
    console.log(`Started timer "${id}" with duration ${timer.duration}ms.`);
  }

  /**
   * Stop a specific timer by ID.
   * @param id - Timer ID to stop.
   */
  stopTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      console.log(`[ERROR]: Timer with ID "${id}" not found.`);
      return;
    }

    if (timer.handleIntervalID) {
      clearInterval(timer.handleIntervalID);
      timer.handleIntervalID = null;
      console.log(`Stopped timer "${id}".`);
    } else {
      console.log(`[ERROR]: Timer with ID "${id}" is not running.`);
    }
  }

  /**
   * Start all registered timers.
   */
  startAll(): void {
    for (const [id, timer] of this.timers.entries()) {
      if (!timer.handleIntervalID) {
        this.startTimer(id);
      }
    }
    console.log(`Started all timers.`);
  }

  /**
   * Stop all registered timers.
   */
  stopAll(): void {
    for (const [id, timer] of this.timers.entries()) {
      if (timer.handleIntervalID) {
        this.stopTimer(id);
      }
    }
    console.log(`Stopped all timers.`);
  }

  /**
   * Check for any running timers and return their IDs.
   * @returns Array of IDs of currently active timers.
   */
  getRunningTimers(): string[] {
    const runningTimers: string[] = [];
    for (const [id, timer] of this.timers.entries()) {
      if (timer.handleIntervalID) {
        runningTimers.push(id);
      }
    }
    return runningTimers;
  }

  /**
   * Check if a timer is running.
   * @param id - Timer ID to check.
   * @returns True if the timer is running, otherwise false.
   */
  isRunning(id: string): boolean {
    const timer = this.timers.get(id);
    return timer ? !!timer.handleIntervalID : false;
  }

  /**
   * Remove a specific timer by ID.
   * @param id - Timer ID to remove.
   */
  removeTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      console.log(`[ERROR]: Timer with ID "${id}" not found.`);
      return;
    }

    this.stopTimer(id); // Ensure the timer is stopped before removal
    this.timers.delete(id);
    console.log(`Removed timer "${id}".`);
  }

  /**
   * Remove all timers.
   */
  removeAll(): void {
    this.stopAll(); // Ensure all timers are stopped before clearing
    this.timers.clear();
    console.log(`Removed all timers.`);
  }

  /**
   * List all registered timers.
   * @returns Array of timer IDs.
   */
  listTimers(): string[] {
    return Array.from(this.timers.keys());
  }
}

type TimerCallback = () => void;

interface Timer {
  id: string;
  callback: TimerCallback;
  duration: number;
  handle: NodeJS.Timeout | null; // Stores the interval/timeout handle
}

export class TimerManager {
  private timers: Map<string, Timer>;

  constructor() {
    this.timers = new Map();
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

    this.timers.set(id, { id, callback, duration, handle: null });
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

    if (timer.handle) {
      console.warn(`Timer with ID "${id}" is already running.`);
      return;
    }

    timer.handle = setInterval(timer.callback, timer.duration);
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

    if (timer.handle) {
      clearInterval(timer.handle);
      timer.handle = null;
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
      if (!timer.handle) {
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
      if (timer.handle) {
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
      if (timer.handle) {
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
    return timer ? !!timer.handle : false;
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

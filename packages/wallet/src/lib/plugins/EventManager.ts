/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// type Listener = (...args: any[]) => void;

import type { Listener } from '$lib/common';

/**
 * Manages event listeners and emits events.
 */
class EventManager {
  /** Map of events and their listeners */
  private events: Map<string, Listener[]>;

  /**
   * Creates an instance of EventManager.
   */
  constructor() {
    this.events = new Map();
  }

  /**
   * Adds a listener for an event.
   * @param event - The name of the event.
   * @param listener - The listener function.
   */
  on(event: string, listener: Listener): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  /**
   * Removes a listener for an event.
   * @param event - The name of the event.
   * @param listener - The listener function.
   */
  off(event: string, listener: Listener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      this.events.set(event, listeners.filter(l => l !== listener));
    }
  }

  /**
   * Emits an event to all its listeners.
   * @param event - The name of the event.
   * @param args - Arguments to pass to the listeners.
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  /**
   * Adds a one-time listener for an event.
   * @param event - The name of the event.
   * @param listener - The listener function.
   */
  once(event: string, listener: Listener): void {
    const onceListener: Listener = (...args: any[]) => {
      this.off(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
  }

  /**
   * Removes all listeners for an event, or all events if no event is specified.
   * @param event - The name of the event.
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Gets the count of listeners for an event.
   * @param event - The name of the event.
   * @returns The number of listeners for the event.
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Gets the listeners for an event.
   * @param event - The name of the event.
   * @returns The listeners for the event.
   */
  listeners(event: string): Listener[] {
    return this.events.get(event) || [];
  }
}

/** Singleton instance of EventManager */
const eventManager = new EventManager();
export default eventManager;

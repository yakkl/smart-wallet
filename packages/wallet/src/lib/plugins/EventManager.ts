/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// type Listener = (...args: any[]) => void;

import type { EventType, Listener } from '$lib/common';

/**
 * Manages event listeners and emits events.
 */
class EventManager {
  private eventListeners: Map<EventType, Set<Listener>> = new Map();

  on(eventName: EventType, listener: Listener): this {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(listener);
    return this;
  }

  once(eventName: EventType, listener: Listener): this {
    const onceWrapper = (...args: any[]) => {
      this.off(eventName, onceWrapper);
      listener(...args);
    };
    return this.on(eventName, onceWrapper);
  }

  emit(eventName: EventType, ...args: any[]): boolean {
    if (!this.eventListeners.has(eventName)) return false;
    this.eventListeners.get(eventName)!.forEach(listener => listener(...args));
    return true;
  }

  listenerCount(eventName?: EventType): number {
    if (eventName === undefined) {
      return Array.from(this.eventListeners.values()).reduce((acc, set) => acc + set.size, 0);
    }
    return this.eventListeners.get(eventName)?.size || 0;
  }

  listeners(eventName?: EventType): Listener[] {
    if (eventName === undefined) {
      return Array.from(this.eventListeners.values()).flatMap(set => Array.from(set));
    }
    return Array.from(this.eventListeners.get(eventName) || []);
  }

  off(eventName: EventType, listener?: Listener): this {
    if (!this.eventListeners.has(eventName)) return this;
    if (listener) {
      this.eventListeners.get(eventName)!.delete(listener);
    } else {
      this.eventListeners.delete(eventName);
    }
    return this;
  }

  removeAllListeners(eventName?: EventType): this {
    if (eventName === undefined) {
      this.eventListeners.clear();
    } else {
      this.eventListeners.delete(eventName);
    }
    return this;
  }
}

/** Singleton instance of EventManager */
const eventManager = new EventManager();
export default eventManager;

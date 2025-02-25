// ListenerManager.ts
import { log } from "$plugins/Logger";

type ListenerEntry = {
  event: any; // Event source (e.g., browser.runtime.onMessage)
  handler: Function; // Listener function
};

export class ListenerManager {
  private listeners: Set<ListenerEntry> = new Set();

  add(event: any, handler: Function) {
    if (!event.hasListener(handler)) {
      event.addListener(handler);
      this.listeners.add({ event, handler });
    }
  }

  remove(event: any, handler: Function) {
    if (event.hasListener(handler)) {
      event.removeListener(handler);
      this.listeners.delete({ event, handler });
    }
  }

  removeAll() {
    this.listeners.forEach(({ event, handler }) => {
      event.removeListener(handler);
    });
    this.listeners.clear();
    log.info('All listeners removed.');
  }
}

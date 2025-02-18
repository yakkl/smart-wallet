// src/listeners/GlobalListenerManager.ts
import { ListenerManager } from './ListenerManager';
import { log } from "$plugins/Logger";

export type ListenerContext = 'background' | 'content' | 'ui' | 'inpage';

export class GlobalListenerManager {
  private contextManagers: Map<ListenerContext, ListenerManager> = new Map();

  registerContext(context: ListenerContext, manager: ListenerManager) {
    if (!this.contextManagers.has(context)) {
      this.contextManagers.set(context, manager);
    } else {
      log.warn(`ListenerManager for context "${context}" is already registered.`);
    }
  }

  addListener(context: ListenerContext, event: any, handler: Function) {
    const manager = this.contextManagers.get(context);
    if (manager) {
      manager.add(event, handler);
    } else {
      log.error(`ListenerManager for context "${context}" is not registered.`);
    }
  }

  removeListener(context: ListenerContext, event: any, handler: Function) {
    const manager = this.contextManagers.get(context);
    if (manager) {
      manager.remove(event, handler);
    } else {
      log.error(`ListenerManager for context "${context}" is not registered.`);
    }
  }

  removeAllFromContext(context: ListenerContext) {
    const manager = this.contextManagers.get(context);
    if (manager) {
      manager.removeAll();
    } else {
      log.error(`ListenerManager for context "${context}" is not registered.`);
    }
  }

  removeAll() {
    this.contextManagers.forEach((manager, context) => {
      log.info(`Removing all listeners from context: ${context}`);
      manager.removeAll();
    });
  }
}

// Global instance of GlobalListenerManager
export const globalListenerManager = new GlobalListenerManager();

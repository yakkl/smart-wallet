import { log } from '$plugins/Logger';

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
  };
}

interface GlobalError {
  message?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
  timestamp: string;
  type: 'error' | 'unhandledrejection' | 'event';
}

interface MemorySnapshot {
  time: number;
  memory?: number;
  nodes: number;
  eventListeners: number;
  location: string;
}

interface StateSnapshot {
  timestamp: number;
  route: string;
  activeModals: Array<{
    id: string;
    class: string;
    visible: boolean;
  }>;
  componentStack: string[];
  eventQueue: string[];
  lastActions: Array<{time: number; action: string}>;
  memoryUsage: any;
}

interface ComponentError {
  component: string;
  error: any;
  props?: any;
  state?: any;
}

const MEMORY_THRESHOLDS = {
  heap: 100 * 1024 * 1024, // 100MB
  nodes: 5000,             // Max DOM nodes
  eventListeners: 1000     // Max event listeners
};

export class ErrorHandler {
  private static instance: ErrorHandler | null = null;
  private memorySnapshots: MemorySnapshot[] = [];
  private stateSnapshots: StateSnapshot[] = [];
  private lastActions: Array<{time: number; action: string}> = [];
  private lastComponentErrors: ComponentError[] = [];
  private mountTime: number = Date.now();
  private lastLocation: string = '';
  private resourceCheckInterval: number | null = null;
  private memoryCheckInterval: number | null = null;
  private isInitialized: boolean = false;
  private isClosing: boolean = false;
  private readonly MAX_ACTION_HISTORY = 50;

  private constructor() {
    setTimeout(() => {
      this.initialize();
    }, 0);
  }

private async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      this.initializeErrorHandlers();
      this.initializeUIMonitoring();
      setTimeout(() => {
        this.initializeResourceMonitoring();
      }, 1000);
      this.initializeStateRecovery();
      this.checkPreviousError();

      this.isInitialized = true;
      log.info('ErrorHandler initialized');
    } catch (error) {
      log.error('ErrorHandler initialization failed', false, error);
    }
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeErrorHandlers(): void {
    try {
      let lastError: any = null;
      const performance = window.performance as ExtendedPerformance;

      Object.defineProperty(window, 'lastError', {
        get: () => lastError,
        set: (error) => {
          lastError = error;
          try {
            localStorage.setItem('lastFatalError', JSON.stringify({
              error: error?.toString(),
              stack: error?.stack,
              timestamp: new Date().toISOString(),
              location: window.location.href,
              memory: performance?.memory?.usedJSHeapSize,
              lastLocation: this.lastLocation,
              stateSnapshot: this.captureStateSnapshot(),
              lastActions: this.lastActions.slice(0, 10)
            }));
          } catch (e) {
            // Fail silently
          }
        }
      });

      // Track all clicks
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const action = {
          time: Date.now(),
          action: `Click: ${target.tagName} ${target.className} ${target.id}`
        };

        this.lastActions.unshift(action);
        if (this.lastActions.length > this.MAX_ACTION_HISTORY) {
          this.lastActions.pop();
        }

        // Capture state after each click
        this.stateSnapshots.push(this.captureStateSnapshot());
        if (this.stateSnapshots.length > 10) {
          this.stateSnapshots.shift();
        }
      }, true);

      window.onerror = (message, source, lineno, colno, error) => {
        const messageText = message instanceof Event ? message.type : String(message);

        if (messageText?.includes('ResizeObserver loop')) {
          return; // Ignore ResizeObserver errors
        }

        if (!this.isClosing) {
          const errorInfo = {
            message: messageText,
            source,
            lineno,
            colno,
            error,
            timestamp: new Date().toISOString(),
            type: 'error',
            location: window.location.href,
            timeSinceMount: Date.now() - this.mountTime,
            memoryUsage: performance?.memory?.usedJSHeapSize,
            lastLocation: this.lastLocation,
            stateSnapshots: this.stateSnapshots,
            lastActions: this.lastActions,
            componentErrors: this.lastComponentErrors,
            finalSnapshot: this.captureStateSnapshot()
          };

          try {
            localStorage.setItem('lastFatalError', JSON.stringify(errorInfo));
          } catch (e) {
            // Ignore storage errors
          }

          log.error('Fatal error caught', true, errorInfo);
        }

        return true;
      };

window.addEventListener('error', (event) => {
        const errorDetails: GlobalError = {
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          timestamp: new Date().toISOString(),
          type: 'event'
        };

        log.error('Error Event Caught', true, {
          ...errorDetails,
          event: {
            type: event.type,
            target: event.target?.toString(),
            timeStamp: event.timeStamp
          },
          location: window.location.href,
          memorySnapshot: this.getMemorySnapshot(),
          stateSnapshot: this.captureStateSnapshot(),
          lastActions: this.lastActions.slice(0, 10)
        });

        event.preventDefault();
      });

      window.addEventListener('unhandledrejection', (event) => {
        const errorDetails: GlobalError = {
          message: event.reason?.message || event.reason,
          error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          timestamp: new Date().toISOString(),
          type: 'unhandledrejection'
        };

        log.error('Unhandled Promise Rejection', true, {
          ...errorDetails,
          reason: event.reason,
          promise: event.promise,
          stack: event.reason?.stack,
          location: window.location.href,
          memorySnapshot: this.getMemorySnapshot(),
          stateSnapshot: this.captureStateSnapshot(),
          lastActions: this.lastActions.slice(0, 10)
        });

        event.preventDefault();
      });

      window.addEventListener('beforeunload', (event) => {
        this.isClosing = true;
        const finalSnapshot = this.captureStateSnapshot();

        try {
          localStorage.setItem('lastStateBeforeClose', JSON.stringify({
            snapshot: finalSnapshot,
            actions: this.lastActions,
            errors: this.lastComponentErrors,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Ignore storage errors
        }
      });

      document.addEventListener('visibilitychange', () => {
        const snapshot = this.captureStateSnapshot();
        log.info('Visibility change', true, {
          state: document.visibilityState,
          snapshot,
          lastActions: this.lastActions.slice(0, 10),
          location: window.location.href,
          timestamp: new Date().toISOString()
        });
      });

      // Track pathname changes
      let lastPathname = window.location.pathname;
      const observer = new MutationObserver(() => {
        const currentPathname = window.location.pathname;
        if (lastPathname !== currentPathname) {
          log.info('Navigation occurred', true, {
            from: lastPathname,
            to: currentPathname,
            timestamp: new Date().toISOString(),
            stateSnapshot: this.captureStateSnapshot()
          });
          lastPathname = currentPathname;
        }
      });

      observer.observe(document, {
        subtree: true,
        childList: true
      });

    } catch (error) {
      log.error('Failed to initialize error handlers', false, error);
    }
  }

private initializeUIMonitoring(): void {
    try {
      // Monitor DOM mutations for modal dialogs
      const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (
                node.getAttribute('role') === 'dialog' ||
                node.classList.contains('modal') ||
                node.getAttribute('aria-modal') === 'true'
              ) {
                log.info('Modal dialog opened', true, {
                  timestamp: new Date().toISOString(),
                  location: window.location.href,
                  modalId: node.id,
                  modalClasses: node.className,
                  memorySnapshot: this.getMemorySnapshot(),
                  stateSnapshot: this.captureStateSnapshot()
                });
              }
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (
                node.getAttribute('role') === 'dialog' ||
                node.classList.contains('modal') ||
                node.getAttribute('aria-modal') === 'true'
              ) {
                log.info('Modal dialog closed', true, {
                  timestamp: new Date().toISOString(),
                  location: window.location.href,
                  modalId: node.id,
                  modalClasses: node.className,
                  memorySnapshot: this.getMemorySnapshot(),
                  stateSnapshot: this.captureStateSnapshot()
                });
              }
            }
          });
        });
      });

      modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden']
      });

      // Monitor Send button
      const sendButtonObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' &&
              mutation.attributeName === 'disabled') {
            const button = mutation.target as HTMLElement;
            log.info('Send button state changed', true, {
              disabled: button.hasAttribute('disabled'),
              timestamp: Date.now(),
              location: window.location.href,
              snapshot: this.captureStateSnapshot(),
              lastActions: this.lastActions.slice(0, 10)
            });
          }
        });
      });

      // Observe the Send button once it's available
      const observeSendButton = () => {
        const sendButton = document.querySelector('[data-testid="send-button"]');
        if (sendButton) {
          sendButtonObserver.observe(sendButton, {
            attributes: true,
            attributeFilter: ['disabled']
          });
        }
      };

      // Check periodically for the Send button
      const buttonCheckInterval = setInterval(() => {
        observeSendButton();
      }, 1000);

      // Clean up interval when done
      setTimeout(() => {
        clearInterval(buttonCheckInterval);
      }, 10000); // Stop checking after 10 seconds
    } catch (error) {
      log.error('Failed to initialize UI monitoring', false, error);
    }
  }

private initializeResourceMonitoring(): void {
    try {
      const performance = window.performance as ExtendedPerformance;

      this.memoryCheckInterval = window.setInterval(() => {
        try {
          const snapshot = this.getMemorySnapshot();
          this.memorySnapshots.push(snapshot);

          if (this.memorySnapshots.length > 3) {
            this.memorySnapshots.shift();
          }

          if (this.memorySnapshots.length === 3) {
            // Calculate percentage increase
            const firstMemory = this.memorySnapshots[0].memory || 0;
            const lastMemory = this.memorySnapshots[2].memory || 0;
            const percentageIncrease = ((lastMemory - firstMemory) / firstMemory) * 100;

            // Only warn if there's significant growth (more than 20% across samples)
            if (percentageIncrease > 20) {
              log.warn('Significant memory growth detected', true, {
                snapshots: this.memorySnapshots,
                percentageIncrease: percentageIncrease.toFixed(2) + '%',
                location: window.location.href,
                lastActions: this.lastActions.slice(0, 10)
              });
            }
          }

          if (snapshot.memory && snapshot.memory > MEMORY_THRESHOLDS.heap) {
            log.warn('High memory usage detected', true, {
              ...snapshot,
              threshold: MEMORY_THRESHOLDS.heap,
              lastActions: this.lastActions.slice(0, 10)
            });
          }

          if (snapshot.nodes > MEMORY_THRESHOLDS.nodes) {
            log.warn('High DOM node count detected', true, {
              ...snapshot,
              threshold: MEMORY_THRESHOLDS.nodes,
              lastActions: this.lastActions.slice(0, 10)
            });
          }

          if (snapshot.eventListeners > MEMORY_THRESHOLDS.eventListeners) {
            log.warn('High event listener count detected', true, {
              ...snapshot,
              threshold: MEMORY_THRESHOLDS.eventListeners,
              lastActions: this.lastActions.slice(0, 10)
            });
          }
        } catch (error) {
          log.error('Memory monitoring error', false, error);
        }
      }, 30000); // 30 second interval
    } catch (error) {
      log.error('Failed to initialize resource monitoring', false, error);
    }
  }

  private initializeStateRecovery(): void {
    const lastFatalError = localStorage.getItem('lastFatalError');
    if (lastFatalError) {
      try {
        const error = JSON.parse(lastFatalError);
        log.error('Recovered from previous crash', true, {
          previousError: error,
          timeSince: Date.now() - new Date(error.timestamp).getTime()
        });
        localStorage.removeItem('lastFatalError');
      } catch (e) {
        // Handle parse error
      }
    }
  }

private checkPreviousError(): void {
    try {
      const lastError = localStorage.getItem('lastFatalError');
      const lastState = localStorage.getItem('lastStateBeforeClose');

      if (lastError) {
        const errorData = JSON.parse(lastError);
        log.error('Recovered error from previous session', true, errorData);
        localStorage.removeItem('lastFatalError');
      }

      if (lastState) {
        const stateData = JSON.parse(lastState);
        log.info('Recovered state from previous session', true, stateData);
        localStorage.removeItem('lastStateBeforeClose');
      }
    } catch (e) {
      // Ignore recovery errors
    }
  }

  private getMemorySnapshot(): MemorySnapshot {
    const performance = window.performance as ExtendedPerformance;
    return {
      time: Date.now(),
      memory: performance?.memory?.usedJSHeapSize,
      nodes: document.getElementsByTagName('*').length,
      eventListeners: this.getEventListenerCount(),
      location: window.location.href
    };
  }

  private captureStateSnapshot(): StateSnapshot {
    const performance = window.performance as ExtendedPerformance;

    return {
      timestamp: Date.now(),
      route: window.location.pathname,
      activeModals: Array.from(document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]'))
        .map(el => ({
          id: el.id,
          class: (el as HTMLElement).className,
          visible: (el as HTMLElement).style.display !== 'none'
        })),
      componentStack: this.captureComponentStack(),
      eventQueue: this.getEventListeners(),
      lastActions: [...this.lastActions],
      memoryUsage: {
        jsHeapSize: performance?.memory?.usedJSHeapSize,
        totalNodes: document.getElementsByTagName('*').length,
        eventListeners: this.getEventListenerCount()
      }
    };
  }

  private captureComponentStack(): string[] {
    const stack: string[] = [];
    let element = document.activeElement;

    while (element && element !== document.body) {
      const componentName = element.getAttribute('data-component') ||
                           element.getAttribute('class') ||
                           element.tagName;
      stack.push(componentName);
      element = element.parentElement;
    }

    return stack;
  }

  private getEventListeners(): string[] {
    // Basic estimation of event types
    const elements = document.getElementsByTagName('*');
    const listeners: string[] = [];

    for (const element of elements) {
      const eventAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('on'))
        .map(attr => attr.name);
      listeners.push(...eventAttributes);
    }

    return listeners;
  }

  private getEventListenerCount(): number {
    const elements = document.getElementsByTagName('*');
    let count = 0;
    for (const element of elements) {
      count += Object.keys(element).
        filter(key => key.startsWith('on')).
        length;
    }
    return count;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public destroy(): void {
    try {
      if (this.resourceCheckInterval) {
        clearInterval(this.resourceCheckInterval);
      }
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
      }
      this.isInitialized = false;
    } catch (error) {
      log.error('Error during ErrorHandler cleanup', false, error);
    }
  }
}


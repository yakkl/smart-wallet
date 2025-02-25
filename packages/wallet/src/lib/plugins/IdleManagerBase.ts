import { browser_ext } from '$lib/common/environment';
import { log } from '$lib/plugins/Logger';
import type { IdleConfig, IdleState, IdleWidth } from '$lib/common/idle/types';
import { NotificationService } from '$lib/common/notifications';

export abstract class IdleManagerBase {
  protected isLockdownInitiated = false;
  protected previousState: IdleState = 'active';
  protected readonly threshold: number;
  protected readonly lockDelay: number;
  protected readonly checkInterval: number;
  protected stateWidth: IdleWidth;

  constructor(config: IdleConfig) {
    this.threshold = config.threshold;
    this.lockDelay = Math.max(0, config.lockDelay); // Ensure non-negative
    this.checkInterval = config.checkInterval || 15000; // 15 seconds default
    this.stateWidth = config.width;

    if (this.lockDelay === 0) {
      log.info('Lock delay is 0, lockdown will occur immediately upon idle state');
    }
  }

  protected async handleStateChanged(state: IdleState): Promise<void> {
    if (state === this.previousState) return;

    log.info(`${this.stateWidth} idle state changing from ${this.previousState} to ${state}`);
    this.previousState = state;

    try {
      switch (state) {
        case 'active':
          this.isLockdownInitiated = false;
          await browser_ext.alarms.clear("yakkl-lock-alarm");
          await browser_ext.runtime.sendMessage({type: 'startPricingChecks'});
          break;

        case 'idle':
        case 'locked':
          if (!this.isLockdownInitiated) {
            this.isLockdownInitiated = true;

            if (this.lockDelay <= 0) {
              // Immediate lockdown
              log.warn(`${state} detected, initiating immediate lockdown`);
              await browser_ext.runtime.sendMessage({type: 'stopPricingChecks'});
              await browser_ext.runtime.sendMessage({type: 'lockdown'});
            } else {
              // TODO: Will need to revist 'sendMessage' for 'lockdownImminent'
              // Delayed lockdown
              log.warn(`${state} detected, lockdown will occur in ${this.lockDelay/1000} seconds`);
              await browser_ext.runtime.sendMessage({type: 'stopPricingChecks'});
              // Send a notication that lockdown is imminent
              try {
                log.warn(`${state} detected, sending imminent lockdown notification`);

                // Used the notication sending directly from here due to UI context.
                await NotificationService.sendSecurityAlert(
                  'YAKKL will be locked soon due to inactivity.',
                  {
                    contextMessage: 'Use YAKKL to prevent automatic lockdown',
                    requireInteraction: true,
                    priority: 2
                  },
                  'lockdown-warning' // Distinct ID for warning
                );

                browser_ext.alarms.create("yakkl-lock-alarm", {
                  when: Date.now() + this.lockDelay
                });
                log.info('Alarm set for lockdown in approx. ', this.lockDelay / 1000, ' seconds');
              } catch (error) {
                log.error('Error sending imminent lockdown notification:', error);
              }
            }
          }
          break;
      }
    } catch (error) {
      this.handleError(error as Error, 'Error handling state change');
      this.isLockdownInitiated = false;
      this.previousState = 'active';
    }
  }

  abstract start(): void;
  abstract stop(): void;
  abstract checkCurrentState(): Promise<void>;

  getStateWidth(): IdleWidth {
    return this.stateWidth;
  }

  protected handleError(error: Error, context: string) {
    log.error(`[${this.stateWidth}] ${context}:`, error);
    // Optionally reset state
    this.isLockdownInitiated = false;
    this.previousState = 'active';
  }

  async setStateWidth(width: IdleWidth): Promise<void> {
    if (this.stateWidth === width) return;

    // Stop current monitoring
    this.stop();

    // Update width
    this.stateWidth = width;

    // Reset state
    this.isLockdownInitiated = false;
    this.previousState = 'active';

    // Restart with new width
    this.start();

    log.info(`Idle detection width changed to: ${width}`);
  }
}

import type { IdleConfig, IdleState } from '$lib/common/idle/types';
import { IdleManagerBase } from './IdleManagerBase';
import { browser_ext } from '$lib/common/environment';
import { log } from './Logger';

export class SystemWideIdleManager extends IdleManagerBase {
  constructor(config: IdleConfig) {
    super({ ...config, width: 'system-wide' });
    this.handleStateChanged = this.handleStateChanged.bind(this);
  }

  start(): void {
    try {
      log.info('Starting system-wide idle manager...');

      const detectionIntervalSeconds = Math.floor(this.threshold / 1000);

      log.info(`Setting idle detection interval to ${detectionIntervalSeconds} seconds`);
      log.info(`Lockdown will occur ${this.lockDelay/1000} seconds after idle state`);

      browser_ext.idle.setDetectionInterval(detectionIntervalSeconds);

      if (!browser_ext.idle.onStateChanged.hasListener(this.handleStateChanged)) {
        browser_ext.idle.onStateChanged.addListener(this.handleStateChanged);
        log.info('System-wide idle listener registered');
      }

      this.checkCurrentState().catch(error =>
        this.handleError(error as Error, 'Error checking initial state')
      );
    } catch (error) {
      this.handleError(error as Error, 'Error starting system-wide idle manager');
    }
  }

  stop(): void {
    if (browser_ext.idle.onStateChanged.hasListener(this.handleStateChanged)) {
      browser_ext.idle.onStateChanged.removeListener(this.handleStateChanged);
      log.info('System-wide idle manager stopped');
    }
  }

  async checkCurrentState(): Promise<void> {
    try {
      const detectionIntervalSeconds = Math.floor(this.threshold / 1000);
      const state = await browser_ext.idle.queryState(detectionIntervalSeconds);

      // Important: If we're active, ensure any pending lockdown is canceled
      if (state === 'active' && this.isLockdownInitiated) {
        this.isLockdownInitiated = false;
        await browser_ext.alarms.clear("yakkl-lock-alarm");
      }

      await this.handleStateChanged(state as IdleState);
    } catch (error) {
      this.handleError(error as Error, 'Error checking current state');
    }
  }
}

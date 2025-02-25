import { browser_ext } from '$lib/common/environment';
import { log } from '$lib/plugins/Logger';
import { IDLE_AUTO_LOCK_CYCLE, IDLE_AUTO_LOCK_CYCLE_TIME, PATH_LOGOUT } from '$lib/common/constants';
import { goto } from '$app/navigation';
import { sendNotificationMessage } from '$lib/common/notifications';
import { handleLockDown } from '$lib/common/handlers';

export class IdleManager {
  private lastActivity: number = Date.now();
  private idleCheckInterval: number | null = null;
  private readonly CHECK_INTERVAL = 10000; // Check every 10 seconds
  private readonly IDLE_THRESHOLD = IDLE_AUTO_LOCK_CYCLE_TIME *
    (IDLE_AUTO_LOCK_CYCLE > 0 ? IDLE_AUTO_LOCK_CYCLE : 1);
  private isLockdownInitiated = false;

  constructor() {
    this.resetTimer = this.resetTimer.bind(this);
    this.checkIdleStatus = this.checkIdleStatus.bind(this);
  }

  private resetTimer() {
    this.lastActivity = Date.now();
    this.isLockdownInitiated = false;
  }

  private async checkIdleStatus() {
    const timeSinceLastActivity = Date.now() - this.lastActivity;

    log.debug('IdleManager:', `Time since last activity: ${timeSinceLastActivity}ms`, this.IDLE_THRESHOLD);

    if (timeSinceLastActivity >= this.IDLE_THRESHOLD && !this.isLockdownInitiated) {
      this.isLockdownInitiated = true;
      log.debug('Idle threshold reached, initiating lockdown');

      try {
        // Send lockdown message
        // await browser_ext.runtime.sendMessage({ type: 'lockdown' });

        // Stop checking for idle
        this.stop();

        handleLockDown();
        await sendNotificationMessage('🚨 For your protection, YAKKL has been locked!', 'You were inactive, and for maximum security, your wallet has been automatically logged out. \nUnauthorized access is now impossible. \nRe-authentication is required to continue');
        goto(PATH_LOGOUT);
      } catch (error) {
        log.error('Error during idle lockdown:', error);
      }
    }
  }

  private onVisibilityChange = () => {
    if (document.hidden) {
      // Optional: could start a shorter timer for hidden state
      this.lastActivity = Date.now() - (this.IDLE_THRESHOLD / 2);
    } else {
      this.resetTimer();
    }
  }

  start() {
    if (this.idleCheckInterval) {
      log.debug('Idle manager already started', this.idleCheckInterval);
      this.stop();
    }

    log.debug('Starting idle check interval');

    // Add activity listeners
    window.addEventListener('mousemove', this.resetTimer);
    window.addEventListener('mousedown', this.resetTimer);
    window.addEventListener('keypress', this.resetTimer);
    window.addEventListener('DOMMouseScroll', this.resetTimer);
    window.addEventListener('mousewheel', this.resetTimer);
    window.addEventListener('touchmove', this.resetTimer);
    window.addEventListener('MSPointerMove', this.resetTimer);
    window.addEventListener('focus', this.resetTimer);

    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Start periodic checking
    this.idleCheckInterval = window.setInterval(this.checkIdleStatus, this.CHECK_INTERVAL);
    log.debug('Idle manager started', this.idleCheckInterval);
  }

  stop() {
    if (this.idleCheckInterval) {
      log.debug('Stopping idle check interval', this.idleCheckInterval);
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }

    // Remove all listeners
    window.removeEventListener('mousemove', this.resetTimer);
    window.removeEventListener('mousedown', this.resetTimer);
    window.removeEventListener('keypress', this.resetTimer);
    window.removeEventListener('DOMMouseScroll', this.resetTimer);
    window.removeEventListener('mousewheel', this.resetTimer);
    window.removeEventListener('touchmove', this.resetTimer);
    window.removeEventListener('MSPointerMove', this.resetTimer);
    window.removeEventListener('focus', this.resetTimer);

    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    log.debug('Idle manager stopped');
  }
}

// Create a singleton instance
export const idleManager = new IdleManager();

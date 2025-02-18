import { startLockIconTimer, stopLockIconTimer } from '$lib/extensions/chrome/iconTimer';
import { isBrowserEnv, browser_ext } from './environment';
import { log } from '$plugins/Logger';

/**
 * Utility function to validate the `browser_ext` object.
 * @throws Error if `browser_ext` is not initialized.
 */
function checkBrowserExt(): void {
  if ( !isBrowserEnv() ) {
    log.error('Browser extension API is not available.');
    throw new Error('Browser extension API is not initialized. Ensure this code is running in a browser extension environment.');
  }
}

/**
 * Sends a ping notification to the runtime.
 */
export async function sendNotificationPing() {
  try {
    checkBrowserExt();
    const response = await browser_ext.runtime.sendMessage({
      type: 'ping',
    });

    if (isResponseWithSuccess(response)) {
      log.info('Ping response status:', response);
    } else {
      log.error('Unexpected response structure:', response);
    }
  } catch (error) {
    log.error('No Pong response:', error);
  }
}

/**
 * Sends a notification with a given title and message text.
 * @param {string} title - Notification title.
 * @param {string} messageText - Notification message.
 */
export async function sendNotificationMessage(title: string, messageText: string) {
  try {
    checkBrowserExt();

    await browser_ext.notifications.create(
      'yakkl-notification',
      {
        type: 'basic',
        iconUrl: browser_ext.runtime.getURL('/images/logoBullLock48x48.png'),
        title: title || 'Notification',
        message: messageText || 'Default message.',
      }
    );

  } catch (error) {
    log.error('Error sending notification message:', error);
  }
}

/**
 * Sends a request to start the lock icon timer.
 */
export async function sendNotificationStartLockIconTimer() {
  try {
    checkBrowserExt();
    startLockIconTimer();
  } catch (error) {
    log.error('Error starting lock icon timer:', error);
  }
}

/**
 * Sends a request to stop the lock icon timer.
 */
export async function sendNotificationStopLockIconTimer() {
  try {
    checkBrowserExt();
    stopLockIconTimer();
  } catch (error) {
    log.error('Error stopping lock icon timer:', error);
  }
}

/**
 * Helper function to check if a response indicates success.
 * @param {unknown} response - The response object.
 * @returns {boolean} True if the response contains a `success` property set to true.
 */
function isResponseWithSuccess(response: unknown): boolean {
  return typeof response === 'object' && response !== null && 'success' in response && (response as any).success === true;
}

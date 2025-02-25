import type { BasicNotificationOptions, CreateNotificationOptions, ImageNotificationOptions, ListNotificationOptions, NotificationOptions, ProgressNotificationOptions } from './types';
import { startLockIconTimer, stopLockIconTimer } from '$lib/extensions/chrome/iconTimer';
import { isBrowserEnv, browser_ext } from './environment';
import { log } from '$plugins/Logger';

const DEFAULT_ICON = '/images/logoBullLock48x48.png';

// Simple notication functions - below

// Flexible notification service class
export class NotificationService {
  private static readonly DEFAULT_ID = 'yakkl-notification';
  private static readonly DEFAULT_ICON = '/images/logoBullLock48x48.png';

  private static async createNotification(
    options: NotificationOptions,
    id?: string
  ): Promise<void> {
    try {
      const notificationOptions: CreateNotificationOptions = {
        ...options,
        iconUrl: browser_ext.runtime.getURL(this.DEFAULT_ICON),
      };

      await browser_ext.notifications.create(
        id || this.DEFAULT_ID,
        notificationOptions
      );
    } catch (error) {
      log.error('Error creating notification:', error);
    }
  }

  static async sendBasic(
    title: string,
    message: string,
    options: Partial<Omit<BasicNotificationOptions, 'type' | 'title' | 'message'>> = {},
    id?: string
  ): Promise<void> {
    await this.createNotification({
      type: 'basic',
      title,
      message,
      ...options,
    } as BasicNotificationOptions, id);
  }

  static async sendList(
    title: string,
    message: string,
    items: Array<{ title: string; message: string }>,
    options: Partial<Omit<ListNotificationOptions, 'type' | 'title' | 'message' | 'items'>> = {},
    id?: string
  ): Promise<void> {
    await this.createNotification({
      type: 'list',
      title,
      message,
      items,
      ...options,
    } as ListNotificationOptions, id);
  }

  static async sendImage(
    title: string,
    message: string,
    imageUrl: string,
    options: Partial<Omit<ImageNotificationOptions, 'type' | 'title' | 'message' | 'imageUrl'>> = {},
    id?: string
  ): Promise<void> {
    await this.createNotification({
      type: 'image',
      title,
      message,
      imageUrl,
      ...options,
    } as ImageNotificationOptions, id);
  }

  static async sendProgress(
    title: string,
    message: string,
    progress: number,
    options: Partial<Omit<ProgressNotificationOptions, 'type' | 'title' | 'message' | 'progress'>> = {},
    id?: string
  ): Promise<void> {
    await this.createNotification({
      type: 'progress',
      title,
      message,
      progress: Math.max(0, Math.min(100, progress)),
      ...options,
    } as ProgressNotificationOptions, id);
  }
  
  // Convenience methods for specific notifications
  static async sendSecurityAlert(
    message: string,
    options: Partial<Omit<BasicNotificationOptions, 'type' | 'title' | 'message'>> = {},
    id?: string
  ): Promise<void> {
    await this.sendBasic(
      '🔒 Security Alert',
      message,
      {
        requireInteraction: true,
        priority: 2,
        silent: false,  // Ensure audio notification
        ...options  // Allow overriding defaults if needed
      },
      id || 'security-alert'  // Default ID for security alerts
    );
  }
}


// Functions to send notifications to the browser extension

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

import { isBrowserEnv, browser_ext } from '$lib/common/environment';
import type { Runtime } from 'webextension-polyfill';
import { startLockIconTimer, stopLockIconTimer } from '$lib/extensions/chrome/iconTimer';
import { setIconLock, setIconUnlock } from '$lib/utilities/utilities';
import { log } from '$lib/plugins/Logger';

type RuntimeSender = Runtime.MessageSender;

// These functions are used to add and remove listeners for the extension EXCEPT for the window listeners and any other listeners that may be specific to a given component or whatever.

export async function onRuntimeMessageListener(
  message: any,
  sender: RuntimeSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void> {
  try {
    if (!isBrowserEnv()) {
      log.warn('Yakkl may not running as a browser extension context from the calling environment.');
      // return true;
    }

    // NOTE: There is another one that addresses specific UI related messages
    switch (message.type) {
      case 'ping': {
        sendResponse({ success: true, message: 'Pong' });
        return true; // Indicates asynchronous response
      }
      case 'createNotification': {
          const { notificationId, title, messageText } = message.payload;

          // Testing to see where this may have come from. May remove this test later
          if (title === 'Security Notification') {
            // debug_log('Security Notification canceled...');
            sendResponse({ success: false, message: 'Security Notification canceled' });
            return true; // Indicate asynchronous response
          }

          await browser_ext.notifications.create(notificationId as string, {
            type: 'basic',
            iconUrl: browser_ext.runtime.getURL('/images/logoBullLock48x48.png'),
            title: title || 'Notification',
            message: messageText || 'Default message.',
          });

          sendResponse({ success: true, message: 'Notification sent' });
          return true; // Indicate asynchronous response
      }
      case 'startLockIconTimer': {
        if (isBrowserEnv()) {
          startLockIconTimer();
          sendResponse({ success: true, message: 'Lock icon timer started.' });
        }
        return true;
      }
      case 'stopLockIconTimer': {
        if (isBrowserEnv()) {
          stopLockIconTimer();
          sendResponse({ success: true, message: 'Lock icon timer stopped.' });
        }
        return true;
      }
      case 'setIconLock': {
        if (isBrowserEnv()) {
          await setIconLock();
          sendResponse({ success: true, message: 'Lock icon set.' });
        }
        return true;
      }
      case 'setIconUnlock': {
        if (isBrowserEnv()) {
          await setIconUnlock();
          sendResponse({ success: true, message: 'Unlock icon set.' });
        }
        return true;
      }
      // case 'showDappPopup': {
      // }
      default: {
        if (isBrowserEnv()) sendResponse({ success: false, error: 'Unknown message type.' });
        return true;
      }
    }
  } catch (error: any) {
    log.error('Error handling message:', error);
    if (isBrowserEnv()) sendResponse({ success: false, error: error?.message || 'Unknown error occurred.' });
    return true; // Indicate asynchronous response
  }
}

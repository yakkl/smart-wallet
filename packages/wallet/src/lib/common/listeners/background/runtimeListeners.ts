import { isBrowserEnv, browser_ext } from '$lib/common/environment';
import type { Runtime } from 'webextension-polyfill';
import { debug_log } from '$lib/common/debug-error';
import { startLockIconTimer, stopLockIconTimer } from '$lib/extensions/chrome/timers';
import { setIconLock, setIconUnlock } from '$lib/utilities/utilities';

type RuntimeSender = Runtime.MessageSender;

// These functions are used to add and remove listeners for the extension EXCEPT for the window listeners and any other listeners that may be specific to a given component or whatever.

// // Runtime Listeners...
// // Add all runtime listeners
// export async function addRuntimeListeners() {
//   try {
//     console.log('Adding runtime listeners...');

//     // Used in background.ts
//     if (!browser_ext.runtime.onMessage.hasListener(onRuntimeMessageListener)) {
//       browser_ext.runtime.onMessage.removeListener(onRuntimeMessageListener);
//       browser_ext.runtime.onMessage.addListener(onRuntimeMessageListener);
//     }



//     console.log('Listeners added.');
//   } catch (error) {
//     console.log('[ERROR]: Error adding runtime listeners:', error);
//   }
// }

// // Remove all runtime listeners
// export async function removeRuntimeListeners() {
//   try {
//     console.log('Removing runtime listeners...');

//     // No need to check if it exists before removing it
//     browser_ext.runtime.onMessage.removeListener(handleOnMessageForExtension);
//     browser_ext.runtime.onMessage.removeListener(handleOnMessageForPricing);
//     browser_ext.runtime.onMessage.removeListener(onRuntimeMessageListener);

//     console.log('Listeners removed.');
//   } catch (error) {
//     console.log('[ERROR]: Error removing runtime listeners:', error);
//   }
// }



export async function onRuntimeMessageListener(
  message: any,
  sender: RuntimeSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void> {
  try {
    if (!isBrowserEnv()) {
      console.log('Yakkl may not running as a browser extension context from the calling environment.');
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
            debug_log('Security Notification canceled...');
            console.trace();
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
    console.log('[ERROR]: Error handling message:', error);
    if (isBrowserEnv()) sendResponse({ success: false, error: error?.message || 'Unknown error occurred.' });
    return true; // Indicate asynchronous response
  }
}

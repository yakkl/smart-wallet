// listeners/uiListeners.ts
import { ListenerManager } from '$lib/plugins/ListenerManager';
import { browser_ext, isBrowserEnv } from '$lib/common/environment';
import type { Runtime } from 'webextension-polyfill';  // Correct Type Import
import { goto } from '$app/navigation';
import { startCheckPrices, stopCheckPrices } from '$lib/tokens/prices';
import { PATH_LOCK } from '$lib/common/constants';
import { handleLockDown } from '$lib/common/handlers';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
import { log } from '$plugins/Logger';

export const uiListenerManager = new ListenerManager();

// Register uiListenerManager globally
globalListenerManager.registerContext('ui', uiListenerManager);

// NOTE: At some point, move the handle... to their own file

// Centralized message handler function
// Not called now...
export async function handleOnMessageForExtension(
  message: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void>  {
  try {
    if (message.type === 'lockdown') {
      handleLockDown();  // Correct function call
      sendResponse({ success: true, message: 'Lockdown initiated.' });
      goto(PATH_LOCK);

      log.debug('Lockdown initiated.');

      return true;  // return type - asynchronous
    }
  } catch (e: any) {
    log.error('Error handling message:', e);
    if (isBrowserEnv()) sendResponse({ success: false, error: e?.message || 'Unknown error occurred.' });
    return true; // Indicate asynchronous response
  }
}

// Message handler for starting and stopping price checks. This is primarily sent by active, idle, locked states.
export async function handleOnMessageForPricing(
  message: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void>  {
  try {
    switch(message.type) {
      case 'startPricingChecks': {
        startCheckPrices();
        sendResponse({ success: true, message: 'Price checks initiated.' });
        return true;  // return type - asynchronous
      }
      case 'stopPricingChecks': {
        stopCheckPrices();
        sendResponse({ success: true, message: 'Stop price checks initiated.' });
        return true;  // return type - asynchronous
      }
    }
  } catch (e: any) {
    log.error('Error handling message:', e);
    if (isBrowserEnv()) sendResponse({ success: false, error: e?.message || 'Unknown error occurred.' });
    return true; // Indicate asynchronous response
  }
}

// function handleButtonClick(event: Event) {
//   console.log('Button clicked:', event.target);
// }

// function handlePopupMessage(message: any, sender: any, sendResponse: any) {
//   console.log('Popup message received:', message);
// }

export function addUIListeners() {
  log.debug('Adding UI listeners...');
  uiListenerManager.add(browser_ext.runtime.onMessage, handleOnMessageForExtension);
  uiListenerManager.add(browser_ext.runtime.onMessage, handleOnMessageForPricing);
}

export function removeUIListeners() {
  log.debug('Removing UI listeners...');
  uiListenerManager.removeAll();
}

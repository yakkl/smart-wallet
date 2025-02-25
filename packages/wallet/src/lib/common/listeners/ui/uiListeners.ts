// listeners/uiListeners.ts
import { ListenerManager } from '$lib/plugins/ListenerManager';
import { browser_ext, isBrowserEnv } from '$lib/common/environment';
import type { Runtime } from 'webextension-polyfill';  // Correct Type Import
import { goto } from '$app/navigation';
import { startCheckPrices, stopCheckPrices } from '$lib/tokens/prices';
import { PATH_LOGOUT } from '$lib/common/constants';
import { handleLockDown } from '$lib/common/handlers';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
import { log } from '$plugins/Logger';
import { NotificationService, sendNotificationMessage } from '$lib/common/notifications';

export const uiListenerManager = new ListenerManager();

// Register uiListenerManager globally
globalListenerManager.registerContext('ui', uiListenerManager);

// Centralized message handler function - This is only a fallback from the old way of doing things but will continue to work
export async function handleOnMessageForExtension(
  message: any,
  sender: Runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void>  {
  try {
    log.debug('Message received:', message, sender);

    switch(message.type) {
      case 'lockdown': {
        await browser_ext.runtime.sendMessage({type: 'stopPricingChecks'});
        await handleLockDown();  // Correct function call
        sendResponse({ success: true, message: 'Lockdown initiated.' });
        await NotificationService.sendSecurityAlert('YAKKL Wallet locked due to inactivity. \nTo prevent unauthorized transactions, your wallet has been locked and logged out.', {contextMessage: 'Click extension icon to relaunch'});
        log.warn('User inactive, locking down wallet for maximum security.');
        goto(PATH_LOGOUT);
        return true;  // return type - asynchronous
      }
      case 'lockdownImminent': {
        log.info('Sending imminent lockdown notification...');
        sendResponse({ success: true, message: 'Imminent lockdown notification sent.' });
        await NotificationService.sendSecurityAlert('YAKKL Lockdown Imminent. \nFor your protection, YAKKL will be locked soon.', {contextMessage: 'Use YAKKL before timeout to stop lockdown'});
        log.warn('User inactive, sending imminent lockdown notification.');
        return true;  // return type - asynchronous
      }
      default: {
        log.warn('Unknown message type:', message.type);
        sendResponse({ success: false, message: 'Unhandled message type' });
        return true;
      }
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
//   log.info('Button clicked:', event.target);
// }

// function handlePopupMessage(message: any, sender: any, sendResponse: any) {
//   log.info('Popup message received:', message);
// }

export function addUIListeners() {
  // log.debug('Adding UI listeners...');
  uiListenerManager.add(browser_ext.runtime.onMessage, handleOnMessageForExtension);
  uiListenerManager.add(browser_ext.runtime.onMessage, handleOnMessageForPricing);
}

export function removeUIListeners() {
  // log.debug('Removing UI listeners...');
  uiListenerManager.removeAll();
}

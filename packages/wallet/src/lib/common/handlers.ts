// src/utils/handlers.ts
// import { goto } from '$app/navigation';
import { setIconLock } from '$lib/utilities';
// import { PATH_LOCK } from './constants';
import type { Runtime } from 'webextension-polyfill';  // Correct Type Import
import { getObjectFromLocalStorage, setObjectInLocalStorage } from './storage';
import { dateString } from './datetime';
import type { Settings } from './interfaces';
import { sendNotificationStopLockIconTimer } from './notifications';

// Centralized message handler function
export function handleOnMessage(
  request: any,
  sender: Runtime.MessageSender
): true | Promise<unknown> {
  try {
    if (request?.method === 'yak_lockdown') {
      // goto(PATH_LOCK);  // Assuming PATH_LOCK is correctly defined
      handleLockDown();  // Correct function call
      return true;  // Correct return type
    }
    return Promise.resolve();  // Return a valid Promise if nothing is handled
  } catch (e) {
    console.log('Error handling message:', e);
    return Promise.resolve();  // Fallback on error
  } finally {
    setIconLock();
  }
}

// Originally onBeforeUnload handler
export async function handleLockDown() {
  try {
    await setIconLock();
    const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
    if (yakklSettings) {
      yakklSettings.isLocked = true;
      yakklSettings.isLockedHow = 'window_exit';
      yakklSettings.updateDate = dateString();
      await setObjectInLocalStorage('settings', yakklSettings);
      sendNotificationStopLockIconTimer(); // Remove any lock icon timers
    }
  } catch (error) {
    console.log('Error in beforeunload handler:', error);
  }
}

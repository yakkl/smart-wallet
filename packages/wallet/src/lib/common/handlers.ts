import { setIconLock } from "$lib/utilities/utilities";
import { dateString } from "./datetime";
import type { Settings } from "./interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "./storage";
import { isBrowserEnv } from "./environment";
import { stopLockIconTimer } from "$lib/extensions/chrome/iconTimer";
import { yakklCurrentlySelectedStore } from "./stores";
import { get } from "svelte/store";
import { log } from "$plugins/Logger";

// Handlers / Callbacks that are not used as listeners in the extension

// Originally onBeforeUnload handler
export async function handleLockDown() {
  try {
    if (isBrowserEnv()) {
      await setIconLock();
      const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
      if (yakklSettings && !yakklSettings.isLocked) {
        yakklSettings.isLocked = true;
        yakklSettings.isLockedHow = 'window_exit';
        yakklSettings.updateDate = dateString();
        await setObjectInLocalStorage('settings', yakklSettings);
        const yakklCurrentlySelected = get(yakklCurrentlySelectedStore);
        yakklCurrentlySelected.shortcuts.isLocked = true;
        yakklCurrentlySelectedStore.set(yakklCurrentlySelected);
        stopLockIconTimer();
      }
    } else {
      log.info('handleLockDown: Does not believe to be in a browser environment.');
    }
  } catch (error) {
    log.error('Error in unload handler:', false, error);
  }
}


// // src/utils/handlers.ts
// import type { Runtime } from 'webextension-polyfill';  // Correct Type Import
// import { PATH_LOCK } from '../constants';
// import { goto } from '$app/navigation';
// import { handleLockDown } from './handleLockDown';
// import { isBrowserEnv } from '../environment';
// import { debug_log } from '../debug-error';
// import { startCheckPrices, stopCheckPrices } from '$lib/tokens/prices';

// // Centralized message handler function
// // Not called now...
// export async function handleOnMessageForExtension(
//   message: any,
//   sender: Runtime.MessageSender,
//   sendResponse: (response?: any) => void
// ): Promise<boolean | void>  {
//   try {
//     if (message.type === 'lockdown') {
//       handleLockDown();  // Correct function call
//       sendResponse({ success: true, message: 'Lockdown initiated.' });
//       goto(PATH_LOCK);

//       debug_log('Lockdown initiated.');

//       return true;  // return type - asynchronous
//     }
//   } catch (e: any) {
//     console.log('[ERROR]: Error handling message:', e);
//     if (isBrowserEnv()) sendResponse({ success: false, error: e?.message || 'Unknown error occurred.' });
//     return true; // Indicate asynchronous response
//   }
// }

//   // Message handler for starting and stopping price checks. This is primarily sent by active, idle, locked states.
//   export async function handleOnMessageForPricing(
//     message: any,
//     sender: Runtime.MessageSender,
//     sendResponse: (response?: any) => void
//   ): Promise<boolean | void>  {
//     try {
//       switch(message.type) {
//         case 'startPricingChecks': {
//           startCheckPrices();
//           sendResponse({ success: true, message: 'Price checks initiated.' });
//           return true;  // return type - asynchronous
//         }
//         case 'stopPricingChecks': {
//           stopCheckPrices();
//           sendResponse({ success: true, message: 'Stop price checks initiated.' });
//           return true;  // return type - asynchronous
//         }
//       }
//     } catch (e: any) {
//       console.log('[ERROR]: Error handling message:', e);
//       if (isBrowserEnv()) sendResponse({ success: false, error: e?.message || 'Unknown error occurred.' });
//       return true; // Indicate asynchronous response
//     }
//   }

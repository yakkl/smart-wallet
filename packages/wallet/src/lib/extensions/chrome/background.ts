/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Background actions for the extension...

import { initializeEIP6963 } from './eip-6963';
import { addBackgroundListeners } from '$lib/common/listeners/background/backgroundListeners';
import { debug_log } from '$lib/common/debug-error';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
import { log } from '$lib/plugins/Logger';

addBackgroundListeners();
initializeEIP6963();


export async function onSuspendListener() {
  try {
    debug_log('[INFO]: onSuspendListener');
    // removeBackgroundListeners();
    globalListenerManager.removeAll();
  } catch (error) {
    log.error('Background: onSuspendListener:', error);
  }
}


// try {
//   browser_ext.runtime.onStartup.addListener(async () => {
//     log.error('[INFO]: background - onStartup');
//     await browser_ext.action.openPopup();
//   });
// } catch (error) {
//   log.error('background - onStartup error',error);
// }

// try {
//   if (!browser_ext.runtime.onMessage.hasListener(onRuntimeMessageListener)) {
//     browser_ext.runtime.onMessage.removeListener(onRuntimeMessageListener);
//     browser_ext.runtime.onMessage.addListener(onRuntimeMessageListener);
//   }
// } catch (error) {
//   log.error('background - onMessage error',error);
// }

// try {
//   if (!browser_ext.runtime.onConnect.hasListener(onPortConnectListener)) {
//     browser_ext.runtime.onConnect.removeListener(onPortConnectListener);
//     browser_ext.runtime.onConnect.addListener(onPortConnectListener);
//   }
// } catch (error) {
//   log.error('background - onConnect error',error);
// }

// try {
//   if (!browser_ext.tabs.onUpdated.hasListener(onTabUpdatedListener)) {
//     browser_ext.tabs.onUpdated.removeListener(onTabUpdatedListener);
//     browser_ext.tabs.onUpdated.addListener(onTabUpdatedListener);
//   }
// } catch (error) {
//   log.error('background:', error);
// }

// try {
//   if (!browser_ext.runtime.onInstalled.hasListener(onInstalledUpdatedListener)) {
//     browser_ext.runtime.onInstalled.removeListener(onInstalledUpdatedListener);
//     browser_ext.runtime.onInstalled.addListener(onInstalledUpdatedListener);
//   }
// } catch (error) {
//   log.error('background - onInstalled error',error);
// }

// try {
//   if (!browser_ext.idle.onStateChanged.hasListener(onStateChangedListener)) {
//     browser_ext.idle.onStateChanged.removeListener(onStateChangedListener);
//     browser_ext.idle.onStateChanged.addListener(onStateChangedListener);
//   }
// } catch (error) {
//   log.error('background - onStateChanged error',error);
// }

// try {
//   if (!browser_ext.alarms.onAlarm.hasListener(onAlarmListener)) {
//     browser_ext.alarms.onAlarm.removeListener(onAlarmListener);
//     browser_ext.alarms.onAlarm.addListener(onAlarmListener);
//   }
// } catch (error) {
//   log.error('background - onAlarm error',error);
// }

// try {
//   if (!browser_ext.runtime.onSuspend.hasListener(onSuspendListener)) {
//     browser_ext.runtime.onSuspend.removeListener(onSuspendListener);
//     browser_ext.runtime.onSuspend.addListener(onSuspendListener);
//   }
// } catch (error) {
//   log.error('background - onSuspend error',error);
// }

// try {
//   if (!browser_ext.tabs.onRemoved.hasListener(onTabRemovedListener)) {
//     browser_ext.tabs.onRemoved.removeListener(onTabRemovedListener);
//     browser_ext.tabs.onRemoved.addListener(onTabRemovedListener);
//   }
// } catch (error) {
//   log.error('background - tab error',error);
// }

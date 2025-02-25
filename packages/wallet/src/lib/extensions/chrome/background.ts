/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Background actions for the extension...

import { initializeEIP6963 } from './eip-6963';
import { addBackgroundListeners } from '$lib/common/listeners/background/backgroundListeners';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
import { log } from '$lib/plugins/Logger';
import { browser_ext } from '$lib/common/environment';
import { onAlarmListener } from '$lib/common/listeners/background/alarmListeners';

// NOTE: This is a workaround for how Chrome handles alarms, listeners, and state changes in the background
//  It appears that if the extension is suspended, the idle listener may not be triggered
//  This workaround sets up a periodic check to ensure the state is updated
//  If the devtools are open, the extension is not suspended and works as expected but, Chrome seems to be
//  more aggressive when devtools is not open

// UPDATE: Move idle timer to the IdleManager plugin and for anything needed to always be active while the UI is active

// Initialize on startup
function initialize() {
  if (!browser_ext.alarms.onAlarm.hasListener(onAlarmListener)) {
    browser_ext.alarms.onAlarm.addListener(onAlarmListener);
  }

  // Currently - deprecated since it is handled by the IdleManager. However, if needed for something else then implement
  // if (!browser_ext.idle.onStateChanged.hasListener(onStateChangedListener)) {
  //   browser_ext.idle.onStateChanged.addListener(onStateChangedListener);
  // }
}

// Ensure initialization happens at key points
browser_ext.runtime.onStartup.addListener(initialize);
browser_ext.runtime.onInstalled.addListener(initialize);
initialize(); // Initial setup on load or reload. Alarm and State need to be set up quickly so they are here

addBackgroundListeners();
initializeEIP6963();

// unused at the moment
export async function onSuspendListener() {
  try {
    log.info('onSuspendListener');
    globalListenerManager.removeAll();
  } catch (error) {
    log.error('Background: onSuspendListener:', error);
  }
}


// Original code
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

import { clearAlarm } from "$lib/common/alarms";
import { debug_log } from "$lib/common/debug-error";
import { isBrowserEnv } from "$lib/common/environment";
import { handleLockDown } from "$lib/common/handlers";


export async function onAlarmListener(alarm: any) {
  try {
    if (isBrowserEnv()) {
      // try/catch should catch an invalid alarm object
      if (alarm.name === "yakkl-lock-alarm") {
        debug_log('yakkl-lock-alarm being handled');

        await handleLockDown();
        // Notification needs to be sent from somewhere else. This closes, locks, updates (via handleLockDown)
        await clearAlarm("yakkl-lock-alarm"); // Clear the alarm so since it forwarded everything
      }
    } else {
      console.log('[INFO]: Yakkl may not running as a browser extension context from the calling environment.');
    }
  } catch (error) {
    console.log('[ERROR]: background.js - onAlarmListener - error:', error);
  }
}

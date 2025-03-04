import { clearAlarm } from "$lib/common/alarms";
import { IDLE_AUTO_LOCK_CYCLE, IDLE_AUTO_LOCK_CYCLE_TIME } from "$lib/common/constants";
import { browser_ext } from "$lib/common/environment";
import { log } from "$lib/plugins/Logger";

// DEPRECATED
export async function onStateChangedListener(state: string): Promise<void> {
  try {
    // Add a guard to prevent multiple simultaneous executions
    // const lockKey = 'idle-state-lock';
    // const now = Date.now();
    // const lastCheck = await browser_ext.storage.local.get(lockKey);

    // if (lastCheck && lastCheck[lockKey] && (now - Number(lastCheck[lockKey]) < 30000)) {
    //   return; // Prevent multiple checks within 30 seconds
    // }

    // await browser_ext.storage.local.set({ [lockKey]: now });

    // switch(state) {
    //   case 'active':
    //     clearAlarm("yakkl-lock-alarm");
    //     await browser_ext.runtime.sendMessage({type: 'startPricingChecks'});
    //     break;
    //   case 'idle':
    //   case 'locked':
    //     browser_ext.alarms.create("yakkl-lock-alarm", {
    //       when: Date.now() + (IDLE_AUTO_LOCK_CYCLE_TIME *
    //         (IDLE_AUTO_LOCK_CYCLE > 0 ? IDLE_AUTO_LOCK_CYCLE : 1))
    //     });
    //     await browser_ext.runtime.sendMessage({type: 'stopPricingChecks'});
    //     break;
    // }
  } catch (error) {
    log.error('onStateChangedListener:', false, error);
  }
}

// export async function onStateChangedListener(state: string): Promise<void> {
//   try {
//     // let yakklPreferences;

//     switch(state) {
//     case 'active':
//       clearAlarm("yakkl-lock-alarm"); // If no alarm is found then nothing happens
//       await browser_ext.runtime.sendMessage({type: 'startPricingChecks',});
//       break;
//     case 'idle':
//       // yakklPreferences = await getObjectFromLocalStorage("preferences") as Preferences;
//       // yakklPreferences?.idleAutoLock
//       // Remove idle lock preference - this should not be an option to disable it
//       browser_ext.alarms.create("yakkl-lock-alarm", {when: Date.now() + (IDLE_AUTO_LOCK_CYCLE_TIME*(IDLE_AUTO_LOCK_CYCLE > 0 ? IDLE_AUTO_LOCK_CYCLE : 1))});
//       await browser_ext.runtime.sendMessage({type: 'stopPricingChecks',}); // NOTE: Stop all timers??
//       break;
//     case 'locked':
//       // Stop the lock icon timer
//       // Stop any price checks - may have to send a one-off message to popup to stop checking prices
//       browser_ext.alarms.create("yakkl-lock-alarm", {when: Date.now() + (1000*30)});
//       await browser_ext.runtime.sendMessage({type: 'stopPricingChecks',}); // NOTE: Stop all timers??
//       break;
//     }
//   } catch (error) {
//     log.error('onStateChangedListener:', false, error);
//   }
// }

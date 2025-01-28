import { clearAlarm } from "$lib/common/alarms";
import { IDLE_AUTO_LOCK_CYCLE } from "$lib/common/constants";
import { debug_log } from "$lib/common/debug-error";
import { browserSvelte } from "$lib/common/environment";
import { handleLockDown } from "$lib/common/handlers";
import type { Preferences } from "$lib/common/interfaces";
import { getObjectFromLocalStorage } from "$lib/common/storage";


export async function onStateChangedListener(state: string): Promise<void> {
  try {
    let yakklPreferences;

    switch(state) {
    case 'active':
      debug_log('yakkl - background - onStateChanged to ACTIVE');
      clearAlarm("yakkl-lock-alarm"); // If no alarm is found then nothing happens
      await browser_ext.runtime.sendMessage({type: 'startPricingChecks',});
      break;
    case 'idle':
      yakklPreferences = await getObjectFromLocalStorage("preferences") as Preferences;
      if (yakklPreferences?.idleAutoLock) {
        browser_ext.alarms.create("yakkl-lock-alarm", {when: Date.now() + (60000*(IDLE_AUTO_LOCK_CYCLE > 0 ? IDLE_AUTO_LOCK_CYCLE : 1))});
        debug_log('yakkl - background - onStateChanged to IDLE - it will lock in ', (60000*(IDLE_AUTO_LOCK_CYCLE > 0 ? IDLE_AUTO_LOCK_CYCLE : 1))/1000, 'seconds');
      }
      await browser_ext.runtime.sendMessage({type: 'stopPricingChecks',});
      break;
    case 'locked':
      // Stop the lock icon timer
      // Stop any price checks - may have to send a one-off message to popup to stop checking prices
      debug_log('yakkl - background - onStateChanged to LOCKED');
      await handleLockDown();
      await browser_ext.runtime.sendMessage({type: 'stopPricingChecks',});
      break;
    }
  } catch (error) {
    console.log('[ERROR]: onStateChangedListener:', error);
  }
}

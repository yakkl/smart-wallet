import type { Settings } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { setIconLock, setIconUnlock } from "$lib/utilities";
import { browser_ext } from "$lib/common/environment";
import { debug_log } from "$lib/common/debug-error";

let lockIconTimer: ReturnType<typeof setInterval> | null = null;

export function startLockIconTimer() {
  try {
    debug_log('Starting lock icon timer', lockIconTimer);

    // Improved guard: Ensure it's either null or a valid timer ID
    if (lockIconTimer === null || typeof lockIconTimer === "undefined") {
      lockIconTimer = setInterval(async () => {
        try {
          const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
          if (yakklSettings.isLocked) {
            await setIconLock();
            await browser_ext.runtime.sendMessage({ type: 'lockdown' });
          } else {
            await setIconUnlock();
          }
        } catch (error) {
          console.error('Error in lock icon timer interval:', error);
        }
      }, 10000); // Check every 10 seconds
    }
  } catch (error: any) {
    console.log('Error starting lock icon timer:', error, error?.stack);
  }
}

export async function stopLockIconTimer() {
  try {
    await setIconLock();
    const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
    if (yakklSettings) {
      if (lockIconTimer !== null && typeof lockIconTimer !== 'undefined') {
        clearInterval(lockIconTimer);
        lockIconTimer = null;
      }
      if (!yakklSettings.isLocked) {
        yakklSettings.isLocked = true;
        await setObjectInLocalStorage('settings', yakklSettings);
      }
      await browser_ext.runtime.sendMessage({type: 'lockdown',});
    }
  } catch (error: any) {
    console.log('Error stopping lock icon timer:', error, error?.stack);
  }
}

export async function stopTimers() {
  try {
    await stopLockIconTimer();
    // Add more timers here...
  } catch (error) {
    console.log('Error stopping timers:', error);
  }
}

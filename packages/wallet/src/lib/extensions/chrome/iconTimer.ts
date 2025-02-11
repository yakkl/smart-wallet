import type { Settings, YakklCurrentlySelected } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { setIconLock, setIconUnlock } from "$lib/utilities";
import { browser_ext } from "$lib/common/environment";
import { STORAGE_YAKKL_CURRENTLY_SELECTED, STORAGE_YAKKL_SETTINGS } from "$lib/common/constants";
import { setLocks } from "$lib/common/locks";
import { yakklCurrentlySelectedStore } from "$lib/common/stores";

let lockIconIntervalID: ReturnType<typeof setInterval> | null = null;

export function startLockIconTimer() {
  try {
    // Improved guard: Ensure it's either null or a valid timer ID
    if (lockIconIntervalID === null || typeof lockIconIntervalID === "undefined") {
      lockIconIntervalID = setInterval(async () => {
        try {
          const yakklSettings = await getObjectFromLocalStorage(STORAGE_YAKKL_SETTINGS) as Settings;
          const yakklCurrentlySelected = await getObjectFromLocalStorage(STORAGE_YAKKL_CURRENTLY_SELECTED) as YakklCurrentlySelected;
          if (yakklCurrentlySelected) { // This just makes sure the locks are the same
            if (yakklSettings.isLocked !== yakklCurrentlySelected.shortcuts.isLocked) {
              yakklCurrentlySelected.shortcuts.isLocked = yakklSettings.isLocked;
              await setObjectInLocalStorage(STORAGE_YAKKL_CURRENTLY_SELECTED, yakklCurrentlySelected);
              yakklCurrentlySelectedStore.set(yakklCurrentlySelected);
            }
          }
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
    console.log('[ERROR]: Error starting lock icon timer:', error, error?.stack);
  }
}

export async function stopLockIconTimer() {
  try {
    await setIconLock();
    const yakklSettings = await getObjectFromLocalStorage(STORAGE_YAKKL_SETTINGS) as Settings;
    if (yakklSettings) {
      if (lockIconIntervalID !== null && typeof lockIconIntervalID !== 'undefined') {
        clearInterval(lockIconIntervalID);
        lockIconIntervalID = null;
      }
      // await setLocks(true);
      await browser_ext.runtime.sendMessage({type: 'lockdown',});
    }
  } catch (error: any) {
    console.log('[ERROR]: Error stopping lock icon timer:', error, error?.stack);
  }
}


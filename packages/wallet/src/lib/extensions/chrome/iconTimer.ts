import type { Settings, YakklCurrentlySelected } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { setIconLock, setIconUnlock } from "$lib/utilities";
import { browser_ext } from "$lib/common/environment";
import { STORAGE_YAKKL_CURRENTLY_SELECTED, STORAGE_YAKKL_SETTINGS } from "$lib/common/constants";
import { yakklCurrentlySelectedStore } from "$lib/common/stores";
import { timerManager } from "$lib/plugins/TimerManager";
import { log } from "$plugins/Logger";

export function startLockIconTimer() {
  try {
    timerManager.addTimer('iconTimer_lockIcon', async () => {
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
        log.error('Error in lock icon timer interval:', error);
      }
    }, 10000);
    timerManager.startTimer('iconTimer_lockIcon');
  } catch (error: any) {
    log.error('Error starting lock icon timer:', error, error?.stack);
  }
}

export async function stopLockIconTimer() {
  try {
    await setIconLock();
    const yakklSettings = await getObjectFromLocalStorage(STORAGE_YAKKL_SETTINGS) as Settings;
    if (yakklSettings) {
      timerManager.removeTimer('iconTimer_lockIcon'); // Stops and clears the timer
      await browser_ext.runtime.sendMessage({type: 'lockdown',});
    }
  } catch (error: any) {
    log.error('Error stopping lock icon timer:', error, error?.stack);
  }
}


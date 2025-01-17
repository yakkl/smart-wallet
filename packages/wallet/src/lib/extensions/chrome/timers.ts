import type { Settings } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { setIconLock, setIconUnlock } from "$lib/utilities";


let lockIconTimer: ReturnType<typeof setInterval> | null = null;

export function startLockIconTimer() {
  if (!lockIconTimer) {
    lockIconTimer = setInterval(async () => {
      const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
      if (yakklSettings?.isLocked) {
        await setIconLock();
      } else {
        await setIconUnlock();
      }
    }, 10000); // Check every 10 seconds
  }
}

export async function stopLockIconTimer() {
  await setIconLock();
  const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
  if (yakklSettings) {
    yakklSettings.isLocked = true;
    await setObjectInLocalStorage('settings', yakklSettings);
  }
  if (lockIconTimer) {
    clearInterval(lockIconTimer);
    lockIconTimer = null;
  }
}

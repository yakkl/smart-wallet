import { VERSION } from "$lib/common/constants";
import type { Preferences, Settings } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { log } from "$lib/plugins/Logger";
import { upgrade } from "$lib/upgrades/upgrades";
import { detect } from "detect-browser";
import type { Runtime } from "webextension-polyfill";

type RuntimePlatformInfo = Runtime.PlatformInfo;

export async function setLocalObjectStorage(platform: RuntimePlatformInfo | null, upgradeOption: boolean = false): Promise<void> {
  try {
    const yakklSettings = await getObjectFromLocalStorage<Settings>("settings") as Settings | null;
    const prevVersion = yakklSettings?.version ?? VERSION;

    if (upgradeOption) {
      upgrade(prevVersion, VERSION);
    }

    const yakklPreferences = await getObjectFromLocalStorage<Preferences>("preferences") as Preferences | null;

    if (yakklSettings) {
      yakklSettings.previousVersion = yakklSettings.version;
      yakklSettings.version = VERSION;
      yakklSettings.updateDate = new Date().toISOString();
      yakklSettings.upgradeDate = yakklSettings.updateDate;
      yakklSettings.lastAccessDate = yakklSettings.updateDate;

      if (platform !== null) {
        const browserPlatform = detect();
        yakklSettings.platform.arch = platform.arch;
        yakklSettings.platform.os = platform.os;
        yakklSettings.platform.browser = browserPlatform?.name ?? '';
        yakklSettings.platform.browserVersion = browserPlatform?.version ?? '';
        yakklSettings.platform.platform = browserPlatform?.type ?? '';
      }

      await setObjectInLocalStorage('settings', yakklSettings);
    }
  } catch (e) {
    log.error('setLocalObjectStorage Error', false, e);
    throw e;
  }
}


import { STORAGE_YAKKL_CURRENTLY_SELECTED, STORAGE_YAKKL_SETTINGS } from "./constants";
import { dateString } from "./datetime";
import type { Settings, YakklCurrentlySelected } from "./interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "./storage";
import { yakklCurrentlySelectedStore, yakklSettingsStore } from "./stores";
import { log } from "$plugins/Logger";

export async function setLocks(locked: boolean = true, registration: string = '') {
  try {
    let dirty = false;

    const yakklSettings = await getObjectFromLocalStorage(STORAGE_YAKKL_SETTINGS) as Settings;
    if (yakklSettings) {
      dirty = false;
      if (locked) {
        if (!yakklSettings.isLocked) {
          yakklSettings.isLocked = true;
          yakklSettings.lastAccessDate = dateString();
          if (registration) yakklSettings.registeredType = registration;
          await setObjectInLocalStorage('settings', yakklSettings);
          dirty = true;
        }
      } else {
        if (yakklSettings.isLocked) {
          yakklSettings.isLocked = false;
          yakklSettings.lastAccessDate = dateString();
          if (registration) yakklSettings.registeredType = registration;
          await setObjectInLocalStorage('settings', yakklSettings);
          dirty = true;
        }
      }
      if (dirty) yakklSettingsStore.set(yakklSettings);
    }

    const yakklCurrentlySelected = await getObjectFromLocalStorage(STORAGE_YAKKL_CURRENTLY_SELECTED) as YakklCurrentlySelected;
    if (yakklCurrentlySelected) {
      dirty = false;
      if (locked) {
        if (!yakklCurrentlySelected.shortcuts.isLocked) {
          yakklCurrentlySelected.shortcuts.isLocked = true;
          await setObjectInLocalStorage(STORAGE_YAKKL_CURRENTLY_SELECTED, yakklCurrentlySelected);
          dirty = true;
        }
      } else {
        if (yakklCurrentlySelected.shortcuts.isLocked) {
          yakklCurrentlySelected.shortcuts.isLocked = false;
          await setObjectInLocalStorage(STORAGE_YAKKL_CURRENTLY_SELECTED, yakklCurrentlySelected);
          dirty = true;
        }
      }
      if (dirty) yakklCurrentlySelectedStore.set(yakklCurrentlySelected);
    }
  } catch (error) {
    log.error("Error setting locks:", false, error);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import { log } from '$lib/plugins/Logger';

const browser_ext = getBrowserExt();

export const clearObjectsFromLocalStorage = async (): Promise<void> => {
  try {
    await browser_ext.storage.local.clear();
  } catch (error) {
    log.error('Error clearing local storage', error);
    throw error;
  }
};

// This had two arguments, but I removed the second one since we only want to return objects
// export const getObjectFromLocalStorage = async <T>(key: string): Promise<T | null> => {
//   try {
//     if (!browser_ext) {
//       console.log('Browser extension is not available. Returning null.');
//       return null;
//     }
//     const result = await browser_ext.storage.local.get(key);
//     return result[key] as T;
//   } catch (error) {
//     console.log('Error getting object from local storage', error);
//     throw error;
//   }
// };

export const getObjectFromLocalStorage = async <T>(key: string, timeoutMs = 2000): Promise<T | null> => {
  try {
    if (!browser_ext) {
      return null;
    }

    const storagePromise = browser_ext.storage.local.get(key);

    // Set a timeout to prevent infinite hangs
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        resolve(null);
      }, timeoutMs)
    );

    const result = await Promise.race([storagePromise, timeoutPromise]);

    if (!result || !(key in result)) {
      return null;
    }

    return result[key] as T;
  } catch (error) {
    log.error('Error getting object from local storage', error);
    return null;
  }
};

export const setObjectInLocalStorage = async <T extends Record<string, any>>(key: string, obj: T | string): Promise<void> => {
  try {
    await browser_ext.storage.local.set({ [key]: obj });
  } catch (error) {
    log.error('Error setting object in local storage', error);
    throw error;
  }
};

export const removeObjectFromLocalStorage = async (keys: string): Promise<void> => {
  try {
    await browser_ext.storage.local.remove(keys);
  } catch (error) {
    log.error('Error removing object from local storage', error);
    throw error;
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
const browser_ext = getBrowserExt();

export const clearObjectsFromLocalStorage = async (): Promise<void> => {
  try {
    await browser_ext.storage.local.clear();
  } catch (error) {
    console.log('[ERROR]: Error clearing local storage', error);
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
    console.log('[ERROR]: Error getting object from local storage', error);
    return null;
  }
};

export const setObjectInLocalStorage = async <T extends Record<string, any>>(key: string, obj: T | string): Promise<void> => {
  try {
    await browser_ext.storage.local.set({ [key]: obj });
  } catch (error) {
    console.log('[ERROR]: Error setting object in local storage', error);
    throw error;
  }
};

export const removeObjectFromLocalStorage = async (keys: string): Promise<void> => {
  try {
    await browser_ext.storage.local.remove(keys);
  } catch (error) {
    console.log('[ERROR]: Error removing object from local storage', error);
    throw error;
  }
};















// /* eslint-disable no-useless-catch */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment

// import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
// // import { decodeJSON, isValidJSON } from '$lib/common/misc';
// // import { encodeJSON } from '$lib/common/misc';

// const browser_ext = getBrowserExt();

// // These are the base persistent data storage calls
// // Call this for the whole data store
// export const clearObjectsFromLocalStorage = async function(): Promise<void> {
//   return new Promise((resolve, reject) => {
//     try {
//       browser_ext.storage.local.clear().then(() => {
//         resolve();
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const getObjectFromLocalStorage = async function<T>(key: string, toObject: boolean = true): Promise<T | string | null> {
//   try {
//     if (!browser_ext) return null;
//     const result = await browser_ext.storage.local.get(key);
//     // Do below for backend service if ever needed (convert json to object)
//     // if (result[key]) {
//     //   if (toObject && typeof result[key] === 'string' && isValidJSON(result[key])) {
//     //     return decodeJSON(result[key]) as T;
//     //   }
//       return result[key] as T;
//     // }
//     // return null;
//   } catch (error) {
//     console.log('Error getting object from local storage', error);
//     throw error;
//   }
// };

// // Data can be an object or json
// export const setObjectInLocalStorage = async function<T extends Record<string, any>>(key: string, obj: T | string): Promise<void> {
//   try {
//     // Do the below before sending to a backend service if ever needed (convert object to json)
//     // const storageObject: Record<string, string>;
//     // Check if obj is already a JSON string
//     // if (typeof obj === 'string') {
//     //   try {
//     //     JSON.parse(obj); // This will throw an error if obj is not valid JSON
//     //     storageObject = { [key]: obj };
//     //   } catch {
//     //     // If obj is not a valid JSON string, treat it as an object and encode it
//     //     storageObject = { [key]: encodeJSON(obj as unknown as T) };
//     //   }
//     // } else {
//       // If obj is an object, encode it to JSON string
//       // storageObject = { [key]: encodeJSON(obj) };  // May change this back to storing object directly in local storage
//     // }
//     await browser_ext.storage.local.set({ [key]: obj });
//   } catch (error) {
//     console.log('Error setting object in local storage', error);
//     throw error;
//   }
// };


// // Call this for a single key to remove
// export const removeObjectFromLocalStorage = async function(keys: string): Promise<void>  {
//   return new Promise((resolve, reject) => {
//     try {
//       browser_ext.storage.local.remove(keys).then(() => {
//         resolve();
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };


// export const clearObjectsFromSessionStorage = async function(): Promise<void> {
//   return new Promise((resolve, reject) => {
//     try {
//       browser_ext.storage.session.clear().then(() => {
//         resolve();
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// }


// export const getObjectFromSessionStorage = async function<T>(key: string): Promise<T> {
//   return new Promise((resolve, reject) => {
//     try {
//       browser_ext.storage.session.get(key).then((value: { [key: string]: unknown }) => {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//           resolve(value[key] as T);
//         } else {
//           reject(new Error(`Key "${key}" not found in session storage`));
//         }
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };


// export const setObjectInSessionStorage = async function<T extends Record<string, any>>(obj: T): Promise<void> {
//   // eslint-disable-next-line no-useless-catch
//   try {
//     await browser_ext.storage.session.set(obj);
//   } catch (error) {
//     throw error;
//   }
// };

// // export const setObjectInSessionStorage = async function<T>(obj: T): Promise<void> {
// //   return new Promise((resolve, reject) => {
// //     try {
// //       browser_ext.storage.session.set(obj).then(() => {
// //         resolve();
// //       });
// //     } catch (error) {
// //       reject(error);
// //     }
// //   });
// // };


// // Call this for a single key to remove
// export const removeObjectFromSessionStorage = async function(keys: string | string[]): Promise<void> {
//   return new Promise((resolve, reject) => {
//     try {
//       browser_ext.storage.session.remove(keys).then(() => {
//         resolve();
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

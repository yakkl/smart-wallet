/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/utilities/defaults.ts

import { getProfile, yakklMiscStore } from '$lib/common/stores';
import { decryptData, digestMessage } from '$lib/common/encryption';
import type { ProfileData } from '$lib/common/interfaces';
import { isEncryptedData } from '$lib/common/misc';
import { log } from '$lib/plugins/Logger';


// Verifies the profile using the provided id and decrypts data if necessary.
export async function verify(id: string) {
  try {
    if (!id) {
      return undefined;
    }
    const profile = await getProfile();
    const digest = await digestMessage(id);
    if (!profile || !digest) {
      yakklMiscStore.set('');
      return undefined;
    } else {
      if (isEncryptedData(profile.data)) {
        await decryptData(profile.data, digest).then(result => {
          profile.data = result as ProfileData;
          yakklMiscStore.set(digest);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }, _reason => {
          throw 'Verification failed!';
        });
      }
      return profile;
    }
  } catch (e) {
    log.error(e);
    return undefined;
  }
}

// Type guards and utility functions for various types.
// export function isEncryptedData(data: any): data is EncryptedData {
//   return (data as EncryptedData).iv !== undefined;
// }

// export function isProfileData(data: EncryptedData | ProfileData | Promise<ProfileData>): data is ProfileData {
//   return (data as ProfileData).pincode !== undefined;
// }

// export function isMetaData(meta: unknown): meta is MetaData {
//   return meta !== null && typeof meta === 'object';
// }

// export function isCurrentlySelectedData(data: EncryptedData | CurrentlySelectedData): data is CurrentlySelectedData {
//   return (data as CurrentlySelectedData).profile !== undefined;
// }

// export function isPrimaryAccountData(data: EncryptedData | PrimaryAccountData): data is PrimaryAccountData {
//   return (data as PrimaryAccountData).privateKey !== undefined;
// }

// export function isYakklPrimaryAccount(account: any): account is YakklPrimaryAccount {
//   return account && account.subAccounts !== undefined;
// }

// export function isYakklAccount(account: any): account is YakklAccount {
//   return account && account.accountType !== undefined;
// }

// export async function resolveProperties<T>(object: Readonly<Deferrable<T>>): Promise<T> {
//   const promises: Array<Promise<Result>> = Object.keys(object).map(async (key) => {
//     const value = object[<keyof Deferrable<T>>key];
//     const v = await Promise.resolve(value);
//     return { key: key, value: v };
//   });

//   const results = await Promise.all(promises);

//   return results.reduce((accum, result) => {
//     accum[<keyof T>(result.key)] = result.value;
//     return accum;
//   }, <T>{});
// }


// defaults.ts

// Ensures that the object has all the properties from the defaults object, and sets them to the default value if they are missing.
// export function ensureDefaults<T extends object>(obj: T, defaults: Partial<T>): T {
//   for (const key in defaults) {
//     if (obj[key] === undefined) {
//       obj[key] = defaults[key]!;
//     }
//   }
//   return obj;
// }

// For null or undefined properties, set them to the value passed. Use this to set values for properties that are null or undefined.
// export function setDefinedProperty<T extends object, K extends keyof T>(
//   target: T | undefined,
//   property: K,
//   value: T[K] | undefined
// ): void {
//   if (target && value !== undefined) {
//     target[property] = value;
//   }
// }

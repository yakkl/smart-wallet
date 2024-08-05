/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/utilities/get.ts
import { decryptData, encryptData } from '$lib/common/encryption';
import { isEncryptedData } from '$lib/common/misc';
import type { EncryptedData } from '$lib/common/interfaces';


// Decrypts and sets data, returning the decrypted data or the original data if not encrypted.
export async function decryptAndSetData<T>(
  data: EncryptedData | T,
  decryptionKey: string
): Promise<T> {
  if (isEncryptedData(data)) {
    const decryptedData = await decryptData(data, decryptionKey);
    return decryptedData as T;
  }
  return data as T;
}

export async function setAndEncryptData<T extends object>(data: T, key: string): Promise<EncryptedData> {
  // Encrypt the data and return the result
  return await encryptData(data, key);
}

// Sets a property on an object if the value is defined (not undefined or null)
export function setDefinedProperty<T extends object, K extends keyof T>(
  target: T | undefined,
  property: K,
  value: T[K] | undefined
): void {
  if (target && value !== undefined && value !== null) {
    target[property] = value;
  }
}

// Ensures that the object has all the properties from the defaults object, and sets them to the default value if they are missing.
export function ensureDefaults<T extends object>(obj: T, defaults: Partial<T>): T {
  for (const key in defaults) {
    if (obj[key] === undefined) {
      obj[key] = defaults[key]!;
    }
  }
  return obj;
}

// Safely increments a property on an object.
export function incrementProperty<T extends object, K extends keyof T>(obj: T, property: K, incrementValue: number = 1, maxValue: number = -1): void {
  incrementValue = Math.abs(incrementValue); // Ensure incrementValue is always positive
  if (typeof obj[property] === 'number') {
    let newValue = (obj[property] as unknown as number ?? 0) + incrementValue;
    if (maxValue !== -1 && newValue > maxValue) {
      newValue = maxValue;
    }
    obj[property] = newValue as any;
  } else {
    obj[property] = incrementValue as any;
  }
}

// Safely decrements a property on an object.
export function decrementProperty<T extends object, K extends keyof T>(obj: T, property: K, decrementValue: number = 1, ensureNonNegative: boolean = true): void {
  decrementValue = Math.abs(decrementValue); // Ensure decrementValue is always positive
  if (typeof obj[property] === 'number') {
    let newValue = (obj[property] as unknown as number ?? 0) - decrementValue;
    if (ensureNonNegative && newValue < 0) {
      newValue = 0;
    }
    obj[property] = newValue as any;
  } else {
    obj[property] = ensureNonNegative ? 0 as any : (-decrementValue as any);
  }
}

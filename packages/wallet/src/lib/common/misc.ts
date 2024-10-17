/* eslint-disable @typescript-eslint/no-explicit-any */
import { memoize } from 'lodash-es';
import {
  ENVIRONMENT_TYPES,
  PLATFORM_TYPES,
  makeError,
  type BytesLike,
  type CurrentlySelectedData,
  type Deferrable,
  type EncryptedData,
  type MetaData,
  type PrimaryAccountData,
  type ProfileData,
  type Result,
  type YakklAccount,
  type YakklPrimaryAccount,
} from '.';
import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
// import { getYakklPrimaryAccounts } from '$lib/common/stores';  // TODO: This generates an error from webpack due to not finding dataModels.ts?????????????????????????


export async function getPrimaryAccountByAddress(address: string): Promise<YakklPrimaryAccount | null> {
  if (!address) return null;
  // First, try to find the account in the reactive store
  const accounts: YakklPrimaryAccount[] = []; //await getYakklPrimaryAccounts();
  
  if (!accounts) return null;
  // Find the account with the matching address
  const primaryAccount = accounts.find((account: YakklPrimaryAccount) => account.address === address);

  return primaryAccount || null; // Return null if no account is found
}


export function encodeJSON<T>(obj: T): string {
  const jsonString = JSON.stringify(obj, (_, value) => {
    if (typeof value === "bigint") {
      return value.toString() + 'n';
    }
    if (typeof value === "object" && value !== null && Object.keys(value).length === 0) {
      return "{}";
    }
    return value;
  });
  return jsonString;
}

export function decodeJSON<T>(jsonString: string): T {
  return JSON.parse(jsonString, (_key, value) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
}

export function parseWithBigInt(jsonString: string): any {
  return JSON.parse(jsonString, (_, value) =>
    typeof value === 'string' && /^\d+n$/.test(value) ? BigInt(value.slice(0, -1)) : value
  );
}

// This will test to see if encodeJSON or cloneDeep should be called in deepCopy
export function isJSONSerializable(value: any): boolean {
  return (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    Array.isArray(value) ||
    (typeof value === 'object' &&
      Object.prototype.toString.call(value) === '[object Object]' &&
      (Object.getPrototypeOf(value) === null || Object.getPrototypeOf(value) === Object.prototype))
  );
}

export function isNull(obj: any): boolean {
  return obj === null;
}

export function isUndefined(obj: any): boolean {
  return obj === undefined;
}

export function isEmptyObject(obj: any): boolean {
  return obj && typeof obj === 'object' && Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function isEmptyNullOrUndefined(obj: any): boolean {
  return obj === null || obj === undefined || (typeof obj === 'object' && Object.keys(obj).length === 0 && obj.constructor === Object);
}

export function isValidJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function isEncryptedData(data: any): data is EncryptedData {
  return (
    !isEmptyNullOrUndefined(data) &&
    typeof data.iv === 'string' &&
    typeof data.data === 'string' &&
    typeof data.salt === 'string'
  );
}

export function isProfileData(data: EncryptedData | ProfileData | Promise<ProfileData>): data is ProfileData {
  return (data as ProfileData).pincode !== undefined; // May want to also add '(data as ProfileData).meta !== undefined'
}

export function isMetaData(meta: unknown): meta is MetaData {
  return meta !== null && typeof meta === 'object';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isCurrentlySelectedData(data: EncryptedData | CurrentlySelectedData): data is CurrentlySelectedData {
  return (data as CurrentlySelectedData).profile !== undefined;
}

export function isPrimaryAccountData(data: EncryptedData | PrimaryAccountData): data is PrimaryAccountData {
  return (data as PrimaryAccountData).privateKey !== undefined;
}

// Type guards
export function isYakklPrimaryAccount(account: any): account is YakklPrimaryAccount {
  return account && account.subAccounts !== undefined;
}

export function isYakklAccount(account: any): account is YakklAccount {
  return account && account.accountType !== undefined;
}

export function isJsonObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function isPromiseJson(promise: Promise<Record<string, any>>): Promise<boolean> {
  try {
    const resolvedValue = await promise;
    return isJsonObject(resolvedValue);
  } catch {
    return false;
  }
}

// Type guard to check if a value is an instance of BigNumber
export function isBigNumber(value: any): value is BigNumber {
  return value instanceof BigNumber;
}

// Utility function to check if a value is BigNumberish
export function isBigNumberish(value: any): value is BigNumberish {
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && /^-?\d+$/.test(value)) || // Only match numeric strings
    typeof value === 'bigint' ||
    isBigNumber(value)
  );
}

// Utility function to convert BigNumberish values to hex string
export function toHex(value: BigNumberish): string {
  if (isBigNumber(value)) {
    return value.toHex();
  }
  const hex = BigNumber.from(value).toHex();
  return hex.length % 2 === 0 ? hex : '0x0' + hex.slice(2);
}


// Function to recursively traverse and convert numeric values to hex strings
export function convertToHexStrings<T>(obj: T, skipProperties: string[] = []): T {
  const skipSet = new Set(skipProperties);

  // Helper function to check if a path should be skipped
  function shouldSkip(path: string[]): boolean {
    const pathString = path.join('.');
    return Array.from(skipSet).some(skipPath => pathString.startsWith(skipPath));
  }

  // Helper function to handle the conversion
  function convert(value: any, path: string[] = []): any {
    if (shouldSkip(path)) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v, i) => convert(v, [...path, i.toString()]));
    } else if (value && typeof value === 'object' && !isBigNumber(value)) {
      const result: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = convert(value[key], [...path, key]);
        }
      }
      return result;
    } else if (isBigNumberish(value)) {
      return toHex(value);
    }
    return value;
  }

  return convert(obj);
}




export function parseJsonOrObject<T>(value: any): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Check if the value is already an object
  if (typeof value === 'object') {
    return value;
  }

  // Check if the value is a JSON string
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      // Ensure the parsed value is an object or an array
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing JSON string:', e);
      return null;
    }
  }

  return null;
}

export async function resolveProperties<T>(object: Readonly<Deferrable<T>>): Promise<T> {
  const promises: Array<Promise<Result>> = Object.keys(object).map(async (key) => {
      const value = object[<keyof Deferrable<T>>key];
      const v = await Promise.resolve( value );
    return ( { key: key, value: v } );
  });

  const results = await Promise.all( promises );
  
  console.log('resolveProperties results', results);

  return results.reduce((accum, result) => {
      accum[<keyof T>(result.key)] = result.value;
      return accum;
  }, <T>{});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkProperties(object: any, properties: { [ name: string ]: boolean }): void {
  if (!object || typeof(object) !== "object") {
      // logger.throwArgumentError("invalid object", "object", object);
      throw new Error("invalid object", object);
  }

  Object.keys(object).forEach((key) => {
      if (!properties[key]) {
          // logger.throwArgumentError("invalid object key - " + key, "transaction:" + key, object);
          throw new Error("invalid object key - " + key, object);
      }
  });
}

// Gets or sets a default value safely.
export function getOrDefault<T>(value: T | undefined, defaultValue: T): T {
  return value === undefined ? defaultValue : value;
}

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param {string} str - The string to prefix.
 * @returns {string} The prefixed string.
 */
export const addHexPrefix = (str: string): string => {
  if (typeof str !== 'string' || str.match(/^-?0x/u)) {
    return str;
  }

  if (str.match(/^-?0X/u)) {
    return str.replace('0X', '0x');
  }

  if (str.startsWith('-')) {
    return str.replace('-', '-0x');
  }

  return `0x${str}`;
};


/**
 * Removes '0x' from a given `String` if present
 * @param str the string value
 * @returns the string without 0x prefix
 */
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== 'string')
    throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`)

  return isHexPrefixed(str) ? str.slice(2) : str
}


/**
 * Returns a `Boolean` on whether or not the a `String` starts with '0x'
 * @param str the string input value
 * @return a boolean if it is or is not hex prefixed
 * @throws if the str input is not a string
 */
export function isHexPrefixed(str: string): boolean {
  if (typeof str !== 'string') {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`)
  }

  return str[0] === '0' && str[1] === 'x'
}


/**
 *  Returns true if %%value%% is a valid [[HexString]].
 *
 *  If %%length%% is ``true`` or a //number//, it also checks that
 *  %%value%% is a valid [[DataHexString]] of %%length%% (if a //number//)
 *  bytes of data (e.g. ``0x1234`` is 2 bytes).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHexString(value: any, length?: number | boolean): value is `0x${ string }` {
  if (typeof(value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
      return false
  }

  if (typeof(length) === "number" && value.length !== 2 + 2 * length) { return false; }
  if (length === true && (value.length % 2) !== 0) { return false; }

  return true;
}


function _getBytes(value: BytesLike, name?: string, copy?: boolean): Uint8Array {
  try {
    if (value instanceof Uint8Array) {
      if (copy) {
        return new Uint8Array(value);
      }
      return value;
    }

    if (typeof value === "string" && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
      const result = new Uint8Array((value.length - 2) / 2);
      let offset = 2;
      for (let i = 0; i < result.length; i++) {
        result[i] = parseInt(value.substring(offset, offset + 2), 16);
        offset += 2;
      }
      return result;
    }

    throw new Error("invalid BytesLike value");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw makeError(error.message, "INVALID_ARGUMENT", {
        argument: name || "value",
        value: value,
      });
    } else {
      throw error;
    }
  }
}


/**
*  Get a typed Uint8Array for %%value%%. If already a Uint8Array
*  the original %%value%% is returned; if a copy is required use
*  [[getBytesCopy]].
*
*  @see: getBytesCopy
*/
export function getBytes(value: BytesLike, name?: string): Uint8Array {
  return _getBytes(value, name, false);
}


/**
 *  Get a typed Uint8Array for %%value%%, creating a copy if necessary
 *  to prevent any modifications of the returned value from being
 *  reflected elsewhere.
 *
 *  @see: getBytes
 */
export function getBytesCopy(value: BytesLike, name?: string): Uint8Array {
  return _getBytes(value, name, true);
}


/**
*  Returns true if %%value%% is a valid representation of arbitrary
*  data (i.e. a valid [[DataHexString]] or a Uint8Array).
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isBytesLike(value: any): value is BytesLike {
  return (isHexString(value, true) || (value instanceof Uint8Array));
}

const HexCharacters: string = "0123456789abcdef";

/**
*  Returns a [[DataHexString]] representation of %%data%%.
*/
export function hexlify(data: BytesLike): string {
  const bytes = getBytes(data);

  let result = "0x";
  for (let i = 0; i < bytes.length; i++) {
      const v = bytes[i];
      result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
  }
  return result;
}

/**
 *  Returns a [[DataHexString]] by concatenating all values
 *  within %%data%%.
 */
export function concat(datas: ReadonlyArray<BytesLike>): string {
  return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
}

/**
*  Returns the length of %%data%%, in bytes.
*/
export function dataLength(data: BytesLike): number {
  if (isHexString(data, true)) { return (data.length - 2) / 2; }
  return getBytes(data).length;
}


/**
 *  Returns a [[DataHexString]] by slicing %%data%% from the %%start%%
 *  offset to the %%end%% offset.
 *
 *  By default %%start%% is 0 and %%end%% is the length of %%data%%.
 */
export function dataSlice(data: BytesLike, start?: number, end?: number): string {
  const bytes = getBytes(data);
  if (end != null && end > bytes.length) {
      // assert(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
      //     buffer: bytes, length: bytes.length, offset: end
      // });
  }
  return hexlify(bytes.slice((start == null) ? 0: start, (end == null) ? bytes.length: end));
}


/**
 * @see {@link getEnvironmentType}
 */
export const getEnvironmentTypeMemo = memoize((url: string): string => {
  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPES.POPUP;
  } else if (['/index.html'].includes(parsedUrl.pathname)) {
    return ENVIRONMENT_TYPES.BROWSER;
  } else if (parsedUrl.pathname === '/notification.html') {
    return ENVIRONMENT_TYPES.NOTIFICATION;
  }
  return ENVIRONMENT_TYPES.BACKGROUND;
});

/**
 * Returns the window type for the application
 *
 *  - `popup` refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 *  - `fullscreen` refers to the main browser window
 *  - `notification` refers to the popup that appears in its own window when taking action outside of metamask
 *  - `background` refers to the background page
 *
 * NOTE: This should only be called on internal URLs.
 *
 * @param {string} [url] - the URL of the window
 * @returns {string} the environment ENUM
 */
export const getEnvironmentType = (url: string = window.location.href): string =>
  getEnvironmentTypeMemo(url);

/**
 * Returns the platform (browser) where the extension is running.
 *
 * @returns {string} the platform ENUM
 */
export const getPlatform = (): string => {
  const { navigator } = window;
  const { userAgent } = navigator;

  // We do not currently support Safari
  if (userAgent.includes('Firefox')) {
    return PLATFORM_TYPES.FIREFOX;
  } else if ('brave' in navigator) {
    return PLATFORM_TYPES.BRAVE;
  } else if (userAgent.includes('Edg/')) {
    return PLATFORM_TYPES.EDGE;
  } else if (userAgent.includes('OPR')) {
    return PLATFORM_TYPES.OPERA;
  }
  return PLATFORM_TYPES.CHROME;
};

export function extractFQDN(url: string): string {
  try {
    if (!url) return '';
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    console.log(e);
    return '';
  }
}

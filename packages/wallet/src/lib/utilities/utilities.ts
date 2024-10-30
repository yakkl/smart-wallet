/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

/* eslint-disable no-debugger */
import { browser as browserSvelte} from "$app/environment";
import { get } from 'svelte/store';
import ClipboardJS from 'clipboard'; // 'clipboard?client'
import { PLATFORM_TYPES, DEFAULT_UPGRADE_LABEL } from "$lib/common/constants";
import { map } from "./map";
import { type BigNumberishLegacy } from '$lib/common';
import { encodeJSON } from '$lib/common/misc';
import type { BigNumberish } from '$lib/common/bignumber';
import { yakklVersionStore } from '$lib/common/stores';
import { Utils } from "alchemy-sdk";

import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import type { Browser } from 'webextension-polyfill';
let browser_ext: Browser; 
if (browserSvelte) browser_ext = getBrowserExt();

// gets or sets a default value safely
export function getOrDefault<T>(value: T | undefined, defaultValue: T): T {
  return value === undefined ? defaultValue : value;
}

/** Example usage for getOrDefault
function updateProfile(p: Profile) {
  p.subIndex = getOrDefault(p.subIndex, 0) + 1;
  p.name = getOrDefault(p.name, 'Unknown User');
  p.description = getOrDefault(p.description, 'No Description');
  p.lastLogin = new Date();
  p.isActive = getOrDefault(p.isActive, false);
}
**/

export function safeConvertBigIntToNumber( bigIntValue: bigint ): number {
  if ( bigIntValue < BigInt( Number.MIN_SAFE_INTEGER ) || bigIntValue > BigInt( Number.MAX_SAFE_INTEGER ) ) {
    throw new Error( 'BigInt value is outside the safe integer range' );
  }
  return Number( bigIntValue );
}

// Function to get the currency code for the user's locale
export function getCurrencyCodeForUserLocale(): string | undefined {
  const options = new Intl.NumberFormat( navigator.language, { style: 'currency', currency: 'USD' } ).resolvedOptions();
  return options.currency;
}

// Increments a property on an object safely. If maxValue is provided, the property will not be incremented beyond that value.
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

/** Example usage for incrementProperty
incrementProperty(profile, 'subIndex');  // Increments by 1 by default
console.log(profile.subIndex); // Should print 6

incrementProperty(profile, 'subIndex', -2);  // Increments by 2 (absolute value)
console.log(profile.subIndex); // Should print 8

incrementProperty(profile, 'subIndex', 5, 10);  // Attempts to increment by 5, should respect max value of 10
console.log(profile.subIndex); // Should print 10

incrementProperty(profile, 'subIndex', 5, -1);  // Attempts to increment by 5, no max value limit
console.log(profile.subIndex); // Should print 15
**/
 

// Decrements a property on an object safely. If ensureNonNegative is true, the property will not be decremented below 0.
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


/** Example usage for decrementProperty
 ecrementProperty(profile, 'subIndex');  // Decrements by 1 by default
console.log(profile.subIndex); // Should print 14

decrementProperty(profile, 'subIndex', -2);  // Decrements by 2 (absolute value)
console.log(profile.subIndex); // Should print 12

decrementProperty(profile, 'subIndex', 5);  // Attempts to decrement by 5, should ensure non-negative value
console.log(profile.subIndex); // Should print 7

// Decrementing without ensuring non-negative value
decrementProperty(profile, 'subIndex', 10, false);  // Decrements by 10, allows negative value
console.log(profile.subIndex); // Should print -3
**/ 

// Ensures that the object has all the properties from the defaults object, and sets them to the default value if they are missing.
export function ensureDefaults<T extends object>(obj: T, defaults: Partial<T>): T {
  for (const key in defaults) {
    if (obj[key] === undefined) {
      obj[key] = defaults[key]!;
    }
  }
  return obj;
}

// Set default values
/* Example usage for ensureDefaults
profile = ensureDefaults(profile, {
  subIndex: 0,
  name: 'Unknown',
  description: '',
  lastLogin: new Date(),
  isActive: true,
});
*/

// For null or undefined properties, set them to the value passed. Use this to set values for properties that are null or undefined.
export function setDefinedProperty<T extends object, K extends keyof T>(
  target: T | undefined,
  property: K,
  value: T[K] | undefined
): void {
  if (target && value !== undefined) {
    target[property] = value;
  }
}


export function blockContextMenu() {
  // Blocks the context menu from popping up
  window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  // Blocks combo keys in the browser from pulling up the context menu
  window.onkeydown = function (e) {
    // disable F12 key
    if(e.code == "F12") { //123) {
        return false;
    }

    // disable I key
    if(((e.ctrlKey && e.shiftKey) || (e.altKey)) && e.code == "KeyI") { //keyCode == 73){
        return false;
    }

    // disable J key
    if(((e.ctrlKey && e.shiftKey) || (e.altKey)) && e.code == "KeyJ") { //keyCode == 74) {
        return false;
    }

    // disable U key
    if((e.ctrlKey || e.altKey) && e.code == "KeyU") { //keyCode == 85) {
        return false;
    }
  }    
}

export function blockWindowResize(width: number, height: number) {
  window.addEventListener("resize", function () {
    window.resizeTo(width, height);
  });
}


export function extractFQDN(url: string) {
  if (!url) return undefined;
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
}


export function checkUpgrade() {
  try {      
    const yakklVersion = get(yakklVersionStore);
    if (yakklVersion) {
      const key = yakklVersion.substring(DEFAULT_UPGRADE_LABEL.length).trim().toUpperCase();
      if (key) { 
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}


// Move these
// TODO: May want to cycle through Networks and Network.types - Don't forget to add Polygon and others here!!
/**
 * @param {number} chainId
 */
export function getNetworkInfo(chainId: number) {
  let blockchain;
  let type;
  let explorer;

  switch(chainId) { //chainIdToHex(chainId)) {
    // case "0x5":
    // case "0x05":
    // case 5:
    //   blockchain = 'Ethereum';
    //   type = 'Goerli';
    //   explorer = 'https://goerli.etherscan.io';
    //   break;
    // case "0xaa36a7":
    case 1301:
      blockchain = 'Unichain';
      type = 'Testnet';
      explorer = 'https://sepolia.uniscan.xyz/';
      break;
    case 11155111:
      blockchain = 'Ethereum';
      type = 'Sepolia';
      explorer = 'https://sepolia.etherscan.io';
      break;
    // case "0x1":
    // case "0x01":
    case 1:
    default:
        blockchain = 'Ethereum';
        type = 'Mainnet';
        explorer = 'https://etherscan.io';
        break;
    }

  return {blockchain, type, explorer};
}


// TODO: May want to cycle through Networks and Network.types - Don't forget to add Polygon and others here!!
export function getChainId(type: string) {
  let chainId=1;

  switch(type.toLowerCase()) {
    case 'mainnet':
      chainId = 1;
      break;
    case 'sepolia':
      chainId = 11155111;
      break;
  }

  return chainId;
}


// Not using now...
// export async function getCreateProviders(key: string) {
//   try {  
//     const yakklProviders = [];
//     const yakklProv = [];

//     const jsonURL = browser_ext.runtime.getURL('providers.json');

//     fetch(jsonURL)
//       .then((response) => response.json())
//       .then(async (json) => {
//         for (const provider of  json) {
//           if (provider) {
//             yakklProv.push(provider);
//             await encryptData(provider.data, key).then(result => {
//               provider.data = result;
//             });
//             yakklProviders.push(provider);
//           }
//         }

//         await setYakklProvidersStorage(yakklProviders);
//         yakklProvidersStore.set(yakklProv);
//       });
//   } catch (e) {
//     console.log(e);
//   }
// }


export async function createHash(val: string) {
  return await crypto.subtle
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .digest('SHA-256', new TextEncoder('utf-8').encode(val))
    .then(h => {
      const hexes = [],
        view = new DataView(h);
      for (let i = 0; i < view.byteLength; i += 4)
        hexes.push(('00000000' + view.getUint32(i).toString(16)).slice(-8));
      
      return hexes.join('');
    });
}


// Ideal for JSON Serialization and Deserialization that handles BigInt. If more complex objects need cloning then use a library like lodash (cloneDeep) or rfdc
// Do not use this for objects that have functions or circular references.
// Do not use this on boolean - it will return null.
export function deepCopy<T>(obj: T) {
  if (!obj) return null;
  return JSON.parse(encodeJSON(obj));

  // We can remove the above line and uncomment below when needed. Also import { cloneDeep } from 'lodash'; OR import cloneDeep from 'lodash/cloneDeep';
  // if (isJSONSerializable(obj)) {
  //   return JSON.parse(encodeJSON(obj)) as T;
  // } else {
  //   return cloneDeep(obj);
  // }  
}



export function formatValue(blockchain: string, value: any): string {
  if (blockchain.toLowerCase() === 'ethereum') {
    return formatEther(value);
  }

  // Maybe use a switch statement later when the other blockchains are added
  return value; // fallback to 
}


export function formatEther(wei: BigNumberish): string {
  if (wei) {
    return Utils.formatEther(wei as bigint | string);
  } else {
    return '0.0';
  }
}


// Convert to wei
export function parseUnits(value: string, type: BigNumberishLegacy): BigNumberish {    
  return Utils.parseUnits(value, type).toBigInt(); // May want to use ethers v6.x instead of Alchemy's ethers v5.x. BN.js is no longer used in ethers v6.x
}

export function parseEther(ether: string): BigNumberish {
  return parseUnits(ether, 18);
}

// Convert from wei
/**
 * @param {import("alchemy-sdk").BigNumberish} value
 * @param {import("alchemy-sdk").BigNumberish} type
 */
export function formatUnits(value: BigNumberish, type: BigNumberish) {
  return Utils.formatUnits(value as bigint | string, type as bigint | string);  // TODO: Watch this
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSymbol(blockchain: string): string {
  let symbol = '';

  try {
    symbol = 'ETH'; // TODO: Need to go through Networks and Network.types and merge with how we are now doing abstract blockchains!
  //   const networks = get(yakklNetworksStore);
  //   for (const network of networks) {
  //     if (network.name.toLowerCase() === blockchain.toLowerCase()) {
  //         symbol = network.symbol;
  //         break;
  //     }  
  //  }
  } catch(e) {
    console.log(e);
  }

  return symbol;
}


// Return the currency symbol based on the locale and currency code
export const getCurrencySymbol = (locale: string, currency: any) => (0).toLocaleString(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();




export function truncate(val: string, len=20, suffix='...'){    
    if (val.length > len) {
        return (val.substring(0, len) + suffix);
    }
    return val;
}


// Returns an array of words
export function splitWords(str: string, delimiter = ' '): string[] {
  return str.split(delimiter);
}


// Opens a tab in the browser
export function handleOpenInTab(url: string): void {
  if (browserSvelte) {
    browser_ext.tabs.create({url: url});
  }
}



export async function isOnline(url=window.location.origin) {
  let value = false;

  try {
    if (!window.navigator.onLine) return value;

    // Check to verify first
    const response = await fetch(
      url,
      { method: 'HEAD' },
    )

    value = response.ok;
  } catch (e) {
    console.log(e);
    value = false;
  } 

  return value;
}


export function changeBackground(id: string, image: { src: string; }) {
  try {
    // document.getElementById().innerHTML="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.getElementById(id).style.backgroundImage="url('"+image.src+"')";
    // document.getElementById('display').style.backgroundSize="cover";
    // document.getElementById('display').style.backgroundPosition="center center";
  } catch (e) {
    console.log(e);
  }
}


export function timeoutClipboard(seconds: number) {
  try {
    if (browserSvelte) {
      const timeoutID = setTimeout(() => {
        ClipboardJS.copy('<redacted>');
        clearTimeout(timeoutID);
      }, seconds*1000);
    }
  } catch (e) {
    console.log(e);
  }
}


export async function setIconLock() {
  try {  
    if (browserSvelte) {
      await browser_ext.action.setIcon({path: {16: "/images/logoBullLock16x16.png", 32: "/images/logoBullLock32x32.png", 48: "/images/logoBullLock48x48.png", 128: "/images/logoBullLock128x128.png"}});
    }
  } catch (e) {
    console.log(e);
  }
}


export async function setIconUnlock() {
  try {
    if (browserSvelte) {
      await browser_ext.action.setIcon({path: {16: "/images/logoBull16x16.png", 32: "/images/logoBull32x32.png", 48: "/images/logoBull48x48.png", 128: "/images/logoBull128x128.png"}});
    }  
  } catch (e) {
    console.log(e);
  }
}


export function getPlatform() {
  const { navigator } = window;
  const { userAgent } = navigator;

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


export function getCurrencyCode(locale: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const countryCode = getCountryCode(locale).toUpperCase();
    if (countryCode in map) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return map[countryCode];
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}


// Not exported
const getCountryCode = function(localeString: string) {
  try {
    let components = localeString.split("_");
    if (components.length == 2) {
        return components.pop();
    }
    components = localeString.split("-");
    if (components.length == 2) {
        return components.pop();
    }
    return localeString;
  } catch (e) {
    console.log(e);
    return null;
  }
}


// TODO: hex.substr... is deprecated
export function hexToString(str1: string, Ox = true)
{
  try {
    const hex  = Ox ? str1.toString().slice(2) : str1.toString(); // If 0x prefix then remove it 
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  } catch (e) {
    console.log(e);
    return null;
  }
}


export function hexToBigInt(str1: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return BigInt(hexToString(str1));
  } catch (e) {
    console.log(e);
    return null;
  }
}


export function autoscroll(node: HTMLElement) {
  function scrollToBottom() {
    node.scrollTop = node.scrollHeight;
  }

  const observer = new MutationObserver(scrollToBottom);

  observer.observe(node, { childList: true });

  return {
    destroy() {
      observer.disconnect();
    },
  };
}

/**
 * Returns an Error if extension.runtime.lastError is present
 * this is a workaround for the non-standard error object that's used
 *
 * @returns {Error|undefined}
 */
export function checkForError(): Error | undefined {
  if (browserSvelte) {
    const { lastError } = browser_ext.runtime;
    if (!lastError) {
      return undefined;
    }
    // if it quacks like an Error, its an Error
    // if (lastError && lastError.message) {
    //   return new Error(lastError.message);
    // }
    // repair incomplete error object (eg chromium v77)
    return new Error(lastError.message);
  } else {
    return undefined;
  }
}

// export const isLocalhost = Boolean(
//   window.location.hostname === 'localhost' ||
//     // [::1] is the IPv6 localhost address.
//     window.location.hostname === '[::1]' ||
//     // 127.0.0.1/8 is considered localhost for IPv4.
//     window.location.hostname.match(
//       /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
//     )
// )

// exports.getLocales = function(currencyCode) {
//   currencyCode = currencyCode.toUpperCase();
//   var locales = [];
//   for (var countryCode in map) {
//       if (map[countryCode] === currencyCode) {
//           locales.push(countryCode);
//       }
//   }
//   return locales;
// }


// try/catch
// async function GetImageData(imagePath) {
//     let response = await fetch(chrome.runtime.getURL(imagePath));
//     let blob = await response.blob();
//     let imageBitmap = await createImageBitmap(blob);
//     let osc = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
//     let ctx = osc.getContext('2d');
//     ctx.drawImage(imageBitmap, 0, 0);

//     return ctx.getImageData(0, 0, osc.width, osc.height);
// }

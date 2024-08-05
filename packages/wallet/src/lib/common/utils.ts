/* eslint-disable no-debugger */
// // import browser from 'webextension-polyfill';
import type { ErrorBody, ParsedError } from '$lib/common';
// import { Utils } from "alchemy-sdk";


/**
 * <p transition:typewriter>
		The quick brown fox jumps over the lazy dog
	</p>
 */

interface TypewriterOptions {
  speed?: number;
}
  
export function typewriter(node: HTMLElement, { speed = 1 }: TypewriterOptions) {
  if (node.childNodes.length !== 1 || node.childNodes[0].nodeType !== Node.TEXT_NODE) {
    throw new Error(`This transition only works on elements with a single text node child`);
  }

  const text = node.textContent ?? '';
  const duration = text.length / (speed * 0.01);

  return {
    duration,
    tick: (t: number) => {
      const i = Math.trunc(text.length * t);
      node.textContent = text.slice(0, i);
    }
  };
}

// TODO: Add more blockchain support here
export function supportedChainId(chainId: number) {
  switch (chainId) {
    case 1:
    case 5:
    case 11155111:
      return true;
    default:
      break;
  }
  return false;
}


// export function stringToHex(inputString: string) {
//   let hexString = '';
//   const encodedString = encodeURI(inputString);
  
//   for (let i = 0; i < encodedString.length; i++) {
//       hexString += encodedString.charCodeAt(i).toString(16);
//   }
  
//   return '0x' + hexString;
// }


// export function isHex(value: string) {
//   if (typeof value === "string" && value.startsWith("0x")) {
//     return true;
//   }
//   return false;
// }


// export function toHex(value: string) {
//   if (isHex(value)) {
//     return value;
//   }
//   if (typeof value === "string") {
//     return `0x${value.toString(16)}`; // May want to look at BigInt instead of assuming Number
//   } else {
//     chainIdToHex(value);
//   }
// }

// function isHex(value: string): boolean {
//   // Example implementation of isHex
//   return /^0x[0-9a-fA-F]+$/.test(value);
// }

// export function toHex(value: string | number): string {
//   if (typeof value === 'string' && isHex(value)) {
//     return value;
//   } 
//   if (typeof value === 'number') {
//     return `0x${value.toString(16)}`;
//   }
  
//   // If the input value is neither a hex string nor a number,
//   // you may want to handle this case appropriately. For now, throwing an error.
//   throw new Error('Invalid input: expected a hex string or a number.');
// }

// May remove these 'chain...' functions
// export function chainIdToHex(value: string) {
//   if (isHex(value)) {
//     return value;
//   }
//   return Utils.hexlify(Number(value));  // MUST be a number
// }

// export function chainIdHexToNumber(value: string) {
//   if (typeof value === "number") {
//     return value;
//   }
//   return parseInt(value, 16);
// }


// export function decimalToHex(decimal: string | number): string {
//   const num = typeof decimal === 'string' ? parseInt(decimal, 10) : decimal;
//   if (isNaN(num)) {
//     throw new Error('Invalid decimal value');
//   }
//   return num.toString(16);
// }

// export function hexToDecimal(hexValue: string): string {
//   const num = parseInt(hexValue, 16);
//   if (isNaN(num)) {
//     throw new Error('Invalid hexadecimal value');
//   }
//   return num.toString(10);
// }


// chainId is a number and returns a hex string
export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}


export const gweiToWeiHex = (gwei: number) => {
  return `0x${(gwei * 1e9).toString(16)}`;
}


export const wait = (time: number | undefined) =>
  new Promise(resolve => setTimeout(resolve, time));


export function parseErrorMessageFromJSON(errorMessage: string): ParsedError {
  try {
    const parsedError: ErrorBody = JSON.parse(errorMessage);
    
    if (parsedError.body) {
      const body: ErrorBody = JSON.parse(parsedError.body);
      return body.error ?? null;
    }
    
    if (parsedError.reason) {
      return parsedError.reason;
    }
    
    return parsedError;
  } catch (error) {
    console.log('Failed to parse errorMessage, body or error:', error);
  }
  
  return null;
}
// Used for the 'data' field in the transaction
export function getLengthInBytes(value: string): number {
  if (typeof value === "string" && value !== "0x") {
    if (value.startsWith("0x"))
      return Math.round(value.length / 2);
    return value.length;
  }
  return 0;
}


/* eslint-disable no-debugger */
// // import browser from 'webextension-polyfill';
import type { ErrorBody, ParsedError } from '$lib/common';
// import { Utils } from "alchemy-sdk";

import { AccountTypeCategory } from '$lib/common/types';
import type { YakklAccount } from '$lib/common/interfaces';
import { getYakklAccounts } from '$lib/common/stores';

export async function checkAccountRegistration(): Promise<boolean> {
  try {
    const accounts: YakklAccount[] = await getYakklAccounts();

    if (!accounts || accounts.length === 0) {
      return false;
    }

    const hasPrimaryOrImported = accounts.some(account => 
      account.accountType === AccountTypeCategory.PRIMARY || 
      account.accountType === AccountTypeCategory.IMPORTED
    );

    return hasPrimaryOrImported;
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
}

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



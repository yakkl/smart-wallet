/* eslint-disable no-debugger */
// // import browser from 'webextension-polyfill';
import type { ErrorBody, ParsedError } from '$lib/common';
// import { Utils } from "alchemy-sdk";

import { AccountTypeCategory } from '$lib/common/types';
import type { YakklAccount } from '$lib/common/interfaces';
import { getYakklAccounts } from '$lib/common/stores';
import { ethers } from 'ethers';

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

export function parseAmount( amount: string, decimals: number ): bigint {
  // Normalize input
  const normalizedAmount = amount.startsWith( '.' ) ? `0${ amount }` : amount;

  try {
    // Use a more robust parsing method
    const [ integerPart, fractionalPart = '' ] = normalizedAmount.split( '.' );

    // Truncate or pad fractional part
    const truncatedFractional = fractionalPart.slice( 0, decimals ).padEnd( decimals, '0' );

    // Combine parts
    const fullAmount = `${ integerPart }${ truncatedFractional }`;

    return BigInt( fullAmount );
  } catch ( error ) {
    console.error( 'Failed to parse amount:', error );
    return 0n;
  }
}

// export function parseAmount( amount: string, decimals: number ): bigint {
//   // Handle empty or invalid inputs
//   if ( !amount || amount === '.' || amount.trim() === '' ) {
//     return 0n;
//   }

//   // Sanitize input
//   const sanitizedAmount = amount.replace( /[^0-9.]/g, '' );

//   // Ensure only one decimal point
//   const parts = sanitizedAmount.split( '.' );
//   if ( parts.length > 2 ) {
//     throw new Error( 'Invalid number format' );
//   }

//   // Split into integer and decimal parts
//   const [ integerPart = '0', decimalPart = '' ] = parts;

//   // Pad or truncate decimal part
//   const paddedDecimal = ( decimalPart + '0'.repeat( decimals ) ).slice( 0, decimals );

//   // Combine parts, ensuring non-empty integer part
//   const fullAmountString = `${ integerPart || '0' }${ paddedDecimal ? '.' + paddedDecimal : '' }`;

//   // Validate the parsed amount
//   try {
//     // Use parseUnits directly
//     return ethers.parseUnits( fullAmountString, decimals );
//   } catch ( error ) {
//     console.error( 'Error parsing amount:', error, 'Input:', fullAmountString );
//     return 0n;
//   }
// }

// Alternative approach using Number and BigInt conversion
export function parseAmountAlternative( amount: string, decimals: number ): bigint {
  // Handle empty or invalid inputs
  if ( !amount || amount === '.' || amount.trim() === '' ) {
    return 0n;
  }

  try {
    // Convert to number first to handle scientific notation and precision
    const numericValue = Number( amount );

    // Multiply by 10^decimals and convert to bigint
    return BigInt( Math.round( numericValue * ( 10 ** decimals ) ) );
  } catch ( error ) {
    console.error( 'Error parsing amount:', error );
    return 0n;
  }
}

// Optional: Format amount back to a string with proper decimal handling
export function formatAmount( amount: bigint, decimals: number ): string {
  const formattedAmount = ethers.formatUnits( amount, decimals );

  // Remove trailing zeros after decimal point
  const [ integerPart, decimalPart ] = formattedAmount.split( '.' );
  if ( !decimalPart ) return integerPart;

  const trimmedDecimal = decimalPart.replace( /0+$/, '' );
  return trimmedDecimal ? `${ integerPart }.${ trimmedDecimal }` : integerPart;
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



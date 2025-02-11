/* eslint-disable no-debugger */
import { type ErrorBody, type ParsedError } from '$lib/common';
import { AccountTypeCategory } from '$lib/common/types';
import type { YakklAccount } from '$lib/common/interfaces';
import { yakklAccountsStore } from '$lib/common/stores';
import { ethers as ethersv6 } from 'ethers-v6';
import { get } from 'svelte/store';


// This should represent the .id property of given objects for uniqueness
export function getUserId(): string {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = crypto.randomUUID(); //  `${string}-${string}-${string}-${string}-${string}` format of very random string
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
}

export async function checkAccountRegistration(): Promise<boolean> {
  try {
    const accounts: YakklAccount[] = get(yakklAccountsStore);

    if (!accounts || accounts.length === 0) {
      return false;
    }

    const hasPrimaryOrImported = accounts.some(account =>
      account.accountType === AccountTypeCategory.PRIMARY ||
      account.accountType === AccountTypeCategory.IMPORTED
    );

    return hasPrimaryOrImported;
  } catch (error) {
    console.log('Error checking registration:', error);
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
    console.log( 'Failed to parse amount:', error );
    return 0n;
  }
}

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
    console.log( 'Error parsing amount:', error );
    return 0n;
  }
}

// Format USD amounts to 2 decimal places
export function formatUsd(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format token amounts based on decimals
export function formatAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0';
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function convertUsdToTokenAmount(usdAmount: number, marketPrice: number, decimals: number): string {
  if (marketPrice <= 0) return '0';
  const tokenAmount = usdAmount / marketPrice;
  return ethersv6.formatUnits(ethersv6.parseUnits(tokenAmount.toFixed(decimals), decimals), decimals);
}

export function convertTokenToUsd(tokenAmount: number, marketPrice: number): number {
  if (marketPrice <= 0) return 0;
  return tokenAmount * marketPrice;
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

// TODO: Add more blockchain support here - Audit functions and classes and remove any duplicates (this could be one)
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



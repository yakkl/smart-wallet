/* eslint-disable @typescript-eslint/no-explicit-any */
import { type BigNumberish, type TransactionRequest, type TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import { Signer } from './Signer';
// import type { Signer } from '$plugins/Signer';
// import { ethers as ethersv6 } from 'ethers-v6';

export abstract class AbstractContract {
  protected address: string;
  protected abi: readonly any[];
  protected provider: Provider | null;
  abstract interface: any; // Add this to support interface operations

  // Added providerNative to the constructor - may need to be removed
  constructor ( address: string, abi: any[], provider: Provider ) {
    if ( !address || !abi || !provider ) throw new Error( "Invalid parameters" );

    this.address = address;
    this.abi = abi;

    // if (this.isSigner(provider)) {
    //   this.signer = provider;
    //   this.provider = provider.provider;
    // } else {
    this.provider = provider;
    // Note: We're not setting this.signer here as it's not available from a Provider
    // }
  }

  private isSigner( value: Provider | Signer ): value is Signer {
    if ( !value ) return false;
    return 'signMessage' in value && typeof value.signMessage === 'function';
  }

  abstract call( functionName: string, ...args: any[] ): Promise<any>;
  abstract estimateGas( functionName: string, ...args: any[] ): Promise<BigNumberish>;
  abstract populateTransaction( functionName: string, ...args: any[] ): Promise<TransactionRequest | null>;
  abstract sendTransaction( functionName: string, ...args: any[] ): Promise<TransactionResponse>;
  abstract encodeFunctionData( functionName: string, args?: any[] ): string;
  abstract on( eventName: string, listener: ( ...args: any[] ) => void ): void;
  abstract off( eventName: string, listener: ( ...args: any[] ) => void ): void;
  abstract once( eventName: string, listener: ( ...args: any[] ) => void ): void;
  abstract getFunctions(): Record<string, ( ...args: any[] ) => Promise<any>>;
  abstract getEvents(): string[];
}

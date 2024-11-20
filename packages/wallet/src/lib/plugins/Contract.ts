/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';

export abstract class AbstractContract {
  readonly address: string;
  readonly abi: readonly any[];
  protected provider: Provider | null;
  protected signer?: Signer;
  abstract interface: any; // Add this to support interface operations

  constructor ( address: string, abi: any[], providerOrSigner: Provider | Signer ) {
    if ( !address || !abi || !providerOrSigner ) throw new Error("Invalid parameters");
    
    this.address = address;
    this.abi = abi;

    if (this.isSigner(providerOrSigner)) {
      this.signer = providerOrSigner;
      this.provider = providerOrSigner.provider;
    } else {
      this.provider = providerOrSigner;
      // Note: We're not setting this.signer here as it's not available from a Provider
    }
  }

  private isSigner( value: Provider | Signer ): value is Signer {
    if (!value) return false;
    return 'signMessage' in value && typeof value.signMessage === 'function';
  }

  abstract call(functionName: string, ...args: any[]): Promise<any>;
  abstract estimateGas(functionName: string, ...args: any[]): Promise<BigNumberish>;
  abstract populateTransaction(functionName: string, ...args: any[]): Promise<TransactionRequest | null>;
  abstract sendTransaction( functionName: string, ...args: any[] ): Promise<TransactionResponse>;
  abstract encodeFunctionData( functionName: string, args?: any[] ): string;
  abstract on(eventName: string, listener: (...args: any[]) => void): void;
  abstract off(eventName: string, listener: (...args: any[]) => void): void;
  abstract once(eventName: string, listener: (...args: any[]) => void): void;
  abstract getFunctions(): Record<string, (...args: any[]) => Promise<any>>;
  abstract getEvents(): string[];
}

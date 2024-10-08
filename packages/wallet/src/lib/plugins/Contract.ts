/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';

export abstract class AbstractContract {
  readonly address: string;
  readonly abi: readonly any[];
  protected provider: Provider | null;
  protected signer?: Signer;

  constructor(address: string, abi: any[], providerOrSigner: Provider | Signer) {
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

  private isSigner(value: Provider | Signer): value is Signer {
    return 'signMessage' in value && typeof value.signMessage === 'function';
  }

  abstract call(functionName: string, ...args: any[]): Promise<any>;
  abstract estimateGas(functionName: string, ...args: any[]): Promise<BigNumberish>;
  abstract populateTransaction(functionName: string, ...args: any[]): Promise<TransactionRequest>;
  abstract sendTransaction(functionName: string, ...args: any[]): Promise<TransactionResponse>;
  abstract on(eventName: string, listener: (...args: any[]) => void): void;
  abstract off(eventName: string, listener: (...args: any[]) => void): void;
  abstract once(eventName: string, listener: (...args: any[]) => void): void;

  abstract getFunctions(): Record<string, (...args: any[]) => Promise<any>>;
  // In AbstractContract class
  // getFunctions(): ContractFunction[] {
  //   const functions: ContractFunction[] = [];
  //   for (const functionName in this.contract.functions) {
  //     const functionFragment = this.contract.interface.getFunction(functionName);
  //     functions.push({
  //       name: functionName,
  //       inputs: functionFragment.inputs.map(input => ({
  //         name: input.name,
  //         type: input.type,
  //       })),
  //       stateMutability: functionFragment.stateMutability,
  //     });
  //   }
  //   return functions;
  // }
  
  abstract getEvents(): string[];
}

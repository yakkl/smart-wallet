/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/contracts/AbstractContract.ts
import type { BigNumberish, TransactionRequest } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';

export abstract class AbstractContract {
  abstract readonly address: string;
  abstract readonly abi: readonly any[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(address: string, abi: any[], signerOrProvider: Provider | Signer) {}

  abstract call(functionName: string, ...args: any[]): Promise<any>;
  abstract estimateGas(functionName: string, ...args: any[]): Promise<BigNumberish>;
  abstract populateTransaction(functionName: string, ...args: any[]): Promise<TransactionRequest>;

  abstract getFunctions(): Record<string, (...args: any[]) => Promise<any>>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Signer.ts
import type { TransactionRequest, TransactionResponse, TypedDataDomain, TypedDataField } from '$lib/common';
import type { Provider } from '$plugins/Provider';

export interface SignerInterface {
  provider: Provider | null;
  signTransaction(transaction: TransactionRequest): Promise<string>;
  signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
  signMessage(message: string): Promise<string>;
  getAddress(): Promise<string>;
  getSigner(): any | null; // Returns the native signer object
  setSigner(provider: Provider): void; // Sets the signer object
  sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}

export abstract class Signer implements SignerInterface {
  abstract provider: Provider | null;
  abstract signTransaction(transaction: TransactionRequest): Promise<string>;
  abstract signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
  abstract signMessage(message: string): Promise<string>;
  abstract getAddress(): Promise<string>;
  abstract getSigner(): any | null;
  abstract setSigner(provider: Provider): void;
  abstract sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}

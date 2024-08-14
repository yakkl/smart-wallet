/* eslint-disable @typescript-eslint/no-explicit-any */
// Signer.ts
import type { TransactionRequest, TransactionResponse, TypedDataDomain, TypedDataField } from '$lib/common';

export interface SignerInterface {
  signTransaction(transaction: TransactionRequest): Promise<string>;
  signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
  signMessage(message: string): Promise<string>;
  getAddress(): Promise<string>;
  sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}

export abstract class Signer implements SignerInterface {
  abstract signTransaction(transaction: TransactionRequest): Promise<string>;
  abstract signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
  abstract signMessage(message: string): Promise<string>;
  abstract getAddress(): Promise<string>;
  abstract sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}

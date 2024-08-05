/* eslint-disable @typescript-eslint/no-explicit-any */
// Signer.ts
import type { TransactionRequest, TypedDataDomain, TypedDataField } from '$lib/common';

/**
 * Abstract class representing a signer. Signers are responsible for signing transactions and messages.
 */
export abstract class Signer {
  /**
   * Signs a transaction request.
   * @param transaction - The transaction request to sign.
   * @returns A promise that resolves to the signed transaction as a string.
   */
  abstract signTransaction(transaction: TransactionRequest): Promise<string>;

  /**
   * Signs a typed data transaction request. It may not be implemented by all signers.
   * @param transaction - The transaction request to sign.
   * @returns A promise that resolves to the signed transaction as a string.
   */
  abstract signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns A promise that resolves to the signed message as a string.
   */
  abstract signMessage(message: string): Promise<string>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// EthereumSigner.ts
import { ethers } from 'ethers';
import type { EVMTransactionRequest, BigNumberish } from '$lib/common';
import { Signer } from '$plugins/Signer';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';


/**
 * EthereumSigner class extending the Signer class to provide specific implementations for Ethereum.
 */
export class EthereumSigner extends Signer {
  private wallet: ethers.Wallet;

  /**
   * Creates an instance of EthereumSigner.
   * @param privateKey - The private key for the wallet.
   * @throws Will throw an error if the private key is not provided.
   */
  constructor(privateKey: string | null) {
    super();
    if (!privateKey) {
      throw new Error('Private key not provided to signer');
    }
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    if (privateKey.length !== 66) {
      throw new Error(`Invalid private key length. Instead it is ${privateKey.length}`);
    }
    this.wallet = new ethers.Wallet(privateKey);

    console.log('ethers - Wallet created:', this.wallet);
  }

  /**
   * Converts custom BigNumberish to ethers.BigNumberish (as a hex string)
   */
  private toEthersHex(value: BigNumberish | null | undefined): string | null | undefined {
    if (value instanceof EthereumBigNumber) {
      return value.toHex();
    }
    if (typeof value === 'bigint') {
      return '0x' + value.toString(16);
    }
    if (typeof value === 'number') {
      return '0x' + BigInt(value).toString(16);
    }
    if (typeof value === 'string') {
      // Assuming the string is already in a hex format if not, you might want to parse it
      return value;
    }
    return value as string | null | undefined;
  }

  /**
   * Signs a transaction request.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction as a string.
   */
  async signTransaction(transaction: EVMTransactionRequest): Promise<string> {

    console.log('Transaction to sign:', transaction);

    const tx: ethers.TransactionRequest = {
      to: transaction.to ?? undefined,
      from: transaction.from ?? undefined,
      nonce: transaction.nonce === -1 ? undefined : transaction.nonce,
      gasLimit: this.toEthersHex(transaction.gasLimit),
      gasPrice: this.toEthersHex(transaction.gasPrice),
      maxPriorityFeePerGas: this.toEthersHex(transaction.maxPriorityFeePerGas),
      maxFeePerGas: this.toEthersHex(transaction.maxFeePerGas),
      data: transaction.data?.toString() ?? undefined,
      value: this.toEthersHex(transaction.value),
      chainId: this.toEthersHex(transaction.chainId) ?? undefined,
      accessList: transaction.accessList ?? undefined,
      customData: transaction.customData,
      enableCcipRead: transaction.ccipReadEnabled,
      blobVersionedHashes: transaction.blobVersionedHashes ?? undefined,
      maxFeePerBlobGas: this.toEthersHex(transaction.maxFeePerBlobGas),
      blobs: transaction.blobs ?? undefined,
      kzg: transaction.kzg ?? undefined,
    };

    console.log('Signing transaction:', tx);

    return await this.wallet.signTransaction(tx);
  }

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns The signed message as a string.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    return await this.wallet.signMessage(message);
  }

  /**
   * Signs typed data.
   * @param domain - The domain for the typed data.
   * @param types - The types for the typed data.
   * @param value - The value of the typed data.
   * @returns The signed typed data as a string.
   */
  async signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string> {
    return await this.wallet.signTypedData(domain, types, value);
  }

  /**
   * Verifies the signer of a message.
   * @param signerAddress - The address of the signer.
   * @param messageToVerify - The message to verify.
   * @param signature - The signature to verify.
   * @returns Whether the signer is verified.
   */
  async verifySigner(signerAddress: string, messageToVerify: string, signature: string): Promise<boolean> {
    try {
      const value = ethers.recoverAddress(ethers.hashMessage(messageToVerify), signature) === signerAddress;
      return Promise.resolve(value);
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }
}

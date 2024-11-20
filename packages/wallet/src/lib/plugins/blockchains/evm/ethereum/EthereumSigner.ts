/* eslint-disable @typescript-eslint/no-explicit-any */
// EthereumSigner.ts
import { ethers } from 'ethers';
import type { EVMTransactionRequest, BigNumberish, TransactionRequest, TransactionResponse, TransactionReceipt, Log } from '$lib/common';
import { Signer } from '$plugins/Signer';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import type { Provider } from '$lib/plugins/Provider';


/**
 * EthereumSigner class extending the Signer class to provide specific implementations for Ethereum.
 */
export class EthereumSigner extends Signer {
  private wallet: ethers.Wallet;
  public readonly provider: Provider | null;

  /**
   * Creates an instance of EthereumSigner.
   * @param privateKey - The private key for the wallet.
   * @param provider - The provider for the signer.
   * @throws Will throw an error if the private key is not provided.
   */
  constructor(privateKey: string | null, provider: Provider | null) {
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
    this.provider = provider;
    this.wallet = new ethers.Wallet(privateKey, provider as any);  
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
    const tx = this.transactionToEthersTransaction(transaction);
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

  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    const tx = await this.wallet.sendTransaction(this.transactionToEthersTransaction(transaction));
    return this.ethersTransactionResponseToTransactionResponse(tx);
  }

  private transactionToEthersTransaction(transaction: EVMTransactionRequest): ethers.TransactionRequest {
    return {
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
  }

  private async ethersTransactionResponseToTransactionResponse(tx: ethers.TransactionResponse): Promise<TransactionResponse> {
    return {
      hash: tx.hash,
      to: tx.to ?? '',
      from: tx.from,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      data: tx.data,
      value: tx.value,
      chainId: tx.chainId,
      blockNumber: tx.blockNumber ?? undefined,
      blockHash: tx.blockHash ?? undefined,
      timestamp: new Date().getTime(), // ethers v6 doesn't have this property
      confirmations: await tx.confirmations(),
      raw: undefined, // ethers v6 doesn't have this property
      type: tx.type ?? undefined,
      accessList: tx.accessList ?? undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      maxFeePerGas: tx.maxFeePerGas,
      wait: async (confirmations?: number): Promise<TransactionReceipt> => {
        const receipt = await tx.wait(confirmations);
        if (!receipt) {
          throw new Error('Transaction receipt is null');
        }
        return this.ethersTransactionReceiptToTransactionReceipt(receipt);
      }
    };
  }
  
  private async ethersTransactionReceiptToTransactionReceipt(receipt: ethers.TransactionReceipt): Promise<TransactionReceipt> {
    return {
      to: receipt.to ?? '',
      from: receipt.from,
      contractAddress: receipt.contractAddress ?? undefined,
      transactionIndex: receipt.index,
      root: receipt.root ?? undefined,
      gasUsed: receipt.gasUsed,
      logsBloom: receipt.logsBloom,
      blockHash: receipt.blockHash,
      transactionHash: receipt.hash,
      logs: receipt.logs.map((log): Log => ({
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        transactionIndex: log.transactionIndex,
        removed: log.removed,
        address: log.address,
        data: log.data,
        topics: [...log.topics], // Create a new mutable array from the readonly one
        transactionHash: log.transactionHash,
        logIndex: log.index
      })),
      blockNumber: receipt.blockNumber,
      confirmations: await receipt.confirmations(), // This is now a number in ethers v6
      cumulativeGasUsed: receipt.cumulativeGasUsed,
      effectiveGasPrice: receipt.gasPrice ?? undefined,
      byzantium: true, // Assuming all transactions are post-Byzantium
      type: receipt.type,
      status: receipt.status ? receipt.status : undefined
    };
  }
}

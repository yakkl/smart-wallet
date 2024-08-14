/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BigNumber, resolveProperties, type BigNumberish, type Block, type BlockTag, type BlockWithTransactions, type Deferrable, type EventType, type FeeData, type Filter, type Listener, type Log, type TransactionReceipt, type TransactionRequest, type TransactionResponse, type TypedDataDomain, type TypedDataField } from '$lib/common';
import type { Signer } from '$plugins/Signer';

// async function resolveProperties<T>(props: T): Promise<T> {
//   const resolved: any = {};
//   for (const key in props) {
//     resolved[key] = await props[key];
//   }
//   return resolved;
// }

export function assertProvider(provider: Provider | null): asserts provider is Provider {
  if (provider === null) {
    throw new Error('Provider is null');
  }
}

// Usage:
// const provider = wallet.getProvider();
// assertProvider(provider);
// Now TypeScript knows that provider is not null so you make calls without casting everywhere


// Note: Some of the parameters below can also be Promise<whatever> types. This will allow the async part to be handled in the implementation of the method and not by the caller.

/**
 * Interface for blockchain providers.
 */
export interface Provider {
  /** Name of the provider */
  name: string;
  /** List of blockchains supported by this provider */
  blockchains: string[];
  /** Current blockchain */
  blockchain: string;
  chainIds: number[]; // supported chainIds
  /** Chain ID */
  chainId: number;
  /** Optional signer for the provider */
  signer: Signer | undefined;

  /**
   * Connects the provider to a specified blockchain and chain ID.
   * @param blockchain - The blockchain to connect to.
   * @param chainId - The chain ID to connect to.
   */
  connect(blockchain: string, chainId: number): Promise<void>;

  /**
   * Gets the current block number.
   * @returns The current block number.
   */
  getBlockNumber(): Promise<number>;

  getBlockchains(): string[];
  setBlockchains(blockchains: string[]): void;
  getBlockchain(): string;

  getChainIds(): number[];
  setChainIds(chainIds: number[]): void;
  getChainId(): number;
  setChainId(chainId: number): void;

  /**
   * Gets the current gas price.
   * @returns The current gas price.
   */
  getGasPrice(): Promise<bigint>;

  /**
   * Gets the fee data.
   * @returns The fee data.
   */
  getFeeData(): Promise<any>;

  /**
   * Gets the balance of an address.
   * @param addressOrName - The address or ENS name to get the balance for.
   * @param blockTag - Optional block tag.
   * @returns The balance of the address.
   */
  getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<bigint>;

  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - Optional block tag.
   * @returns The code at the address.
   */
  getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  /**
   * Gets the storage at a position.
   * @param addressOrName - The address or ENS name to get the storage for.
   * @param position - The storage position.
   * @param blockTag - Optional block tag.
   * @returns The storage at the position.
   */
  getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  getSigner(): Signer;

  setSigner(signer: Signer): void; // This one sets the signer for the provider after it has been created by the wallet and/or Signer 

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns The transaction response.
   */
  sendRawTransaction(signedTransaction: string): Promise<TransactionResponse>;

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns The transaction response.
   */
  sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  signTransaction(transaction: TransactionRequest): Promise<string>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns The signed message.
   */
  signMessage(message: string): Promise<string>;

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns The estimated gas.
   */
  estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint>;

  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns The block.
   */
  getBlock(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<Block>;

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns The block with transactions.
   */
  getBlockWithTransactions(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<BlockWithTransactions>;

  /**
   * Gets a transaction by its hash.
   * @param transactionHash - The transaction hash to get the transaction for.
   * @returns The transaction.
   */
  getTransaction(transactionHash: string): Promise<TransactionResponse>;

  /**
   * Gets the transaction count for an address.
   * @param addressOrName - The address or ENS name to get the transaction count for.
   * @param blockTag - Optional block tag.
   * @returns The transaction count.
   */
  getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;

  /**
   * Gets the transaction history for an address.
   * @param address - The address to get the transaction history for.
   * @returns The transaction history.
   */
  getTransactionHistory(address: string): Promise<any>;

  /**
   * Gets the transaction receipt by its hash.
   * @param transactionHash - The transaction hash to get the receipt for.
   * @returns The transaction receipt.
   */
  getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns The logs.
   */
  getLogs(filter: Filter): Promise<Array<Log>>;

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns The resolved address or null if not found.
   */
  resolveName(name: string | Promise<string>): Promise<null | string>;

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns The ENS name or null if not found.
   */
  lookupAddress(address: string | Promise<string>): Promise<null | string>;

  /**
   * Adds a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  on(eventName: EventType, listener: Listener): Provider;

  /**
   * Adds a one-time listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  once(eventName: EventType, listener: Listener): Provider;

  /**
   * Emits an event.
   * @param eventName - The name of the event.
   * @param args - The arguments to pass to the event listeners.
   * @returns Whether the event had listeners.
   */
  emit(eventName: EventType, ...args: Array<any>): boolean;

  /**
   * Gets the listener count for an event.
   * @param eventName - The name of the event.
   * @returns The listener count.
   */
  listenerCount(eventName?: EventType): number;

  /**
   * Gets the listeners for an event.
   * @param eventName - The name of the event.
   * @returns The listeners.
   */
  listeners(eventName?: EventType): Array<Listener>;

  /**
   * Removes a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  off(eventName: EventType, listener?: Listener): Provider;

  /**
   * Removes all listeners for an event.
   * @param eventName - The name of the event.
   * @returns The provider instance.
   */
  removeAllListeners(eventName?: EventType): Provider;

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  request<T>(method: string, params: any[]): Promise<any>;
}

/**
 * Abstract class representing a provider.
 */
export abstract class AbstractProvider implements Provider {
  /** List of blockchains supported by this provider */
  blockchains: string[] = [];
  /** Current blockchain (default is Ethereum) */
  blockchain: string = 'Ethereum';
  chainIds: number[] = [1, 11155111]; // supported chainIds
  /** Chain ID (default is Ethereum Mainnet) */
  chainId: number = 1;
  /** Name of the provider */
  name: string;
  /** Optional signer for the provider */
  signer: Signer | undefined = undefined; // This is the signer that will be set by the wallet and/or Signer

  /**
   * Creates an instance of AbstractProvider.
   * @param name - The name of the provider.
   */
  constructor(name: string, blockchains: string[], chainIds: number[], blockchain: string, chainId: number) {
    this.name = name;
    this.blockchains = blockchains;
    this.chainIds = chainIds;
    this.blockchain = blockchain;
    this.chainId = chainId;
  }

  // abstract createAccount(accountToDeriveFrom: string | null): Promise<string | null>;

  /**
   * Gets the current block number.
   * @returns The current block number.
   */
  abstract getBlockNumber(): Promise<number>;

  /**
   * Gets the current gas price.
   * @returns The current gas price.
   */
  abstract getGasPrice(): Promise<bigint>;

  /**
   * Gets the balance of an address.
   * @param addressOrName - The address or ENS name to get the balance for.
   * @param blockTag - Optional block tag.
   * @returns The balance of the address.
   */
  abstract getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<bigint>;

  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - Optional block tag.
   * @returns The code at the address.
   */
  abstract getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  /**
   * Gets the storage at a position.
   * @param addressOrName - The address or ENS name to get the storage for.
   * @param position - The storage position.
   * @param blockTag - Optional block tag.
   * @returns The storage at the position.
   */
  abstract getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  getSigner(): Signer {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return this.signer;
  }

  setSigner(signer: Signer): void {
    this.signer = signer; 
  }

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns The transaction response.
   */
  abstract sendRawTransaction(signedTransaction: string): Promise<TransactionResponse>;

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns The transaction response.
   */
  abstract sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.signTransaction(transaction);
  }

  /**
   * Signs a typed data transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  async signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.signTypedData(domain, types, value);
  }

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns The signed message.
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.signMessage(message);
  }

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  abstract call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns The estimated gas.
   */
  abstract estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint>;

  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns The block.
   */
  abstract getBlock(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<Block>;

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns The block with transactions.
   */
  abstract getBlockWithTransactions(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<BlockWithTransactions>;

  /**
   * Gets a transaction by its hash.
   * @param transactionHash - The transaction hash to get the transaction for.
   * @returns The transaction.
   */
  abstract getTransaction(transactionHash: string): Promise<TransactionResponse>;

  /**
   * Gets the transaction count for an address.
   * @param addressOrName - The address or ENS name to get the transaction count for.
   * @param blockTag - Optional block tag.
   * @returns The transaction count.
   */
  abstract getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;

  /**
   * Gets the transaction history for an address.
   * @param address - The address to get the transaction history for.
   * @returns The transaction history.
   */
  abstract getTransactionHistory(address: string): Promise<any>; // Only for Etherscan

  /**
   * Gets the transaction receipt by its hash.
   * @param transactionHash - The transaction hash to get the receipt for.
   * @returns The transaction receipt.
   */
  abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns The logs.
   */
  abstract getLogs(filter: Filter): Promise<Array<Log>>;

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns The resolved address or null if not found.
   */
  abstract resolveName(name: string | Promise<string>): Promise<null | string>;

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns The ENS name or null if not found.
   */
  abstract lookupAddress(address: string | Promise<string>): Promise<null | string>;

  /**
   * Adds a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  abstract on(eventName: EventType, listener: Listener): Provider;

  /**
   * Adds a one-time listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  abstract once(eventName: EventType, listener: Listener): Provider;

  /**
   * Emits an event.
   * @param eventName - The name of the event.
   * @param args - The arguments to pass to the event listeners.
   * @returns Whether the event had listeners.
   */
  abstract emit(eventName: EventType, ...args: Array<any>): boolean;

  /**
   * Gets the listener count for an event.
   * @param eventName - The name of the event.
   * @returns The listener count.
   */
  abstract listenerCount(eventName?: EventType): number;

  /**
   * Gets the listeners for an event.
   * @param eventName - The name of the event.
   * @returns The listeners.
   */
  abstract listeners(eventName?: EventType): Array<Listener>;

  /**
   * Removes a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  abstract off(eventName: EventType, listener?: Listener): Provider;

  /**
   * Removes all listeners for an event.
   * @param eventName - The name of the event.
   * @returns The provider instance.
   */
  abstract removeAllListeners(eventName?: EventType): Provider;

  /**
   * Connects the provider to a specified blockchain and chain ID.
   * @param blockchain - The blockchain to connect to.
   * @param chainId - The chain ID to connect to.
   */
  abstract connect(blockchain: string, chainId: number): Promise<void>;

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  abstract request(method: string, params: any[]): Promise<any>;

  /**
   * Gets the fee data.
   * @returns The fee data.
   */
  // async getFeeData(): Promise<FeeData> {
  //   const { block, gasPrice } = await resolveProperties({
  //     block: this.getBlock("latest"),
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     gasPrice: this.getGasPrice().catch((error) => {
  //       // @TODO: Why is this now failing on Calaveras?
  //       //console.log(error);
  //       return null;
  //     })
  //   });

  //   let lastBaseFeePerGas: bigint = 0n, maxFeePerGas: bigint = 0n, maxPriorityFeePerGas: bigint = 0n;

  //   if (block && block.baseFeePerGas) {
  //     // We may want to compute this more accurately in the future,
  //     // using the formula "check if the base fee is correct".
  //     // See: https://eips.ethereum.org/EIPS/eip-1559
  //     lastBaseFeePerGas = getBigInt(block.baseFeePerGas);
  //     maxPriorityFeePerGas = BigInt("1500000000");
  //     maxFeePerGas = block.baseFeePerGas.toBigInt() * 2n + maxPriorityFeePerGas;

      
  //   }

  //   return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
  // }

  async getFeeData(): Promise<FeeData> {
    const { block, gasprice } = await resolveProperties({
      block: this.getBlock("latest"),
      gasprice: this.getGasPrice().catch((error) => {
        return null;
      })
    });
  
    let lastBaseFeePerGas: bigint = 0n;
    let maxFeePerGas: bigint = 0n;
    let maxPriorityFeePerGas: bigint = 0n;
    const gasPrice: BigNumber = BigNumber.from(gasprice!);
  
    if (block && block.baseFeePerGas) {
      // Convert baseFeePerGas from BigNumber to bigint
      lastBaseFeePerGas = BigNumber.from(block.baseFeePerGas).toBigInt() as bigint;
      maxPriorityFeePerGas = 1500000000n; // Example value
      maxFeePerGas = lastBaseFeePerGas * 2n + maxPriorityFeePerGas;
    }
  
    return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
  }
  /**
   * Alias for `on` method.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  addListener(eventName: EventType, listener: Listener): Provider {
    return this.on(eventName, listener);
  }

  /**
   * Alias for `off` method.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  removeListener(eventName: EventType, listener: Listener): Provider {
    return this.off(eventName, listener);
  }

  /**
   * Gets the blockchains supported by this provider.
   * @returns The blockchains supported by this provider.
   */
  getBlockchains(): string[] {
    return this.blockchains;
  }

  /**
   * Sets the blockchains supported by this provider.
   * @param blockchains - The blockchains to set.
   */
  setBlockchains(blockchains: string[]): void { 
    this.blockchains = blockchains;
  }

  /**
   * Gets the blockchain supported by this provider.
   * @returns The blockchain supported by this provider.
   */
  getBlockchain(): string {
    return this.blockchain;
  }

  /**
   * Gets the chain IDs supported by this provider.
   * @returns The chain IDs supported by this provider.
   */
  getChainIds(): number[] {
    return this.chainIds;
  }
  
  /**
   * Sets the chain IDs supported by this provider.
   * @param chainIds - The chain IDs to set.
   */
  setChainIds(chainIds: number[]): void {
    this.chainIds = chainIds;
  }

  /**
   * Sets the chain ID supported by this provider.
   * @param chainId - The chain ID to set.
   */
  async setChainId(chainId: number): Promise<void> {
    this.chainId = chainId;
  }

  /**
   * Gets the chain ID supported by this provider.
   * @returns The chain ID supported by this provider.
   */
  getChainId(): number {
    return this.chainId;
  }
}

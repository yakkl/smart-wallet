/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { type BlockTag, type BigNumberish, type Deferrable, type Listener, type TransactionResponse, type TransactionRequest, type Block, type BlockWithTransactions, type TransactionReceipt, type Filter, type Log, type EventType, BigNumber } from '$lib/common';
import eventManager from '$plugins/EventManager';
import { AbstractProvider, type Provider } from '$plugins/Provider';
import { Alchemy as AlchemyAPI, Network as AlchemyNetwork, Utils, type AlchemySettings } from "alchemy-sdk";
import { EthereumSigner } from '$plugins/blockchains/evm/ethereum/EthereumSigner';
import type { Signer } from '$lib/plugins/Signer';

interface AlchemyOptions {
  apiKey?: string | null;
  blockchains?: string[];
  chainIds?: number[];
  blockchain?: string;
  chainId?: number;
}


/**
 * Alchemy provider class implementing the Provider interface.
 */
export class Alchemy extends AbstractProvider {
  private config: AlchemySettings | undefined;
  private alchemy: AlchemyAPI | null = null;

  constructor(options: AlchemyOptions = {}) {
    super('Alchemy', options.blockchains || ['Ethereum', 'Solana', 'Optimism', 'Polygon', 'Base', 'Arbitrum', 'Avalanche', 'Celo'], 
          options.chainIds || [1, 10, 69, 137, 80001, 42161, 421611, 11155111], 
          options.blockchain || 'Ethereum', 
          options.chainId || 1);
    this.chainId = options.chainId || 1;
    this.alchemy = null;
    this.setChainId(this.chainId);
  }


  /**
   * Connects to the specified blockchain.
   * @param blockchain - The name of the blockchain to connect to.
   * @param chainId - The chain ID of the blockchain.
   * @returns A promise that resolves when the connection is established.
   */
  async connect(blockchain: string, chainId: number): Promise<void> {
    this.blockchain = blockchain;
    this.chainId = chainId;
    await this.getAlchemy(chainId); // Ensure the provider is connected
  }

  private async getAlchemy(chainId: number = 1): Promise<AlchemyAPI> {
    this.config = getConfig(chainId);
    if (!this.config) {
      throw new Error(`Invalid chain ID: ${chainId}`);
    }
    // Clean up the old instance (if any)
    if (this.alchemy) {
      // Optionally, you can call any cleanup methods if the API provides them
      this.alchemy = null;
    }
    this.alchemy = new AlchemyAPI(this.config);
    return this.alchemy;
  }

  /**
   * Makes a call to the blockchain.
   * @param transaction - The transaction request to call.
   * @param blockTag - The block tag for the call.
   * @returns A promise that resolves with the result of the call.
   */
  call(transaction: Deferrable<TransactionRequest>, blockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns A promise that resolves with the estimated gas.
   */
  estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the current block number.
   * @returns A promise that resolves with the current block number.
   */
  async getBlockNumber(): Promise<number> {
    try {
      await this.getAlchemy(); // Ensure the provider is connected
      const blockNumber = await this.alchemy!.core.getBlockNumber();
      eventManager.emit('blockNumber', { blockNumber });
      return blockNumber;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getBlockNumber', error });
      throw error;
    }
  }

  /**
   * Gets the current gas price.
   * @returns A promise that resolves with the current gas price.
   */
  async getGasPrice(): Promise<bigint> {
    try {
      await this.getAlchemy(); // Ensure the provider is connected
      const price = await this.alchemy!.core.getGasPrice();
      eventManager.emit('gasPrice', { price: price.toBigInt() }); 
      return price.toBigInt(); // as unknown as bigint;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getGasPrice', error });
      throw error;
    }
  }

  /**
   * Gets the balance of an address.
   * @param addressOrName - The address or ENS name to get the balance for.
   * @param blockTag - The block tag for the balance query.
   * @returns A promise that resolves with the balance.
   */
  async getBalance(addressOrName: string, blockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<bigint> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const address: string = addressOrName as string;
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const balance = await this.alchemy!.core.getBalance(addressOrName, blockTagish);
      eventManager.emit('balanceFetched', { address, balance });
      return balance.toBigInt(); // as unknown as bigint;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getBalance', error });
      console.log('Alchemy: Error:', error);
      throw error;
    }
  }


  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - The block tag for the code query.
   * @returns A promise that resolves with the code.
   */
  async getCode(addressOrName: string, blockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<string> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const code = await this.alchemy!.core.getCode(addressOrName, blockTagish);
      return Promise.resolve(code);
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getCode', error });
      throw error;
    }
  }


  /**
   * Gets the storage at a position.
   * @param addressOrName - The address or ENS name to get the storage for.
   * @param position - The position in storage to get the value for.
   * @param blockTag - The block tag for the storage query.
   * @returns A promise that resolves with the storage value.
   */
  getStorageAt(addressOrName: string, position: BigNumberish, blockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<string> {
    // const blockTagish = BigNumber.from(await blockTag).toHex();
    throw new Error('Method not implemented.');
  }

  
  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns A promise that resolves with the transaction response.
   */
  async sendRawTransaction(signedTransaction: string): Promise<TransactionResponse> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const response = await this.alchemy!.transact.sendTransaction(signedTransaction);
      
      eventManager.emit('sendRawTransaction', { signedTransaction, response });
      return response as unknown as TransactionResponse;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'sendRawTransaction', error });
      throw error;
    }
  }

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns A promise that resolves with the transaction response.
   */
  async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      if (transaction.nonce === undefined || transaction.nonce < 0) {
        transaction.nonce = await this.alchemy!.core.getTransactionCount(transaction.from);
      }

      // Test gas estimate:
      // const gasEstimate = await this.alchemy!.core.estimateGas({to: transaction.to, value: transaction.value?.valueOf() as bigint, data: transaction.data});

      // Test gas price:
      // const gasPrice = await this.alchemy!.core.getGasPrice();

      const signedTransaction = await this.signer!.signTransaction(transaction);
      const response = await this.alchemy!.transact.sendTransaction(signedTransaction);
      eventManager.emit('sendTransaction', { signedTransaction, response });
      return response as unknown as TransactionResponse;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'sendTransaction', error });
      throw error;
    }
  }



  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns A promise that resolves with the block.
   */
  async getBlock(blockHashOrBlockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<Block> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const blockTagish = BigNumber.from(await blockHashOrBlockTag).toHex();
      const block = await this.alchemy!.core.getBlock(blockTagish);
      eventManager.emit('block', { blockTagish, block });
      return block as unknown as Block;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getBlock', error });
      throw error;
    }
  }

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns A promise that resolves with the block with transactions.
   */
  async getBlockWithTransactions(blockHashOrBlockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<BlockWithTransactions> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const blockTagish = BigNumber.from(await blockHashOrBlockTag).toHex();
      const block = await this.alchemy!.core.getBlockWithTransactions(blockTagish);
      eventManager.emit('blockWithTransactions', { blockTagish, block });
      return block as unknown as BlockWithTransactions;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getBlockWithTransactions', error });
      throw error;
    }
  }

  /**
   * Gets a transaction by its hash.
   * @param transactionHash - The transaction hash to get the transaction for.
   * @returns A promise that resolves with the transaction.
   */
  async getTransaction(transactionHash: string): Promise<TransactionResponse> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const trans = await this.alchemy!.core.getTransaction(transactionHash);
      return Promise.resolve(trans as unknown as TransactionResponse);
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getTransaction', error });
      throw error;
    }
  }

  /**
   * Gets the transaction count for an address.
   * @param addressOrName - The address or ENS name to get the transaction count for.
   * @param blockTag - The block tag for the transaction count query.
   * @returns A promise that resolves with the transaction count.
   */
  async getTransactionCount(addressOrName: string, blockTag: BlockTag | Promise<BlockTag> = 'latest'): Promise<number> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const count = await this.alchemy!.core.getTransactionCount(addressOrName, blockTagish);
      return Promise.resolve(count as unknown as number);
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getTransactionCount', error });
      throw error;
    }
  }

  /**
   * Gets the transaction history for a transaction hash.
   * @param transactionHash - The transaction hash to get the history for.
   * @returns A promise that resolves with the transaction history.
   */
  async getTransactionHistory(transactionHash: string): Promise<TransactionResponse> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const trans = await this.alchemy!.core.getTransaction(transactionHash);
      return Promise.resolve(trans as unknown as TransactionResponse);
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getTransactionHistory', error });
      throw error;
    }
  }

  /**
   * Gets the transaction receipt for a transaction hash.
   * @param transactionHash - The transaction hash to get the receipt for.
   * @returns A promise that resolves with the transaction receipt.
   */
  async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const receipt = await this.alchemy!.core.getTransactionReceipt(transactionHash);
      return Promise.resolve(receipt as unknown as TransactionReceipt);
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getTransactionReceipt', error });
      throw error;
    }
  }

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns A promise that resolves with the logs.
   */
  getLogs(filter: Filter): Promise<Log[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns A promise that resolves with the address or null if not found.
   */
  async resolveName(name: string): Promise<string | null> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const address = await this.alchemy!.core.resolveName(name);
      eventManager.emit('resolveName', { name, address });
      return address;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'resolveName', error });
      throw error;
    }
  }

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns A promise that resolves with the ENS name or null if not found.
   */
  lookupAddress(address: string | Promise<string>): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  /**
   * Adds an event listener for the specified event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  on(eventName: EventType, listener: Listener): Provider {
    throw new Error('Method not implemented.');
  }

  /**
   * Adds a one-time event listener for the specified event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  once(eventName: EventType, listener: Listener): Provider {
    throw new Error('Method not implemented.');
  }

  /**
   * Emits an event.
   * @param eventName - The name of the event.
   * @param args - The arguments to pass to the event listeners.
   * @returns Whether the event had listeners.
   */
  emit(eventName: EventType, ...args: any[]): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the number of listeners for the specified event.
   * @param eventName - The name of the event.
   * @returns The number of listeners.
   */
  listenerCount(eventName?: EventType): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the listeners for the specified event.
   * @param eventName - The name of the event.
   * @returns The listeners.
   */
  listeners(eventName?: EventType): Listener[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Removes an event listener for the specified event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  off(eventName: EventType, listener?: Listener): Provider {
    throw new Error('Method not implemented.');
  }

  /**
   * Removes all listeners for the specified event.
   * @param eventName - The name of the event.
   * @returns The provider instance.
   */
  removeAllListeners(eventName?: EventType): Provider {
    throw new Error('Method not implemented.');
  }

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns A promise that resolves with the result of the request.
   */
  async request(method: string, params: any[]): Promise<any> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      const result = await this.alchemy!.core.send(method, params);
      eventManager.emit('requestMade', { provider: this.name, method, params, result });
      return result;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method, error });
      throw error;
    }
  }

  /**
   * Sets the signer for the provider.
   * @param privateKey - The private key to set for the signer.
   * @throws Will throw an error if the private key is invalid.
   */
  // setSigner(privateKey: string): void {
  //   if (privateKey) {
  //     if (this.blockchain === 'Ethereum') {
  //       this.signer = new EthereumSigner(privateKey);
  //     }
  //   } else {
  //     throw new Error("Invalid private key - setSigner.");
  //   }
  // }

  setSigner(signer: Signer): void {
    this.signer = signer;
  }

  async setChainId(chainId: number): Promise<void> {
    if (this.chainId === chainId) {
      return; // If the chainId is the same, no need to reinitialize
    }
    this.chainId = chainId;
  }

}

/**
 * Gets the Alchemy configuration based on the chain ID.
 * @param chainId - The chain ID to get the configuration for.
 * @param kval - Optional API key value.
 * @returns The Alchemy settings.
 */
function getConfig(chainId: number, kval = undefined): AlchemySettings | undefined {
  try {
    let api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM_PROD;  // Set defaults
    let network = AlchemyNetwork.ETH_MAINNET;

    switch (chainId) {
      case 10: // Optimism mainnet
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_OPTIMISM_PROD;
        network = AlchemyNetwork.OPT_MAINNET;
        break;
      case 69: // Optimism testnet - TODO: Check chainId
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_OPTIMISM;
        network = AlchemyNetwork.OPT_SEPOLIA;
        break;
      case 137: // Polygon mainnet
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_POLYGON_PROD;
        network = AlchemyNetwork.MATIC_MAINNET;
        break;
      case 80001: // Polygon testnet
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_POLYGON;
        network = AlchemyNetwork.MATIC_MAINNET;
        break;
      case 42161: // Arbitrum mainnet
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_ARBITRUM_PROD;
        network = AlchemyNetwork.ARB_MAINNET;
        break;
      case 421611: // Arbitrum testnet - TODO: Check chainId
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_ARBITRUM;
        network = AlchemyNetwork.ARB_SEPOLIA;
        break;
      case 11155111: // Ethereum Sepolia
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM;
        network = AlchemyNetwork.ETH_SEPOLIA;
        break;
      case 1: // Default - Ethereum mainnet
      default:
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM_PROD;
        network = AlchemyNetwork.ETH_MAINNET;
        break;
    }
    return {
      apiKey: api,
      network: network,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
}



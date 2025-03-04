/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { type BlockTag as CustomBlockTag, type BigNumberish, type Deferrable, type TransactionResponse, type TransactionRequest, type Block, type BlockWithTransactions, type TransactionReceipt, type Filter as CustomFilter, type Log as CustomLog, BigNumber, type FeeData, error_log } from '$lib/common';
import eventManager from '$plugins/EventManager';
import { AbstractProvider } from '$plugins/Provider';
import { Alchemy as AlchemyAPI, Network as AlchemyNetwork, type AlchemySettings, type Filter as AlchemyFilter, type Log as AlchemyLog, type BlockTag as AlchemyBlockTag } from "alchemy-sdk";
import type { Signer } from '$lib/plugins/Signer';
import { EthersConverter } from '$lib/plugins/utilities/EthersConverter';
import { ethers as ethersv6 } from 'ethers-v6';
import { log } from '$lib/plugins/Logger';

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
      options.chainId || 1,
      null
    );
    this.chainId = options.chainId || 1;
    this.alchemy = null;
    this.setChainId( this.chainId );
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
    this.alchemy = new AlchemyAPI( this.config );
    return this.alchemy;
  }

  async getProviderURL() {
    await this.getAlchemy( this.chainId ); // Ensure the provider is connected
    if ( !this.alchemy ) {
      throw new Error( "No Alchemy set" );
    }
    const provider = await this.alchemy.config.getProvider();
    if (provider) {
      return provider.connection.url;
    } else {
      return '';
    }
  }

  async initializeProvider() {
    if ( this.provider ) {
      return this.provider;
    }

    const url = await this.getProviderURL();
    if ( !url ) {
      throw new Error( "No URL set" );
    }

    this.provider = new ethersv6.JsonRpcProvider( url );
    return this.provider;
  }

  // Returns the ethers v6 provider

  getProvider(): ethersv6.JsonRpcProvider | null {
    if ( !this.provider ) {
      return null;
    }
    return this.provider as ethersv6.JsonRpcProvider;
  }

  /**
   * Makes a call to the blockchain.
   * @param transaction - The transaction request to call.
   * @param blockTag - The block tag for the call.
   * @returns A promise that resolves with the result of the call.
   */
  // In the Alchemy class

  async call(transaction: Deferrable<TransactionRequest>, blockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<string> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const resolvedTransaction = await this.resolveDeferredTransaction(transaction);
      const resolvedBlockTag = await blockTag;

      const ethersTransaction = EthersConverter.transactionToEthersTransaction(resolvedTransaction);
      const result = await this.alchemy.core.call(ethersTransaction as any, resolvedBlockTag as any);

      eventManager.emit('call', { transaction: resolvedTransaction, blockTag: resolvedBlockTag, result });
      return result;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'call', error });
      throw error;
    }
  }

  async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const resolvedTransaction = await this.resolveDeferredTransaction(transaction);

      const ethersTransaction = EthersConverter.transactionToEthersTransaction(resolvedTransaction);
      const gasEstimate = await this.alchemy.core.estimateGas(ethersTransaction as any);

      eventManager.emit('estimateGas', { transaction: resolvedTransaction, gasEstimate });
      return BigInt(gasEstimate.toString());
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'estimateGas', error });
      throw error;
    }
  }

  // Helper method to resolve deferred transaction properties
  private async resolveDeferredTransaction( transaction: Deferrable<TransactionRequest> ): Promise<TransactionRequest> {
    // Use Record<string, any> to collect the resolved values
    const resolved: Record<string, any> = {};

    for ( const [ key, value ] of Object.entries( transaction ) ) {
      // If the value is a promise, await it
      if ( value instanceof Promise ) {
        resolved[ key ] = await value;
      } else {
        resolved[ key ] = value;
      }
    }

    // Cast the final resolved object to TransactionRequest
    return resolved as TransactionRequest;
  }

  /**
   * Gets the current block number.
   * @returns A promise that resolves with the current block number.
   */
  async getBlockNumber(): Promise<number> {
    try {
      await this.getAlchemy(); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const blockNumber = await this.alchemy.core.getBlockNumber();
      eventManager.emit('blockNumber', { blockNumber });
      return blockNumber;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const price = await this.alchemy.core.getGasPrice();
      eventManager.emit('gasPrice', { price: price.toBigInt() });
      return price.toBigInt(); // as unknown as bigint;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getGasPrice', error });
      throw error;
    }
  }

  async getFeeData(): Promise<FeeData> {
    try {
      await this.getAlchemy(); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const feeData = await this.alchemy.core.getFeeData();
      eventManager.emit('feeData', { feeData });
      return feeData as unknown as FeeData;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getFeeData', error });
      throw error;
    }
  }

  /**
   * Gets the balance of an address.
   * @param addressOrName - The address or ENS name to get the balance for.
   * @param blockTag - The block tag for the balance query.
   * @returns A promise that resolves with the balance.
   */
  async getBalance(addressOrName: string, blockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<bigint> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const address: string = addressOrName as string;
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const balance = await this.alchemy.core.getBalance(addressOrName, blockTagish);
      eventManager.emit('balanceFetched', { address, balance });
      return balance.toBigInt(); // as unknown as bigint;
    } catch (error) {
      eventManager.emit('error', { provider: this.name, method: 'getBalance', error });
      // log.error('Alchemy:', false, error);
      throw error;
    }
  }

  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - The block tag for the code query.
   * @returns A promise that resolves with the code.
   */
  async getCode(addressOrName: string, blockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<string> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const code = await this.alchemy.core.getCode(addressOrName, blockTagish);
      return code;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
  async getStorageAt(addressOrName: string, position: BigNumberish, blockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<string> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const resolvedBlockTag = await blockTag;
      const storage = await this.alchemy.core.getStorageAt(
        addressOrName,
        EthersConverter.toEthersHex(position) as string || '0x0',
        resolvedBlockTag as any
      );

      eventManager.emit('getStorageAt', { addressOrName, position, blockTag: resolvedBlockTag, storage });
      return storage;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getStorageAt', error });
      throw error;
    }
  }

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns A promise that resolves with the transaction response.
   */
  async sendRawTransaction(signedTransaction: string): Promise<TransactionResponse> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const response = await this.alchemy.transact.sendTransaction(signedTransaction);

      eventManager.emit('sendRawTransaction', { signedTransaction, response });
      return response as unknown as TransactionResponse;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'sendRawTransaction', error });
      throw error; // Push this on up the stack
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
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      if (transaction.nonce === undefined || transaction.nonce < 0) {
        transaction.nonce = await this.alchemy!.core.getTransactionCount(transaction.from);
      }
      if ( !this.signer ) {
        const signer = this.getSigner();
        if (signer) {
          this.setSigner( signer );
        } else {
          throw new Error('No signer set');
        }
      }
      if ( !this.signer ) {
        throw new Error( 'No signer set' );
      }
      const signedTransaction = await this.signer.signTransaction(transaction);
      const response = await this.alchemy.transact.sendTransaction(signedTransaction);
      eventManager.emit('sendTransaction', { signedTransaction, response });
      return response as unknown as TransactionResponse;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'sendTransaction', error });
      throw error;
    }
  }

  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns A promise that resolves with the block.
   */
  async getBlock(blockHashOrBlockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<Block> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const blockTagish = BigNumber.from(await blockHashOrBlockTag).toHex();
      const block = await this.alchemy.core.getBlock(blockTagish);
      eventManager.emit('block', { blockTagish, block });
      return block as unknown as Block;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getBlock', error });
      throw error;
    }
  }

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns A promise that resolves with the block with transactions.
   */
  async getBlockWithTransactions(blockHashOrBlockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<BlockWithTransactions> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const blockTagish = BigNumber.from(await blockHashOrBlockTag).toHex();
      const block = await this.alchemy.core.getBlockWithTransactions(blockTagish);
      eventManager.emit('blockWithTransactions', { blockTagish, block });
      return block as unknown as BlockWithTransactions;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const trans = await this.alchemy.core.getTransaction(transactionHash);
      return trans as unknown as TransactionResponse;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
  async getTransactionCount(addressOrName: string, blockTag: CustomBlockTag | Promise<CustomBlockTag> = 'latest'): Promise<number> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const blockTagish = BigNumber.from(await blockTag).toHex();
      const count = await this.alchemy.core.getTransactionCount(addressOrName, blockTagish);
      return count as unknown as number;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const trans = await this.alchemy.core.getTransaction( transactionHash );
      return trans as unknown as TransactionResponse;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const receipt = await this.alchemy.core.getTransactionReceipt(transactionHash);
      return receipt as unknown as TransactionReceipt;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getTransactionReceipt', error });
      throw error;
    }
  }

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns A promise that resolves with the logs.
   */
  async getLogs(filter: CustomFilter): Promise<CustomLog[]> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }

      // Convert your custom Filter type to Alchemy Filter type
      const alchemyFilter: AlchemyFilter = {
        address: filter.address,
        topics: filter.topics
      };

      if (filter.fromBlock) {
        alchemyFilter.fromBlock = this.convertToAlchemyBlockTag(filter.fromBlock);
      }
      if (filter.toBlock) {
        alchemyFilter.toBlock = this.convertToAlchemyBlockTag(filter.toBlock);
      }

      const logs = await this.alchemy.core.getLogs(alchemyFilter)
      // Convert Alchemy logs to your custom Log type
      const convertedLogs: CustomLog[] = logs.map(log => this.convertAlchemyLogToCustomLog(log));

      eventManager.emit('getLogs', { filter, logs: convertedLogs });
      return convertedLogs;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'getLogs', error });
      throw error;
    }
  }

  // Helper method to convert custom BlockTag to Alchemy BlockTag
  private convertToAlchemyBlockTag(blockTag: CustomBlockTag): AlchemyBlockTag {
    if (typeof blockTag === 'string') {
      if (blockTag === 'latest' || blockTag === 'pending' || blockTag === 'earliest') {
        return blockTag;
      }
      // If it's a hex string, convert it to a number
      return parseInt(blockTag, 16);
    }
    if (typeof blockTag === 'number' || typeof blockTag === 'bigint') {
      return Number(blockTag);
    }
    throw new Error(`Invalid block tag: ${blockTag}`);
  }

  // Helper method to convert Alchemy Log to custom Log
  private convertAlchemyLogToCustomLog(log: AlchemyLog): CustomLog {
    return {
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      transactionIndex: log.transactionIndex,
      removed: log.removed,
      address: log.address,
      data: log.data,
      topics: log.topics,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex
    };
  }

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns A promise that resolves with the address or null if not found.
   */
  async resolveName(name: string): Promise<string | null> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const address = await this.alchemy.core.resolveName(name);
      eventManager.emit('resolveName', { name, address });
      return address;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'resolveName', error });
      throw error;
    }
  }

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns A promise that resolves with the ENS name or null if not found.
   */
  async lookupAddress(address: string): Promise<string | null> {
    try {
      await this.getAlchemy(this.chainId); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const name = await this.alchemy.core.lookupAddress(address);
      eventManager.emit('lookupAddress', { address, name });
      return name;
    } catch (error) {
      // log.error('Alchemy:', false, error);
      eventManager.emit('error', { provider: this.name, method: 'lookupAddress', error });
      throw error;
    }
  }

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns A promise that resolves with the result of the request.
   */
  async request(method: string, params: any[]): Promise<any> {
    try {
      await this.getAlchemy( this.chainId ); // Ensure the provider is connected
      if ( !this.alchemy ) {
        throw new Error( "No Alchemy set" );
      }
      const result = await this.alchemy.core.send(method, params);
      eventManager.emit('requestMade', { provider: this.name, method, params, result });
      return result;
    } catch (error) {
      // log.error('Alchemy:', false, error);
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

  setSigner( signer: Signer ): void {
    if ( !signer ) {
      throw new Error( "Invalid signer" );
    }
    this.signer = signer;
  }

  async setChainId(chainId: number): Promise<void> {
    if (this.chainId === chainId) {
      return; // If the chainId is the same, no need to reinitialize
    }
    this.chainId = chainId;
  }

  // Example if needing to override eventManager
  // on(eventName: EventType, listener: Listener): Provider {
    // Custom logic here
    // return super.on(eventName, listener);
  // }
}

/**
 * Gets the Alchemy configuration based on the chain ID.
 * @param chainId - The chain ID to get the configuration for.
 * @param kval - Optional API key value.
 * @returns The Alchemy settings.
 */
function getConfig(chainId: number, kval: any = undefined): AlchemySettings | undefined {
  try {
    let api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_PROD;  // Set defaults
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
        api = kval ?? import.meta.env.VITE_ALCHEMY_API_KEY_PROD;
        network = AlchemyNetwork.ETH_MAINNET;
        break;
    }
    return {
      apiKey: api,
      network: network,
    };
  } catch (e) {
    log.error(e);
    return undefined;
  }
}



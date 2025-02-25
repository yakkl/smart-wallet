/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type BigNumberish, type Block, type BlockTag, type BlockWithTransactions, type Deferrable, type EventType, type FeeData, type Filter, type Listener, type Log, type TransactionReceipt, type TransactionRequest, type TransactionResponse, type TypedDataDomain, type TypedDataField } from '$lib/common';
import { Signer } from '$plugins/Signer';
import eventManager from './EventManager';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';

// async function resolveProperties<T>(props: T): Promise<T> {
//   const resolved: any = {};
//   for (const key in props) {
//     resolved[key] = await props[key];
//   }
//   return resolved;
// }

export function assertProvider( provider: Provider | null ): asserts provider is Provider {
  if ( provider === null ) {
    throw new Error( 'Provider is null' );
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
  provider: any | null; // Native provider instance (e.g. ethers.js provider or web3.js provider)

  /**
   * Connects the provider to a specified blockchain and chain ID.
   * @param blockchain - The blockchain to connect to.
   * @param chainId - The chain ID to connect to.
   */
  connect( blockchain: string, chainId: number ): Promise<void>;

  getProviderURL(): Promise<string>; // Returns the native provider such as ethers.js provider or web3.js provider
  // getProviderEthers(): ethers.JsonRpcProvider | null; // Use it if using ethers.

  /**
   * Gets the current block number.
   * @returns The current block number.
   */
  getBlockNumber(): Promise<number>;

  getBlockchains(): string[];
  setBlockchains( blockchains: string[] ): void;
  getBlockchain(): string;

  getChainIds(): number[];
  setChainIds( chainIds: number[] ): void;
  getChainId(): number;
  setChainId( chainId: number ): void;
  initializeProvider(): Promise<any | null>;
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
  getBalance( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<bigint>;

  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - Optional block tag.
   * @returns The code at the address.
   */
  getCode( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;

  getName(): string;

  /**
   * Gets the storage at a position.
   * @param addressOrName - The address or ENS name to get the storage for.
   * @param position - The storage position.
   * @param blockTag - Optional block tag.
   * @returns The storage at the position.
   */
  getStorageAt( addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;

  getProvider(): any | null;
  getSigner(): Signer | null;
  getSignerNative(): any | null;

  setProvider( provider: any ): void; // This one sets the provider after it has been created by the wallet and/or Signer
  setSigner( signer: Signer ): void; // This one sets the signer for the provider after it has been created by the wallet and/or Signer

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns The transaction response.
   */
  sendRawTransaction( signedTransaction: string ): Promise<TransactionResponse>;

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns The transaction response.
   */
  sendTransaction( transaction: TransactionRequest ): Promise<TransactionResponse>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  signTransaction( transaction: TransactionRequest ): Promise<string>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  signTypedData( domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any> ): Promise<string>;

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns The signed message.
   */
  signMessage( message: string ): Promise<string>;

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  call( transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns The estimated gas.
   */
  estimateGas( transaction: Deferrable<TransactionRequest> ): Promise<bigint>;

  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns The block.
   */
  getBlock( blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string> ): Promise<Block>;

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns The block with transactions.
   */
  getBlockWithTransactions( blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string> ): Promise<BlockWithTransactions>;

  /**
   * Gets a transaction by its hash.
   * @param transactionHash - The transaction hash to get the transaction for.
   * @returns The transaction.
   */
  getTransaction( transactionHash: string ): Promise<TransactionResponse>;

  /**
   * Gets the transaction count for an address.
   * @param addressOrName - The address or ENS name to get the transaction count for.
   * @param blockTag - Optional block tag.
   * @returns The transaction count.
   */
  getTransactionCount( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<number>;

  /**
   * Gets the transaction history for an address.
   * @param address - The address to get the transaction history for.
   * @returns The transaction history.
   */
  getTransactionHistory( address: string ): Promise<any>;

  /**
   * Gets the transaction receipt by its hash.
   * @param transactionHash - The transaction hash to get the receipt for.
   * @returns The transaction receipt.
   */
  getTransactionReceipt( transactionHash: string ): Promise<TransactionReceipt>;

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns The logs.
   */
  getLogs( filter: Filter ): Promise<Array<Log>>;

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns The resolved address or null if not found.
   */
  resolveName( name: string | Promise<string> ): Promise<null | string>;

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns The ENS name or null if not found.
   */
  lookupAddress( address: string | Promise<string> ): Promise<null | string>;

  /**
   * Adds a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  on( eventName: EventType, listener: Listener ): Provider;

  /**
   * Adds a one-time listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  once( eventName: EventType, listener: Listener ): Provider;

  /**
   * Emits an event.
   * @param eventName - The name of the event.
   * @param args - The arguments to pass to the event listeners.
   * @returns Whether the event had listeners.
   */
  emit( eventName: EventType, ...args: Array<any> ): boolean;

  /**
   * Gets the listener count for an event.
   * @param eventName - The name of the event.
   * @returns The listener count.
   */
  listenerCount( eventName?: EventType ): number;

  /**
   * Gets the listeners for an event.
   * @param eventName - The name of the event.
   * @returns The listeners.
   */
  listeners( eventName?: EventType ): Array<Listener>;

  /**
   * Removes a listener for an event.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  off( eventName: EventType, listener?: Listener ): Provider;

  /**
   * Removes all listeners for an event.
   * @param eventName - The name of the event.
   * @returns The provider instance.
   */
  removeAllListeners( eventName?: EventType ): Provider;

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  request<T>( method: string, params: any[] ): Promise<any>;
}

/**
 * Abstract class representing a provider.
 */
export abstract class AbstractProvider implements Provider {
  /** List of blockchains supported by this provider */
  blockchains: string[] = [];
  /** Current blockchain (default is Ethereum) */
  blockchain: string = 'Ethereum';
  chainIds: number[] = [ 1, 11155111 ]; // supported chainIds
  /** Chain ID (default is Ethereum Mainnet) */
  chainId: number = 1;
  /** Name of the provider */
  name: string;
  /** Optional signer for the provider */
  signer: Signer | undefined = undefined; // This is the signer that will be set by the wallet and/or Signer

  provider: Provider | any | null = null; // Native provider instance (e.g. ethers.js provider or web3.js provider)

  /**
   * Creates an instance of AbstractProvider.
   * @param name - The name of the provider.
   */
  constructor ( name: string, blockchains: string[], chainIds: number[], blockchain: string, chainId: number, provider?: any | null ) {
    this.name = name;
    this.blockchains = blockchains;
    this.chainIds = chainIds;
    this.blockchain = blockchain;
    this.chainId = chainId;
    this.provider = provider;
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

  // abstract getProviderEthers(): ethers.JsonRpcProvider | null; // TODO: May need to remove this and handle it differently

  /**
   * Gets the balance of an address.
   * @param addressOrName - The address or ENS name to get the balance for.
   * @param blockTag - Optional block tag.
   * @returns The balance of the address.
   */
  abstract getBalance( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<bigint>;

  /**
   * Gets the code at an address.
   * @param addressOrName - The address or ENS name to get the code for.
   * @param blockTag - Optional block tag.
   * @returns The code at the address.
   */
  abstract getCode( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;

  /**
   * Gets the storage at a position.
   * @param addressOrName - The address or ENS name to get the storage for.
   * @param position - The storage position.
   * @param blockTag - Optional block tag.
   * @returns The storage at the position.
   */
  abstract getStorageAt( addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;
  abstract initializeProvider(): Promise<any | null>;

  getName(): string {
    return this.name;
  }

  getProvider(): any | null {
    if ( !this.provider ) {
      return null;
    }
    return this.provider;
  }

  getSigner(): Signer | null {
    if ( !this.signer ) {
      return null;
    }
    return this.signer;
  }

  // Convenient method to get the native signer
  getSignerNative() {
    if ( !this.signer ) {
      return null;
    }
    return this.signer.getSigner();
  }

  // Sets native provider instance (e.g. ethers.js provider or web3.js provider)
  setProvider( provider: any ): void {
    if ( !provider ) throw new Error( 'Provider is not valid' );
    this.provider = provider;
  }

  setSigner( signer: Signer ): void {
    if ( !this.signer ) throw new Error( 'Signer is not valid' );
    this.signer = signer;
    // this.signer.setSigner( this );
  }

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns The transaction response.
   */
  abstract sendRawTransaction( signedTransaction: string ): Promise<TransactionResponse>;

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns The transaction response.
   */
  abstract sendTransaction( transaction: TransactionRequest ): Promise<TransactionResponse>;

  /**
   * Signs a transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  async signTransaction( transaction: TransactionRequest ): Promise<string> {
    if ( !this.signer ) {
      throw new Error( 'Signer not initialized' );
    }
    return await this.signer.signTransaction( transaction );
  }

  /**
   * Signs a typed data transaction.
   * @param transaction - The transaction request to sign.
   * @returns The signed transaction.
   */
  async signTypedData( domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any> ): Promise<string> {
    if ( !this.signer ) {
      throw new Error( 'Signer not initialized' );
    }
    return await this.signer.signTypedData( domain, types, value );
  }

  /**
   * Signs a message.
   * @param message - The message to sign.
   * @returns The signed message.
   */
  async signMessage( message: string ): Promise<string> {
    if ( !this.signer ) {
      throw new Error( 'Signer not initialized' );
    }
    return await this.signer.signMessage( message );
  }

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  abstract call( transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string>;

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns The estimated gas.
   */
  abstract estimateGas( transaction: Deferrable<TransactionRequest> ): Promise<bigint>;

  /**
   * Gets a block by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block for.
   * @returns The block.
   */
  abstract getBlock( blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string> ): Promise<Block>;

  /**
   * Gets a block with transactions by its hash or block tag.
   * @param blockHashOrBlockTag - The block hash or block tag to get the block with transactions for.
   * @returns The block with transactions.
   */
  abstract getBlockWithTransactions( blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string> ): Promise<BlockWithTransactions>;

  /**
   * Gets a transaction by its hash.
   * @param transactionHash - The transaction hash to get the transaction for.
   * @returns The transaction.
   */
  abstract getTransaction( transactionHash: string ): Promise<TransactionResponse>;

  /**
   * Gets the transaction count for an address.
   * @param addressOrName - The address or ENS name to get the transaction count for.
   * @param blockTag - Optional block tag.
   * @returns The transaction count.
   */
  abstract getTransactionCount( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<number>;

  /**
   * Gets the transaction history for an address.
   * @param address - The address to get the transaction history for.
   * @returns The transaction history.
   */
  abstract getTransactionHistory( address: string ): Promise<any>; // Only for Etherscan

  /**
   * Gets the transaction receipt by its hash.
   * @param transactionHash - The transaction hash to get the receipt for.
   * @returns The transaction receipt.
   */
  abstract getTransactionReceipt( transactionHash: string ): Promise<TransactionReceipt>;

  /**
   * Gets logs based on a filter.
   * @param filter - The filter to get logs for.
   * @returns The logs.
   */
  abstract getLogs( filter: Filter ): Promise<Array<Log>>;

  abstract getProviderURL(): Promise<string>; // Returns the native provider such as ethers.js provider or web3.js provider

  /**
   * Resolves an ENS name to an address.
   * @param name - The ENS name to resolve.
   * @returns The resolved address or null if not found.
   */
  abstract resolveName( name: string | Promise<string> ): Promise<null | string>;

  /**
   * Looks up an address to get its ENS name.
   * @param address - The address to look up.
   * @returns The ENS name or null if not found.
   */
  abstract lookupAddress( address: string | Promise<string> ): Promise<null | string>;

  // EventManager methods
  on( eventName: EventType, listener: Listener ): Provider {
    eventManager.on( eventName, listener );
    return this;
  }

  once( eventName: EventType, listener: Listener ): Provider {
    eventManager.once( eventName, listener );
    return this;
  }

  emit( eventName: EventType, ...args: any[] ): boolean {
    return eventManager.emit( eventName, ...args );
  }

  listenerCount( eventName?: EventType ): number {
    return eventManager.listenerCount( eventName );
  }

  listeners( eventName?: EventType ): Listener[] {
    return eventManager.listeners( eventName );
  }

  off( eventName: EventType, listener?: Listener ): Provider {
    eventManager.off( eventName, listener );
    return this;
  }

  removeAllListeners( eventName?: EventType ): Provider {
    eventManager.removeAllListeners( eventName );
    return this;
  }

  /**
   * Connects the provider to a specified blockchain and chain ID.
   * @param blockchain - The blockchain to connect to.
   * @param chainId - The chain ID to connect to.
   */
  abstract connect( blockchain: string, chainId: number ): Promise<void>;

  /**
   * Makes a request to the provider.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  abstract request( method: string, params: any[] ): Promise<any>;

  /**
   * Gets the fee data.
   * @returns The fee data.
   */

  async getFeeData(): Promise<FeeData> {
    const [ block, gasPrice ] = await Promise.all( [
      this.getBlock( "latest" ),
      this.getGasPrice()
    ] );

    let lastBaseFeePerGas: EthereumBigNumber = new EthereumBigNumber( 0 );
    let maxFeePerGas: EthereumBigNumber = new EthereumBigNumber( 0 );
    let maxPriorityFeePerGas: EthereumBigNumber = new EthereumBigNumber( 0 );

    if ( block && block.baseFeePerGas ) {
      lastBaseFeePerGas = EthereumBigNumber.from( block.baseFeePerGas );
      maxPriorityFeePerGas = EthereumBigNumber.fromGwei( 1.5 ); // 1.5 Gwei as an example
      maxFeePerGas = EthereumBigNumber.from( lastBaseFeePerGas.mul( 2 ).add( maxPriorityFeePerGas ) );
    }

    // Convert gasPrice from Wei to Gwei
    const gasPriceGwei = EthereumBigNumber.from( gasPrice ).div( 1000000000 );

    // console.log( 'gasPrice in wei:', gasPrice );

    // console.log( "getFeeData lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice (in Gwei)",
    //   lastBaseFeePerGas.toGwei().toString(),
    //   maxFeePerGas.toGwei().toString(),
    //   maxPriorityFeePerGas.toString(),
    //   gasPriceGwei.toString()
    // );

    return {
      lastBaseFeePerGas: lastBaseFeePerGas.toBigInt() ?? BigInt( 0 ),
      maxFeePerGas: maxFeePerGas.toBigInt() ?? BigInt( 0 ),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toBigInt() ?? BigInt( 0 ),
      gasPrice: gasPriceGwei
    };
  }

  /**
   * Alias for `on` method.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  addListener( eventName: EventType, listener: Listener ): Provider {
    return this.on( eventName, listener );
  }

  /**
   * Alias for `off` method.
   * @param eventName - The name of the event.
   * @param listener - The listener function.
   * @returns The provider instance.
   */
  removeListener( eventName: EventType, listener: Listener ): Provider {
    return this.off( eventName, listener );
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
  setBlockchains( blockchains: string[] ): void {
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
  setChainIds( chainIds: number[] ): void {
    this.chainIds = chainIds;
  }

  /**
   * Sets the chain ID supported by this provider.
   * @param chainId - The chain ID to set.
   */
  async setChainId( chainId: number ): Promise<void> {
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

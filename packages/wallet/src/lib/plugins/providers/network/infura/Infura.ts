/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { BlockTag, BigNumberish, TransactionResponse, TransactionRequest, Deferrable, Block, BlockWithTransactions, TransactionReceipt, Filter, Log, EventType, Listener } from '$lib/common';
import { AbstractProvider, type Provider } from '$plugins/Provider';

export class Infura extends AbstractProvider {
  initializeProvider(): Promise<any | null> {
    throw new Error( 'Method not implemented.' );
  }
  getProviderURL(): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }
  getProviderEthers(): any {
    throw new Error( 'Method not implemented.' );
  }
  getBlockNumber(): Promise<number> {
    throw new Error( 'Method not implemented.' );
  }
  getGasPrice(): Promise<bigint> {
    throw new Error( 'Method not implemented.' );
  }
  getBalance( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> | undefined ): Promise<bigint> {
    throw new Error( 'Method not implemented.' );
  }
  getCode( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> | undefined ): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }
  getStorageAt( addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag> | undefined ): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }
  sendRawTransaction( signedTransaction: string ): Promise<TransactionResponse> {
    throw new Error( 'Method not implemented.' );
  }
  sendTransaction( transaction: TransactionRequest ): Promise<TransactionResponse> {
    throw new Error( 'Method not implemented.' );
  }
  call( transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag> | undefined ): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }
  estimateGas( transaction: Deferrable<TransactionRequest> ): Promise<bigint> {
    throw new Error( 'Method not implemented.' );
  }
  getBlock( blockHashOrBlockTag: BlockTag | Promise<BlockTag> ): Promise<Block> {
    throw new Error( 'Method not implemented.' );
  }
  getBlockWithTransactions( blockHashOrBlockTag: BlockTag | Promise<BlockTag> ): Promise<BlockWithTransactions> {
    throw new Error( 'Method not implemented.' );
  }
  getTransaction( transactionHash: string ): Promise<TransactionResponse> {
    throw new Error( 'Method not implemented.' );
  }
  getTransactionCount( addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag> | undefined ): Promise<number> {
    throw new Error( 'Method not implemented.' );
  }
  getTransactionHistory( address: string ): Promise<any> {
    throw new Error( 'Method not implemented.' );
  }
  getTransactionReceipt( transactionHash: string ): Promise<TransactionReceipt> {
    throw new Error( 'Method not implemented.' );
  }
  getLogs( filter: Filter ): Promise<Log[]> {
    throw new Error( 'Method not implemented.' );
  }
  resolveName( name: string | Promise<string> ): Promise<string | null> {
    throw new Error( 'Method not implemented.' );
  }
  lookupAddress( address: string | Promise<string> ): Promise<string | null> {
    throw new Error( 'Method not implemented.' );
  }
  on( eventName: EventType, listener: Listener ): Provider {
    throw new Error( 'Method not implemented.' );
  }
  once( eventName: EventType, listener: Listener ): Provider {
    throw new Error( 'Method not implemented.' );
  }
  emit( eventName: EventType, ...args: any[] ): boolean {
    throw new Error( 'Method not implemented.' );
  }
  listenerCount( eventName?: EventType | undefined ): number {
    throw new Error( 'Method not implemented.' );
  }
  listeners( eventName?: EventType | undefined ): Listener[] {
    throw new Error( 'Method not implemented.' );
  }
  off( eventName: EventType, listener?: Listener | undefined ): Provider {
    throw new Error( 'Method not implemented.' );
  }
  removeAllListeners( eventName?: EventType | undefined ): Provider {
    throw new Error( 'Method not implemented.' );
  }
  constructor(privateKey: string | null, 
    blockchains: string[] = ['Ethereum', 'Solana', 'Optimism', 'Polygon', 'Base', 'Arbitrum', 'Avalanche', 'Celo'],
    chainIds: number[] = [1, 10, 69, 137, 80001, 42161, 421611, 11155111],
    blockchain: string = 'Ethereum',
    chainId: number = 1) {
    super('Infura', blockchains, chainIds, blockchain, chainId);

    // if (privateKey) {
    //   this.setPrivateKey(privateKey);
    // }
    // Initialize Infura here
  }

  async connect(): Promise<void> {
    // Implementation for connecting to Alchemy
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async request(method: string, params: any[]): Promise<any> {
    // Implementation for sending requests to Alchemy
  }
}

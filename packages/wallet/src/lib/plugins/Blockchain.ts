/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AccountInfo, BaseTransaction, BigNumberish, Block, BlockTag, BlockWithTransactions, Deferrable, Filter, Log, MetaData, Transaction, TransactionReceipt, TransactionRequest, TransactionResponse, YakklPrimaryAccount, Network, IMAGEPATH } from '$lib/common';
import type { Provider } from '$plugins/Provider';


/**
 * Interface for blockchain interactions.
 */
export interface Blockchain {
  name: string; // Name of the blockchain
  networks: Network[]; // List of networks supported by this blockchain (e.g. Mainnet, Testnet) - The specific blockchain should set the networks it supports
  network: Network; // Current network
  chainId: number; // Current chainId
  symbol: string; // Symbol of the blockchain, e.g. 'ETH'
  icon: IMAGEPATH; // Icon of the blockchain (could be a URL, path or base64 encoded string)
  providers: Provider[]; // List of providers supported by this blockchain
  options: { [key: string]: MetaData }; // Additional options for the blockchain (optional)

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

  /**
   * Connects the blockchain to a provider with a specific chain ID.
   * @param provider - The provider to connect.
   * @param chainId - The chain ID to connect.
   */
  connect(provider: Provider, chainId: number): void;

  /**
   * Creates a new account.
   * @param accountToDeriveFrom - The primary account to derive from, if any.
   * @param accountInfo - Information about the account.
   * @returns The created account.
   */
  createAccount<T>(accountToDeriveFrom: YakklPrimaryAccount | null, accountInfo: AccountInfo): Promise<T>;

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction request to estimate gas for.
   * @returns The estimated gas.
   */
  estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint>;

  // Getters for blockchain information
  getBlockchainName(): string;
  getChainId(): number;
  getNetwork(): Network;
  getNetworkByChainId(chainId: number): Network;
  getIcon(): IMAGEPATH;
  getNetworks(): Network[];
  getSymbol(): string;
  setChainId(chainId: number): void;
  setNetwork(network: Network): Network; // Sets the current network and returns the old network or null if not found
  setNetworkByChainId(chainId: number): Network; // Sets the current network by chain ID and returns the old network or null if not found

  // Queries
  getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<bigint>;
  getBlock(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<Block>;
  getBlockNumber(): Promise<number>;
  getBlockWithTransactions(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<BlockWithTransactions>;
  getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
  getFeeData(): Promise<any>;
  getGasPrice(): Promise<bigint>;
  getLogs(filter: Filter): Promise<Array<Log>>;
  getOptions(blockchain: string): MetaData | undefined;
  getProvider(): Provider;
  getProviders(): Provider[];
  getProviderList(): string[];
  getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
  getTransaction(transactionHash: string): Promise<any>;
  getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;
  getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;
  getTransactionHistory(address: string): Promise<any>;

  /**
   * Checks if an address is valid.
   * @param address - The address to check.
   * @returns Whether the address is valid.
   */
  isAddress(address: string): boolean;

  /**
   * Checks if an address is a smart contract.
   * @param address - The address to check.
   * @returns Whether the address is a smart contract.
   */
  isSmartContract(address: string): Promise<boolean>;

  /**
   * Checks if a given blockchain supports smart contracts.
   * @returns Whether the supports a smart contract.
   */
  isSmartContractSupported(): boolean;

  /**
   * Calls a specific blockchain method.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  request(method: string, params: any[]): Promise<any>;

  // Execution
  sendRawTransaction(signedTransaction: string): Promise<TransactionResponse>;
  sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
  setProvider(provider: Provider, chainId: number): void;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: Transaction): Promise<string>;
  signTypedData(transaction: Transaction): Promise<string>;
}

/**
 * Abstract class representing a blockchain.
 */
export abstract class AbstractBlockchain<T extends BaseTransaction> implements Blockchain {
  provider: Provider;
  providers: Provider[] = [];
  chainId: number;
  networks: Network[] = [];
  network: Network;
  symbol: string;
  icon: IMAGEPATH;
  name: string;
  options: { [key: string]: MetaData };

  /**
   * Creates an instance of AbstractBlockchain. This class should be extended by specific blockchain implementations.
   * @param name - The name of the blockchain.
   * @param chainId - The chain ID of the blockchain to be set as current.
   * @param providers - The providers supported by this blockchain.
   * @param options - Additional options for the blockchain.
   */
  constructor(name: string, chainId: number, providers: Provider[], networks: Network[], symbol: string, icon: IMAGEPATH, options: { [key: string]: MetaData } = {}) {
    this.name = name;
    this.providers = providers;
    this.chainId = chainId;
    this.networks = networks;
    this.options = options;
    this.symbol = symbol;
    this.icon = icon;
    this.network = this.getNetwork();

    if (this.providers.length === 0) {
      throw new Error('Providers list cannot be empty');
    }
    this.provider = providers[0]; // Default to the first provider
  }

  /**
   * Calls a transaction.
   * @param transaction - The transaction request to call.
   * @param blockTag - Optional block tag.
   * @returns The result of the call.
   */
  async call(transaction: Deferrable<TransactionRequest>, blockTag: any): Promise<string> {
    try {
      return await this.provider.call(transaction, blockTag);
    } catch (e) {
      throw new Error(`Error calling - call: ${e}`);
    }
  }

  /**
   * Connects the blockchain to a provider with a specific chain ID.
   * @param provider - The provider to connect.
   * @param chainId - The chain ID to connect.
   */
  connect(provider: Provider, chainId: number): void {
    if (!this.providers.includes(provider)) {
      throw new Error('Provider not supported');
    }
    this.provider = provider;
    this.chainId = chainId;
  }

  abstract createAccount<T>(accountToDeriveFrom: YakklPrimaryAccount | null, accountInfo: AccountInfo): Promise<T>;
  abstract estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint>;

  getBlockchainName(): string {
    return this.name;
  }

  getChainId(): number {
    return this.chainId;
  }

  getNetwork(): Network {
    this.network = this.networks.find((network) => network.chainId === this.chainId) || this.networks[0];
    return this.network;
  }

  getNetworkByChainId(chainId: number): Network {
    return this.networks.find((network) => network.chainId === chainId) || this.networks[0];
  }

  getIcon(): IMAGEPATH {
    return this.icon;
  }

  getNetworks(): Network[] {

    console.log('Blockchain networks', this.networks);
    return this.networks;
  }
  
  getSymbol(): string {
    return this.symbol;
  }

  // May need to check if there is a current provider and if that provider supports the chainId
  // If not, throw an error or switch to a provider that supports the chainId
  // May also need to check if the chainId is supported by the blockchain itself (e.g. Ethereum)
  // If not, throw an error or switch to a chainId that is supported
  // May also need to make sure that the chainId is valid (e.g. not 0) - if not, throw an error. We don't want to change to chainId on a different blockchain! The blockchain should be able to handle this.
  async setChainId(chainId: number): Promise<void> {
    if (this.chainId === chainId) {
      return;
    }
    if (chainId <= 0) {
      throw new Error('Invalid chain ID');
    }
    // Check if the provider supports the chainId
    if (this.provider.getChainIds() && !this.provider.getChainIds().includes(chainId)) {
      throw new Error('Provider does not support chain ID');
    }
    // Check if the blockchain supports the chainId
    if (this.networks.find((network) => network.chainId === chainId) === undefined) {
      throw new Error('Blockchain does not support chain ID');
    }
    this.network = this.getNetworkByChainId(chainId);
    this.chainId = chainId;
  }

  // Everything pulls from the current network object
  setNetwork(network: Network): Network {
    try {
      if (!this.networks.includes(network)) {
        return this.network; // Return the current network if not found
      }
      const oldNetwork = this.network;
      this.network = network;
      return oldNetwork;
    } catch (e) {
      throw new Error(`Error calling - switchNetwork: ${e}`);
    }
  }

  setNetworkByChainId(chainId: number): Network {
    try {
      const network = this.getNetworkByChainId(chainId);
      return this.setNetwork(network);
    } catch (e) {
      throw new Error(`Error calling - switchNetwork: ${e}`);
    }
  }

  /**
   * Gets the balance of an address.
   * @param address - The address to get the balance for.
   * @returns The balance of the address.
   */
  async getBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (e) {
      throw new Error(`Error calling - getBalance: ${e}`);
    }
  }

  getBlock(blockHashOrBlockTag: BlockTag | Promise<BlockTag>): Promise<Block> {
    throw new Error('Method not implemented.');
  }
  getBlockNumber(): Promise<number> {
    throw new Error('Method not implemented.');
  }
  getBlockWithTransactions(blockHashOrBlockTag: BlockTag | Promise<BlockTag>): Promise<BlockWithTransactions> {
    throw new Error('Method not implemented.');
  }
  getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> {
    throw new Error('Method not implemented.');
  }

  abstract getFeeData(): Promise<any>;

  getGasPrice(): Promise<bigint> {
    throw new Error('Method not implemented.');
  }
  getLogs(filter: Filter): Promise<Log[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the options for a blockchain.
   * @param blockchain - The blockchain to get options for.
   * @returns The options for the blockchain.
   */
  getOptions(blockchain: string): MetaData | undefined {
    return this.options[blockchain];
  }

  /**
   * Gets the current provider.
   * @returns The current provider.
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Gets the list of providers supported by this blockchain.
   * @returns The list of providers.
   */
  getProviders(): Provider[] {
    return this.providers;
  }

  /**
   * Gets the list of provider names supported by this blockchain.
   * @returns The list of provider names.
   */
  getProviderList(): string[] {
    return this.providers.map((provider) => provider.name);
  }

  getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> {
    throw new Error('Method not implemented.');
  }

  abstract getTransaction(transactionHash: string): Promise<any>;
  abstract getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;
  abstract getTransactionHistory(address: string): Promise<any>;
  abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

  abstract isAddress(address: string): boolean;
  abstract isSmartContract(address: string): Promise<boolean>;
  abstract resolveName(name: string | Promise<string>): Promise<null | string>;
  abstract lookupAddress(address: string | Promise<string>): Promise<null | string>;

  abstract sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;

  isSmartContractSupported(): boolean {
    return false; // Default to false - override in subclasses
  }

  /**
   * Calls a specific blockchain method.
   * @param method - The method to call.
   * @param params - The parameters for the method.
   * @returns The result of the request.
   */
  async request(method: string, params: any[]): Promise<any> {
    try {
      return await this.provider.request(method, params);
    } catch (e) {
      throw new Error(`Error calling - request - ${method}: ${e}`);
    }
  }

  /**
   * Sends a raw transaction.
   * @param signedTransaction - The signed transaction to send.
   * @returns The transaction response.
   */
  async sendRawTransaction(signedTransaction: string): Promise<TransactionResponse> {
    try {
      return await this.provider.sendRawTransaction(signedTransaction);
    } catch (e) {
      throw new Error(`Error calling - sendTransaction: ${e}`);
    }
  }

  /**
   * Sets the provider for the blockchain.
   * @param provider - The provider to set.
   * @param chainId - The chain ID to set.
   */
  setProvider(provider: Provider, chainId: number): void {
    if (!this.providers.includes(provider)) {
      throw new Error('Provider not supported');
    }
    this.provider = provider;
    this.chainId = chainId;
  }

  signTransaction(transaction: TransactionRequest): Promise<string> {
    throw new Error('Method not implemented.');
  }

  signMessage(message: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  signTypedData(transction: TransactionRequest): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * Protected method to add or override metadata.
   * @param newOptions - The new options to add or override.
   * @param overrideAll - Whether to override all existing options.
   */
  protected _updateOptions(newOptions: { [key: string]: MetaData }, overrideAll: boolean = false): void {
    if (overrideAll) {
      this.options = newOptions;
    } else {
      this.options = { ...this.options, ...newOptions };
    }
  }
}

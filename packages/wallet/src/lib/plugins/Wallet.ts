/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Provider } from '$plugins/Provider';
import type { Blockchain } from '$plugins/Blockchain';
import {
  debug_log,
  isYakklPrimaryAccount,
  type AccountInfo,
  type Transaction,
  type TransactionRequest,
  type TransactionResponse,
  type TypedDataDomain,
  type TypedDataField,
  type YakklAccount,
  type YakklPrimaryAccount
} from '$lib/common';
import eventManager from '$plugins/EventManager';
import ProviderFactory from '$plugins/ProviderFactory';
import BlockchainFactory from '$plugins/BlockchainFactory';
import { Signer } from '$plugins/Signer';
import { Ethereum, EthereumSigner } from '$plugins/blockchains';
import { writable } from 'svelte/store';
import type { GasEstimate, HistoricalGasData, GasPrediction } from '$lib/common/gas-types';
import type { Token } from '$plugins/Token';
import { TokenService } from './blockchains/evm/TokenService';

export const walletStore = writable<Wallet | null>(null);

/**
 * Wallet class to manage blockchain interactions, switching providers, and handling accounts and tokens.
 */
export class Wallet {
  private provider: Provider | null = null;
  private blockchain: Blockchain | null = null;
  private signer: Signer | null = null;
  private portfolio: Token[] = [];
  private currentToken: Token | null = null;
  private accounts: YakklAccount[] = [];
  // private currentAccount: YakklAccount | null = null;
  private apiKey: string | null = null;
  private chainId: number;
  private privateKey: string | null = null; // This is the user's private key
  private tokenService: TokenService<any> | null = null;

  /**
   * Creates an instance of Wallet.
   * @param providerNames - List of provider names.
   * @param blockchainNames - List of blockchain names.
   * @param privateKey - Optional private key for the wallet.
   */
  constructor(private providerNames: string[] = ['Alchemy'], private blockchainNames: string[] = ['Ethereum'], chainId: number = 1, apiKey: string | null = null, privateKey: string | null = null) {
    this.apiKey = apiKey;  // Set the private key if provided else use setPrivateKey method before attempting to send transactions - This is the provider API Key and not the user's private key
    this.chainId = chainId; // Have to do this before initializing the wallet
    this.setChainId(chainId);
    this.privateKey = privateKey; // This is the user's private key
    this.initialize();
    Wallet.setInstance(this); // Any change to the wallet instance should update the store
  }

  /**
 * Initializes the wallet by setting up providers and blockchains.
 */
  private initialize(): void {
    if ( this.providerNames.length > 0 ) {
      // Initialize all providers
      const providers = this.providerNames.map( name => ProviderFactory.createProvider( { name, apiKey: this.apiKey, chainId: this.chainId } ) );
      // Set the first provider as the primary provider
      this.provider = providers[ 0 ];
      // Initialize the blockchain with all providers
      const blockchainName = this.getBlockchainFromChainId( this.chainId );
      this.blockchain = BlockchainFactory.createBlockchain( blockchainName, providers );
      this.tokenService = new TokenService<any>( this.blockchain as Ethereum);
    }

    this.setupEventListeners();
    if ( this.privateKey ) {
      this.setSigner( this.privateKey );
    }
    Wallet.setInstance( this );
  }


  private static setInstance( instance: Wallet ): void {
    walletStore.set( instance );
  }

  /**
   * Adds a token to the wallet's portfolio.
   * @param token - The token to add to the portfolio.
   */
  public addTokenToPortfolio(token: Token): void {
    this.portfolio.push(token);
    Wallet.setInstance(this);
  }

  /**
   * Creates a new account.
   * @param accountToDeriveFrom - The primary account to derive from, if any.
   * @param accountInfo - Information about the account.
   * @returns The created account.
   */
  public async createAccount<T>(accountToDeriveFrom: YakklPrimaryAccount | null = null, accountInfo: AccountInfo): Promise<T> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    const newAccount = await this.blockchain.createAccount<T>(accountToDeriveFrom, accountInfo);
    if (isYakklPrimaryAccount(newAccount)) {
      this.addAccount(newAccount as unknown as YakklPrimaryAccount);
    } else {
      this.addAccount(newAccount as unknown as YakklAccount);
    }
    Wallet.setInstance(this);
    return newAccount;
  }

  /**
   * Estimates the gas required for a transaction.
   * @param transaction - The transaction to estimate gas for.
   * @returns The estimated gas.
   */
  public async estimateGas(transaction: Transaction): Promise<bigint> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.estimateGas(transaction);
  }

  /**
   * Gets the balance of an address.
   * @param address - The address to get the balance for.
   * @returns The balance of the address.
   */
  async getBalance(address: string): Promise<bigint> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.getBalance(address);
  }

  /**
   * Gets the current blockchain.
   * @returns The current blockchain.
   */
  public getBlockchain(): Blockchain | Ethereum {
    switch (this.chainId) {
      // Add other casts here
      case 1: // Mainnet
      case 11155111: // Testnet - Sepolia
      default:
        return this.blockchain as Ethereum;
    }
  }

  /**
   * Gets the current blockchain name.
   * @returns The current blockchain name.
   */
  public getBlockchainFromChainId(chainId: number): string {
    switch (chainId) {
      case 137:
        return 'Polygon';
      case 43114:
        return 'Avalanche';
      case 42161:
        return 'Arbitrum';
      case 250:
        return 'Optimism';
      case 1:
      case 11155111:
      default:
        return 'Ethereum';
    }
  }

  public getTokenService(): TokenService<any> | null {
    return this.tokenService;
  }

  public getChainId(): number {
    return this.chainId;
  }

  /**
   * Gets the current token.
   * @returns The current token.
   */
  public getCurrentToken(): Token | null {
    return this.currentToken;
  }

  /**
   * Gets the portfolio of tokens.
   * @returns The portfolio of tokens.
   */
  public getPortfolio(): Token[] {
    return this.portfolio;
  }

  /**
   * Gets the current provider.
   * @returns The current provider.
   */
  public getProvider(): Provider | null {
    return this.provider;
  }

  /**
   * Gets the transaction history for an address.
   * @param address - The address to get the transaction history for.
   * @returns The transaction history.
   */
  public async getTransactionHistory(address: string): Promise<Transaction[]> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.getTransactionHistory(address);
  }

  /**
   * Handles provider connected event.
   * @param data - Data containing provider, blockchain, and chainId.
   */
  private onProviderConnected(data: { provider: string, blockchain: string, chainId: number }): void {
    // console.log(`onConnected to ${data.provider} on ${data.blockchain} with chainId ${data.chainId}`);
    Wallet.setInstance(this);
  }

  /**
   * Handles balance fetched event.
   * @param data - Data containing address and balance.
   */
  private onBalanceFetched(data: { address: string, balance: bigint }): void {
    // console.log(`onBalance event for fetched ${data.address}: XXXXXXXX`, this.chainId);
    Wallet.setInstance(this);
  }

  /**
   * Handles provider switched event.
   * @param data - Data containing old provider and new provider.
   */
  private onProviderSwitched(data: { oldProvider: string, newProvider: string }): void {
    // console.log(`onProvider switched from ${data.oldProvider} to ${data.newProvider}`);
    Wallet.setInstance(this);
  }

  /**
   * Handles error event.
   * @param data - Data containing provider, method, and error.
   */
  private onError(data: { provider: string, method: string, error: any }): void {
    // console.log(`onError in provider ${data.provider}, method ${data.method}:`, data.error);
    Wallet.setInstance(this);
  }

  /**
   * Handles request made event.
   * @param data - Data containing provider, method, params, and result.
   */
  private onRequestMade(data: { provider: string, method: string, params: any[], result: any }): void {
    // console.log(`onRequest made to ${data.provider} with method ${data.method}:`, data.result);
    Wallet.setInstance(this);
  }

  async setChainId(chainId: number): Promise<void> {
    this.chainId = chainId;
    this.blockchain?.setChainId( chainId );
    this.provider?.setChainId( chainId );
    Wallet.setInstance(this);
  }

  /**
   * Sets the API key for the wallet provider.
   * @param apiKey - The API key to set.
   */
  setAPIKey(apiKey: string): void {
    this.apiKey =apiKey;
    Wallet.setInstance(this);
  }

  /**
   * Sets the current token by its address.
   * @param tokenAddress - The address of the token to set as current.
   */
  public setCurrentToken(tokenAddress: string): void {
    const token = this.portfolio.find(t => t.address === tokenAddress);
    if (!token) {
      throw new Error(`Token with address ${tokenAddress} not found in portfolio`);
    }
    this.currentToken = token;
    this.provider = token.provider;
    this.blockchain = token.blockchain;
    Wallet.setInstance(this);
  }

  /**
   * Sets up event listeners for the wallet.
   */
  private setupEventListeners(): void {
    eventManager.on('balanceFetched', this.onBalanceFetched.bind(this));
    eventManager.on('error', this.onError.bind(this));
    eventManager.on('providerConnected', this.onProviderConnected.bind(this));
    eventManager.on('providerSwitched', this.onProviderSwitched.bind(this));
    eventManager.on('requestMade', this.onRequestMade.bind(this));
    Wallet.setInstance(this);
  }

  /**
   * Sets the signer for the wallet based on the current token and private key.
   */
  public setSigner(privateKey: string | null): Promise<Signer> | null {
    try {
      if (!this.blockchain) {
        console.log( 'Blockchain is not initialized yet' );
        return null;
      }
      if (!this.provider) {
        console.log( 'Provider is not initialized yet' );
        return null;
      }
      // privateKey can be null if the system is initializing so we simply log and return
      if (!privateKey && !this.privateKey) {
        console.log('No private key provided yet');
        return null;
      }
      switch ( this.blockchain.name ) { //this.currentToken.blockchain.name) {
        case 'Ethereum':
          this.signer = new EthereumSigner(privateKey, this.provider);
          break;
        // case 'Polygon':
        //   this.signer = new PolygonSigner(this.privateKey);
        //   break;
        // case 'Optimism':
        //   this.signer = new OptimismSigner(this.privateKey);
        //   break;
        // case 'Arbitrum':
        //   this.signer = new ArbitrumSigner(this.privateKey);
        //   break;
        // case 'Avalanche':
        //   this.signer = new AvalancheSigner(this.privateKey);
        //   break;
        // case 'Base':
        //   this.signer = new BaseSigner(this.privateKey);
        //   break;
        // case 'Celo':
        //   this.signer = new CeloSigner(this.privateKey);
        //   break;
        // case 'Bitcoin':
        //   this.signer = new BitcoinSigner(this.privateKey);
        //   break;
        // case 'Solana':
        //   this.signer = new SolanaSigner(Uint8Array.from(Buffer.from(this.privateKey, 'base64')));
        //   break;
        // case 'Aptos':
        //   this.signer = new AptosSigner(this.privateKey);
        //   break;
        default:
          throw new Error(`Unsupported blockchain: ${this.blockchain.name}`);  //${this.currentToken.blockchain.name}`);
      }
      if (this.signer) {
        this.privateKey = privateKey; // Set the private key for the user for signing transactions of the current token.
        Wallet.setInstance(this);
        this.provider.setSigner(this.signer);
        return Promise.resolve(this.signer);
      } else {
        throw new Error('Signer could not be created');
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  public getSigner(): Signer | null {
    return this.signer;
  }

  // SwitchNetwork is implemented with setChainId since the provider and blockchain remain the same.

  /**
   * Switches to a different provider.
   */
  public switchProvider(): void {
    debug_log('Wallet: Switching provider');
    if (!this.blockchain || !this.provider) {
      throw new Error('Blockchain or Provider not initialized');
    }

    const availableProviders = this.providerNames.map(name => ProviderFactory.createProvider({name, apiKey: this.privateKey, chainId: this.chainId})) // Create instances of all available providers using defaults
      .filter(provider => provider.blockchains.includes(this.blockchain!.name));

    const newProvider = availableProviders.find(provider => provider !== this.provider);
    if (newProvider) {
      const chainId: number = this.provider.chainId;
      const oldProviderName: string = this.provider.name;

      this.provider = newProvider;
      this.blockchain.connect(newProvider, chainId);
      eventManager.emit('providerSwitched', { oldProvider: oldProviderName, newProvider: newProvider.name });
      Wallet.setInstance(this);
    }
  }

  /**
   * Switches to a specific provider by name or instance.
   * @param providerOrName - The provider name or instance to switch to.
   */
  public switchToProvider(providerOrName: string | Provider): void {
    debug_log('Wallet: Switching to provider');
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    let newProvider: Provider | null | undefined = null;

    if (typeof providerOrName === 'string') {
      const availableProviders = this.providerNames.map(name => ProviderFactory.createProvider({ name, apiKey: this.privateKey, chainId: this.chainId})) // Create instances of all available providers using defaults
        .filter(provider => provider.blockchains.includes(this.blockchain!.name));
      if (!availableProviders.length) {
        throw new Error('No available providers for this blockchain');
      }
      newProvider = availableProviders.find(provider => provider !== this.provider);
      if (!newProvider) {
        newProvider = ProviderFactory.createProvider({ name: providerOrName });
      }
    } else {
      newProvider = providerOrName;
    }

    if (!newProvider) {
      throw new Error(`Provider ${typeof providerOrName === 'string' ? providerOrName : 'unknown'} could not be created or is invalid.`);
    }

    if (!newProvider.blockchains.includes(this.blockchain.name)) {
      throw new Error(`Provider ${newProvider.name} does not support blockchain ${this.blockchain.name}`);
    }

    if (newProvider !== this.provider) {
      const chainId: number = this.provider?.chainId || this.blockchain.chainId;
      const oldProvider = this.provider;
      this.provider = newProvider;
      this.blockchain.connect(newProvider, chainId);
      eventManager.emit('providerSwitched', { oldProvider: oldProvider?.name, newProvider: newProvider.name });
      Wallet.setInstance(this);
    }
  }

  /**
   * Sends a transaction.
   * @param transaction - The transaction request to send.
   * @returns The transaction response.
   */
  async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    if (!this.signer) {
      if (!this.privateKey) {
        throw new Error('Private key not set');
      } else {
        debug_log('Setting signer with private key - again!! :', this.privateKey);

        await this.setSigner(this.privateKey);
      }
    }

    if (!this.blockchain || !this.provider || !this.signer) {
      console.log('Blockchain, Provider, Signer:', this.blockchain, this.provider, this.signer);
      throw new Error('Blockchain or Provider or Signer not initialized');
    }

    // Implement gas estimation - Found an issue the FeeProvider model (not complete).
    // const gasEstimate = await this.blockchain.getGasEstimate(transaction);

    // Apply the gas estimate to the transaction
    // transaction.gasLimit = gasEstimate.gasLimit;
    // transaction.maxFeePerGas = gasEstimate.feeEstimate.totalFee;
    // transaction.maxPriorityFeePerGas = gasEstimate.feeEstimate.priorityFee;

    debug_log('Sending transaction to provider:', transaction);

    return await this.blockchain.sendTransaction(transaction);
  }

  /**
   * Signs typed data.
   * @param domain - The domain for the typed data.
   * @param types - The types for the typed data.
   * @param value - The value of the typed data.
   * @returns The signed data.
   */
  public async signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }

    if (typeof (this.signer as any).signTypedData === 'function') {
      return await (this.signer as EthereumSigner).signTypedData(domain, types, value);
    } else {
      throw new Error('signTypedData is not supported for the current blockchain signer');
    }
  }

  /**
   * Adds an account to the wallet.
   * @param account - The account to add.
   */
  public addAccount(account: YakklAccount | YakklPrimaryAccount): void {
    if (isYakklPrimaryAccount(account)) {
      // If it's a primary account, add its main account part
      this.accounts.push(account.account);
      // account.subAccounts.forEach(subAccount => this.accounts.push(subAccount));
    } else {
      // If it's a regular account
      this.accounts.push(account);
    }
    Wallet.setInstance(this);
  }

  /**
   * Gets an account by its address.
   * @param address - The address of the account to get.
   * @returns The account, if found.
   */
  public getAccount(address: string): YakklAccount | undefined {
    return this.accounts.find(account => account.address === address);
  }

  /**
   * Removes an account by its address.
   * @param address - The address of the account to remove.
   */
  public removeAccount(address: string): void {
    this.accounts = this.accounts.filter(account => account.address !== address);
    Wallet.setInstance(this);
  }

  async getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.getGasEstimate(transaction);
  }

  async getHistoricalGasData(duration: number): Promise<HistoricalGasData[]> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.getHistoricalGasData(duration);
  }

  async predictFutureFees(duration: number): Promise<GasPrediction[]> {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }
    return await this.blockchain.predictFutureFees(duration);
  }
}


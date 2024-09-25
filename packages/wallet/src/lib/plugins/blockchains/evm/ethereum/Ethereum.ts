/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { type AccountData, type AccountInfo, type Deferrable, type EthereumTransaction, type MetaData, type TransactionReceipt, type TransactionRequest, type TransactionResponse, type YakklAccount, type YakklPrimaryAccount, type Block, type BlockTag, type BlockWithTransactions, type Filter, type Log, type PrimaryAccountData, AccountTypeCategory, VERSION, type Network, NetworkType, type BigNumberish } from '$lib/common';
import { dateString } from '$lib/common/datetime';
// import type { Signer } from '$lib/plugins/Signer';
import { AbstractBlockchain, type ContractInterface } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';
import { ethers } from 'ethers';
import { EthereumContract } from './EthereumContract';
import type { AbstractContract } from '$lib/plugins/Contract';


const networks: Network[] = [
  {
    blockchain: 'Ethereum',
    name: 'Mainnet',
    chainId: 1,
    symbol: 'ETH',
    type: NetworkType.MAINNET,
    explorer: 'https://etherscan.io',
    decimals: 18,
  },
  {
    blockchain: 'Ethereum',
    name: 'Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    type: NetworkType.TESTNET,
    explorer: 'https://sepolia.etherscan.io',
    decimals: 18,
  },
]

export class Ethereum extends AbstractBlockchain<EthereumTransaction> {
  _options: MetaData | undefined;

  constructor(providers: Provider[], chainId: number = 1,  options: { [key: string]: MetaData } = {}, overrideAll: boolean = false) {
    super('Ethereum', chainId, providers, networks, 'ETH', '/images/ethereum_icon_purple.svg');
    this.chainId = chainId;
    this.options = options;
    this._updateOptions(options, overrideAll);
    this._options = this.getOptions('ethereum');
  }

  async createAccount<T>(accountToDeriveFrom: YakklPrimaryAccount | null = null, accountInfo: AccountInfo): Promise<T> {
    if (accountToDeriveFrom === null) {
      return this.createPrimaryAccount(accountInfo) as unknown as T;
    } else {
      if (!accountInfo.path) throw new Error('Derive Path is missing from the account info');
      return this.createSubAccount(accountToDeriveFrom, accountInfo.path) as unknown as T;
    }
  }

  async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<bigint> {
    return await this.provider.estimateGas(transaction);
  }

  async getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<bigint> {
    return await this.provider.getBalance(addressOrName, blockTag !== undefined ? blockTag : 'latest');
  }

  async getBlock(blockHashOrBlockTag: BlockTag | Promise<BlockTag>): Promise<Block> {
    throw new Error('Method not implemented.');
  }

  async getBlockNumber(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async getBlockWithTransactions(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<BlockWithTransactions> {
    throw new Error('Method not implemented.');
  }

  async getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getFeeData(): Promise<any> {
    return await this.provider.getFeeData();
  }

  async getGasPrice(): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  async getLogs(filter: Filter): Promise<Array<Log>> {
    throw new Error('Method not implemented.');
  }

  async getStorageAt( addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag> ): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }

  async signTypedData( transction: TransactionRequest ): Promise<string> {
    throw new Error( 'Method not implemented.' );
  }

  async getTransaction(transactionHash: string): Promise<EthereumTransaction> {
    return await this.provider.getTransaction(transactionHash);
  }

  async getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number> {
    return await this.provider.getTransactionCount(addressOrName, blockTag);
  }

  async getTransactionHistory(address: string): Promise<any> {
    return await this.provider.getTransactionHistory(address);
  }

  async getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt> {
    return await this.provider.getTransactionReceipt(transactionHash);
  }

  isAddress(address: string): boolean {
    const ethereumRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    let returnValue = ethereumRegex.test(address);
    if (!returnValue) {
      const ensRegex = /^.*\.eth$/;
      returnValue = ensRegex.test(address);
    }
    return returnValue;
  }

  async isSmartContract(address: string): Promise<boolean> {
    let contractCode: string | null;
    try {
      contractCode = await this.provider.getCode(address);
    } catch (e) {
      contractCode = null;
    }
    return (contractCode && contractCode !== '0x' && contractCode !== '0x0') as boolean;
  }

  isSmartContractSupported(): boolean {
    return true;  // Ethereum supports smart contracts
  }
  
  async request(method: string, params: any[]): Promise<any> {
    return await this.provider.request(method, params);
  }

  async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    return await this.provider.sendTransaction(transaction);
  }

  async sendRawTransaction(signedTransaction: string): Promise<TransactionResponse> {
    return await this.provider.sendRawTransaction(signedTransaction);
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    return this.provider.signTransaction(transaction);
  }

  async signMessage(message: string): Promise<string> {
    return this.provider.signMessage(message);
  }

  private async createPrimaryAccount(accountInfo: AccountInfo): Promise<YakklPrimaryAccount> {
    const entropy = ethers.randomBytes(32);
    const randomMnemonic = ethers.Mnemonic.fromEntropy(entropy);
    const ethWallet = ethers.HDNodeWallet.fromMnemonic(randomMnemonic, accountInfo.path);

    const accountData: AccountData = {
      extendedKey: ethWallet.extendedKey,
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      publicKeyUncompressed: ethWallet.publicKey,//ethWallet.signingKey.publicKey,
      path: ethWallet.path ? ethWallet.path : accountInfo.path,     
      pathIndex: accountInfo.index,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: ethWallet.parentFingerprint,
      chainCode: ethWallet.chainCode,
      assignedTo: [],    // Who are the parties that have responsibility for this account
    };

    const yakklAccount: YakklAccount = {
      id: accountInfo.id,
      index: accountInfo.index,
      blockchain: 'Ethereum',
      smartContract: false,
      address: ethWallet.address,
      alias: '',
      accountType: AccountTypeCategory.PRIMARY,
      name: !accountInfo.accountName ? `Portfolio Level Account ${accountInfo.index+1}` : accountInfo.accountName,
      description: '',
      primaryAccount: null,  // If subaccount then it must be a valid primaryaccount else undefined
      data: accountData,
      value: 0n, 
      class: "Default",  // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
      level: 'L1',
      isSigner: true,
      avatar: '', // Default is identityicon but can be changed to user/account avatar
      tags: ['Ethereum', 'primary'],
      includeInPortfolio: true,   // This only applys to the value in this primary account and not any of the derived accounts from this primary account
      connectedDomains: [],
      version: VERSION,
      createDate: dateString(),
      updateDate: dateString(),
    };


    const primaryAccountData: PrimaryAccountData = {
      extendedKey: ethWallet.extendedKey,
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      publicKeyUncompressed: ethWallet.publicKey,
      path: ethWallet.path ? ethWallet.path : accountInfo.path,
      pathIndex: accountInfo.index,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: ethWallet.parentFingerprint,
      chainCode: ethWallet.chainCode,
      mnemonic: randomMnemonic.phrase,
      entropy: entropy,
      password: ethWallet.mnemonic?.password,
      wordCount: ethWallet.mnemonic?.phrase.split(" ").length || 24,
      wordListLocale: ethWallet.mnemonic?.wordlist.locale || 'en',
    };

    const primaryAccount: YakklPrimaryAccount = {
      id: accountInfo.id,
      name: 'Primary Account',
      address: ethWallet.address,
      value: 0n,
      index: 0,
      data: primaryAccountData,
      account: {} as YakklAccount,
      subIndex: 0,
      subAccounts: [] as YakklAccount[],
      version: VERSION, 
      createDate: dateString(),
      updateDate: dateString(),
    }

    return primaryAccount;
  }

  private async createSubAccount(primaryAccount: YakklPrimaryAccount, derivedPath: string): Promise<YakklAccount> {
    const mnemonic = (primaryAccount.data as PrimaryAccountData).mnemonic;
    if (!mnemonic) throw new Error('Mnemonic is missing from the primary account data');

    const ethWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, derivedPath);

    const accountData: AccountData = {
      extendedKey: ethWallet.extendedKey,
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      publicKeyUncompressed: ethWallet.publicKey,
      path: ethWallet.path as string,
      pathIndex: primaryAccount.subIndex + 1,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: (primaryAccount.data as PrimaryAccountData).fingerPrint,
      chainCode: '',
      assignedTo: [],
    };

    const subAccount: YakklAccount = {
      id: '1',  // TODO: Generate a unique ID
      index: primaryAccount.subIndex + 1,
      blockchain: 'Ethereum',
      smartContract: false,
      address: ethWallet.address,
      alias: 'New Sub Account',
      accountType: AccountTypeCategory.SUB,
      name: 'Sub Account Name',
      description: 'Description of the sub account',
      primaryAccount: primaryAccount,
      data: accountData,
      value: 0n,
      class: 'standard',
      level: 'L1',
      isSigner: true,
      avatar: 'default-avatar.png',
      tags: [],
      includeInPortfolio: true,
      connectedDomains: [],
      version: '1.0',
      createDate: new Date().toISOString(),
      updateDate: new Date().toISOString(),
    };

    return subAccount;
  }

  async resolveName(name: string | Promise<string>): Promise<null | string> {
    return this.provider.resolveName(name);
  }

  async lookupAddress(address: string | Promise<string>): Promise<null | string> {
    return this.provider.lookupAddress(address);
  }

  createContract(address: string, abi: any[]): AbstractContract {
    return new EthereumContract(address, abi, this.provider);
  }
  
  // Contract = class implements ContractInterface {
  //   private ethersContract: ethers.Contract;

  //   constructor(address: string, abi: any[], signerOrProvider: Provider | Signer) {
  //     this.ethersContract = new ethers.Contract(address, abi, signerOrProvider as any);
  //   }

  //   get address(): string {
  //     return this.ethersContract.target as string;
  //   }

  //   get abi(): readonly any[] {
  //     return this.ethersContract.interface.fragments;
  //   }

  //   get functions(): Record<string, (...args: any[]) => Promise<any>> {
  //     const functions: Record<string, (...args: any[]) => Promise<any>> = {};
  //     for (const [name, func] of Object.entries(this.ethersContract.functions)) {
  //       functions[name] = (...args: any[]) => (func as any)(...args);
  //     }
  //     return functions;
  //   }

  //   // Add a method to directly call contract functions
  //   async call(functionName: string, ...args: any[]): Promise<any> {
  //     if (typeof this.ethersContract[functionName] !== 'function') {
  //       throw new Error(`Function ${functionName} does not exist on the contract`);
  //     }
  //     return await this.ethersContract[functionName](...args);
  //   }
  // }

  // async getContract(address: string, abi: any[]): Promise<ContractInterface> {
  //   return new this.Contract(address, abi, this.provider);
  // }
}

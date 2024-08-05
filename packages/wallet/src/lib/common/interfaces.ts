/* eslint-disable @typescript-eslint/no-explicit-any */
// Interface definitions

import type { Blockchain, Provider } from '$lib/plugins';
import type { AccessList, Log, Transaction } from '$lib/common/evm';
import type { AccountTypeCategory, BytesLike, NetworkType, RegistrationType, SystemTheme, URL } from '$lib/common/types';
import type { BigNumberish } from '$lib/common/bignumber';

// Ethereum JSON-RPC request arguments
export interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt?: string;
}

// EmergencyKit data for each address. SubPortfolio will be empty if it's a primary account. Every SubPortfolio will have a Portfolio address and name.
// This is always encrypted.
export interface EmergencyKitAccountData {
  id: string;
  registered: YakklRegisteredData;
  email: string;
  userName: string;
  blockchain: string;
  portfolioAddress: string;
  portfolioName: string;
  subPortfolioAddress?: string;
  subPortfolioName?: string;
  privateKey: string;
  mnemonic: string;
  createDate: string;
  updateDate: string;
  version: string;
  hash?: string; // Checksum hash of the data
}

export interface EmergencyKitMetaData {
  id: string;
  createDate: string;
  updateDate: string;
  version: string;
  type: string;
  registeredType: string;
  portfolioName?: string;
  subPortfolioName?: string;
  subPortfolioAddress?: string;
  hash?: string;
}

export interface EmergencyKitData {
  id: string;
  data: EncryptedData;
  accounts: EmergencyKitAccountData[];
  meta?: EmergencyKitMetaData;
  cs: string; // Checksum for the overall data
}

export interface HasData<T> {
  data: T;
}

export interface MetaData {
  [key: string]: string | number | boolean | object | null;
}

export interface MetaDataParams {
  title: string;
  icon: URL;
  domain: string;
  context: string; 
  message?: string;
  transaction?: unknown;
}

export interface Signer {
  signTransaction(transaction: Transaction): Promise<string>;
  signMessage(message: string): Promise<string>;
}

/**
 *  The domain for an [[link-eip-712]] payload.
 */
export interface TypedDataDomain {
  /**
   *  The human-readable name of the signing domain.
   */
  name?: string;

  /**
   *  The major version of the signing domain.
   */
  version?: string;

  /**
   *  The chain ID of the signing domain.
   */
  chainId?: bigint;

  /**
   *  The the address of the contract that will verify the signature.
   */
  verifyingContract?: string;

  /**
   *  A salt used for purposes decided by the specific domain.
   */
  salt?: BytesLike;
};

/**
*  A specific field of a structured [[link-eip-712]] type.
*/
export interface TypedDataField {
  /**
   *  The field name.
   */
  name: string;

  /**
   *  The type of the field.
   */
  type: string;
};

export interface BaseTransaction {
  hash?: string;
  to: string;
  from: string;
  nonce?: number;
  gasLimit?: BigNumberish | null | undefined;
  gasPrice?: BigNumberish | null | undefined;
  data?: BytesLike;
  value: BigNumberish | null;
  chainId: number;
  r?: string;
  s?: string;
  v?: number;
  type?: number | null;
  accessList?: AccessList;
  maxPriorityFeePerGas?: BigNumberish | null | undefined;
  maxFeePerGas?: BigNumberish | null | undefined;
  customData?: Record<string, any>;
  ccipReadEnabled?: boolean;
}

export interface TransactionReceipt {
  to: string;
  from: string;
  contractAddress?: string,
  transactionIndex: number,
  root?: string,
  gasUsed: BigNumberish,
  logsBloom: string,
  blockHash: string,
  transactionHash: string,
  logs: Array<Log>,
  blockNumber: number,
  confirmations: number,
  cumulativeGasUsed: BigNumberish,
  effectiveGasPrice?: BigNumberish,
  byzantium?: boolean,
  type: number;
  status?: boolean
}

export interface TransactionResponse extends Transaction {
  hash: string;

  // Only if a transaction has been mined
  blockNumber?: number,
  blockHash?: string,
  timestamp?: number,
  status?: boolean

  confirmations: number,

  // Not optional (as it is in Transaction)
  from: string;

  // The raw transaction
  raw?: string,

  // This function waits until the transaction has been mined
  wait: (confirmations?: number) => Promise<TransactionReceipt>
}

export interface EstimatedPrice {
  confidence: number;
  price: number;
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

export interface BlockPrice {
  blockNumber: number;
  estimatedTransactionCount: number;
  baseFeePerGas: number;
  estimatedPrices: EstimatedPrice[];
}

export interface BlocknativeResponse {
  blockPrices: BlockPrice[];
}

export interface GasFeeTrend {
  blocknumber: number;
  baseFeePerGas: number;
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
  timestamp: number;
}

export interface GasTransStore {
  provider: string | null;
  id: NodeJS.Timeout | undefined;
  results: {
    blockNumber: number;
    estimatedTransactionCount: number;
    gasProvider: string;
    actual: {
      baseFeePerGas: number;
      fastest: { maxPriorityFeePerGas: number; maxFeePerGas: number };
      faster: { maxPriorityFeePerGas: number; maxFeePerGas: number };
      fast: { maxPriorityFeePerGas: number; maxFeePerGas: number };
      standard: { maxPriorityFeePerGas: number; maxFeePerGas: number };
      slow: { maxPriorityFeePerGas: number; maxFeePerGas: number };
    };
    gasFeeTrend: {
      baseFeePerGasAvg: number;
      mostRecentFees: GasFeeTrend[];
    };
  };
}

export interface Legal {
  termsAgreed: boolean;
  privacyViewed: boolean;
  updated: boolean;
}

export interface Platform {
  arch: string;
  nacl_arch?: string;
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  platform: string;
}

// Evaluate the need for these interfaces
export interface TransactionsRetry {
  enabled: boolean;
  howManyAttempts: number;
  seconds: number;
  baseFeeIncrease: number; // percentages
  priorityFeeIncrease: number; // percentages
}

export interface TransactionsRetain {
  enabled: boolean;
  days: number;
  includeRaw: boolean;
}

export interface Transactions {
  retry: TransactionsRetry;
  retain: TransactionsRetain;
}
// End - Evaluate the need for these interfaces

export interface Token {
  name: string;
  address: string;
  symbol: string;
  blockchain: Blockchain;
  provider: Provider;
  privateKey?: string;
}

export interface Extension {
  id: string;
  name: string;
  enabled: boolean;
  // Define additional properties as needed
}

export interface Currency {
  code: string;
  symbol: string;
}

export interface YakklWallet {
  title: string;
  extensionHeight: number;
  popupHeight: number;
  popupWidth: number;
  enableContextMenu: boolean;
  enableResize: boolean;
  splashDelay: number;
  alertDelay: number;
  splashImages: number;
  autoLockTimer: number; // In seconds - if 0 then it will autolock on system 'idle'
  autoLockAsk: boolean; // If true then it will prompt to ask the user to continue
  autoLockAskTimer: number; // If autoLockAsk true then this timer will keep the dialog and app open this many more seconds before locking automatically via timeout
  animationLockScreen: boolean;
  pinned: boolean;
  pinnedLocation: string; // 'TL' | 'TR' | 'BL' | 'BR' | 'M' or 'x,y' coordinates
  defaultWallet: boolean; // This can be cutoff in preferences/wallet. It allows any reference to 'window.ethereum' or others to only popup Yakkl
}

export interface Theme {
  name: string;
  animation: {
    lockScreen: string;
  };
  colors: {
    primary: string;
    secondary: string;
    primaryBackgroundLight: string;
    primaryBackgroundDark: string;
  };
}

export interface Protocol {
  type: string;
  url: string;
}

export interface DataKeys {
  key: string;
  chainId: string;
  blockchain: string;
}

export interface Data {
  keys: DataKeys;
  protocols: Protocol[];
}

export interface YakklProvider {
  provider: string; // If name is 'yakkl' then yakkl cloud is the provider and we're going direct to the given blockchains
  blockchain: string;
  name: string;
  chainId: number; // Have to look up the 'name' from yakklNetworks and 'key' from process.env
  weight: number; // Weight 1-5 with 5 being the provider to use the most - this only applies to mainnets. Testnets all have a weight of 0
  data: Data; // encrypted
  version: string; // Travels with the data for upgrades
}

// The networks of a given blockchain. For example, ETH - mainnet, ropsten, rinkeby, kovan, goerli, etc
export interface Network {
  blockchain: string; // Ethereum - This is redundant but its useful for the UI
  name: string; // Mainnet, Sepolia, etc.
  chainId: number;
  symbol: string; // Example: 'ETH' This is redundant but its useful for the UI
  type: NetworkType; // 'mainnet' | 'testnet' | 'private' | 'sidechain' | 'layer2' | 'other';
  explorer: URL; // URL to the explorer for the given network type of the blockchain
  decimals: number; // Decimals for the blockchain
}

export interface EnhancedSecurity {
  enabled: boolean; // We have this off so that user makes a decision to enable it
  rotationDays?: number;
  lastRotationDate?: string; // It will not force a pwd change but will keep prompting until they do
  passKey?: string;
  passKeyHints?: string[];
  mfaType?: string;
  phone?: string;
}

export interface YakklSecurity {
  type: string; //'PWD' | '2FA' | 'Passkey';
  value: string;
  enhancedSecurity?: EnhancedSecurity;
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

// Premature at this time
export interface Company {
  name: string;
  formedDate: string;
  type: string;
  registeredCountries: string[];
  registeredRegions: string[];
}

export interface Name {
  prefix?: string;
  first: string;
  middle?: string;
  last: string;
  suffix?: string;
}

export interface NaturalPerson {
  sex: string;
  dateOfBirth: string;
  idPhoto: boolean;
}

export interface Document {
  id: string;
  type: string;
  fileName: string;
  created: string;
  expires: string;
  updated: string;
  store?: string;
}

export interface PrimaryPhone {
  country: string;
  number: string;
  type?: string;
  sms?: boolean; // true/false
}

export interface PrimaryAddress {
  add1: string;
  add2?: string;
  city: string;
  region?: string; // State/prov...
  country: string;
  postal: string;
}

export interface YakklBlocked {
  domain: string;
}

export interface YakklRegisteredData {
  key: string;
  type: RegistrationType; // Consider using a union type if there are specific allowed values
  version: string;
  createDate: string;
  updateDate: string;
}

export interface WatchListItem {
  id: string;
  name: string;
  address: string;
  blockchain: string;
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface YakklWatch {
  id: string; // Profile id
  blockchain: string;
  name: string;
  tags?: string[];
  value: BigNumberish; 
  includeInPortfolio: boolean;
  explorer?: string;
  address: string;
  addressAlias?: string;
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface ProfileData {
  name: Name;
  email: string;
  registered: YakklRegisteredData;
  digest: string;
  pincode: string;
  sig?: string;
  security?: YakklSecurity;
  value: BigNumberish; 
  accountIndex: number;
  primaryAccounts: YakklPrimaryAccount[];
  importedAccounts: YakklAccount[]; // Independent accounts - These accounts have no relation to any primary or subaccount but do use the account model
  watchList: YakklWatch[]; // If you want to see data from any of your other centralized exchanges or something different
  meta?: unknown | null | undefined; // This is a placeholder for any additional data that is not part of the standard profile
}

export interface Profile {
  id: string; // Must be unique - used where there is an 'id'
  userName: string; // Must be unique - not encrypted
  preferences: Preferences;
  data: EncryptedData | ProfileData | Promise<ProfileData>; // Properties that are encrypted when stored
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface Preferences {
  id: string;
  idleDelayInterval: number; // System default of 1 minute - this is in seconds
  showTestNetworks?: boolean;
  dark: SystemTheme; //'dark' | 'light' | 'system';
  chart?: string;
  screenWidth: number; // These two change. They are here for temporary but we're already using settings for the popup
  screenHeight: number;
  idleAutoLock: boolean;
  idleAutoLockCycle: number; // 3 minutes
  locale: string;
  currency: Currency;
  words: number; // Default number of words - may not enable in the UI - 24 words= 12 words, 32 words= 24 words
  wallet: YakklWallet;
  theme?: string;
  themes?: Theme[];
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface Settings{
  id: string; // Profile id
  previousVersion?: string;
  registeredType: string; // This data comes from yakklRegisteredData.type
  legal: Legal;
  platform: Platform;
  init: boolean;
  showHints?: boolean;
  isLocked: boolean;
  isLockedHow: string; // 'internal' | 'idle_system' | 'idle_timer' | 'user'
  transactions?: Transactions; // Settings for transaction retries, etc. (not the actual transaction since that is held on the blockchain)
  meta?: MetaData; // Meta is currently not used
  upgradeDate?: string;
  lastAccessDate: string;
  version: string; // Uses semversion format but puts 'default' as a placeholder
  createDate: string;
  updateDate: string;
}

export interface YakklChat {
  id: string;
  text: string;
  sender: string;
  usage?: {
    prompt_tokens?: number,
    completion_tokens?: number,
  },
  timestamp?: string;
  version: string;
  createDate: string;
  updateDate: string;
}

export interface PreferencesShort {
  locale: string;
  currency: Currency;
}

export interface ProfileShort {
  userName: string;
  name: Name | null;
  email?: string;
}

export interface Shortcuts {
  value: BigNumberish; // Account value 
  accountType: AccountTypeCategory; // primary, imported, sub
  accountName: string;
  smartContract: boolean;
  address: string;
  alias?: string;
  primary: YakklPrimaryAccount | null;
  init: boolean;
  legal: boolean;
  isLocked: boolean;
  showTestNetworks: boolean;
  profile: ProfileShort;
  gasLimit: number; //21_000 | 45_000; // 21000 for EOA and 45000 for smart contracts
  networks: Network[]; // This is the network object array for a given blockchain and comes from the blockchain object!
  network: Network; // This is the network object for a given blockchain and comes from the blockchain object! Network encapsulates the chainId, symbol, explorer, type, and name
  blockchain?: string; //'Ethereum';
  type?: string; // Mainnet
  chainId?: number; // 1
  symbol?: string; //'ETH';
  explorer?: string; // https://etherscan.io/ example
}

export interface CurrentlySelectedData {
  // providerKey?: string; // TODO: May can remove this with the new provider model!!!! If we remove here then remove everywhere
  profile?: Profile | Promise<Profile>;
  primaryAccount?: YakklPrimaryAccount | null; // | undefined | null;
  account?: YakklAccount;
  rawData?: unknown; // Hex format, mainly used for smart contracts
}

export interface YakklCurrentlySelected {
  id: string; // Profile id
  shortcuts: Shortcuts;
  preferences: PreferencesShort;
  data: EncryptedData | CurrentlySelectedData | Promise<CurrentlySelectedData>; // Properties that are encrypted when stored
  version: string; // Travels with the data and mainly used for upgrades
  createDate: string;
  updateDate: string;
}

export interface AccountData {
  extendedKey?: string;
  privateKey: string;
  publicKey: string;
  publicKeyUncompressed?: string;
  path?: string;
  pathIndex?: number;
  fingerPrint?: string;
  parentFingerPrint?: string;
  chainCode?: string;  // Aids in deriving accounts/keys from the extended key on some blockchains
  assignedTo?: string[]; // Who are the parties that have responsibility for this account
}

export interface YakklAccount {
  id: string; // Profile id
  index: number;
  blockchain: string; // Primary blockchain (example: Ethereum)  
  smartContract: boolean; // SmartContracts do not have private keys and the price per gas unit is usually 45,000 instead of 21,000
  address: string; // Must be unique
  alias: string;
  accountType: AccountTypeCategory; //'imported' | 'sub' | 'primary' | 'NA';
  name: string;
  description: string; // Can use this to describe an account associated with an NFT or RWA (Real World Asset) or class
  primaryAccount: YakklPrimaryAccount | null; // If the account is a primary account then this is empty
  data: EncryptedData | AccountData; // anything with 'data' as a property then the content will be encrypted
  value: BigNumberish; // Value is used as a placeholder and adjusted as needed for display and calculations - dynamic
  class?: string; // Used for enterprise environments
  level?: string; // L1
  isSigner?: boolean;
  avatar: string; // Default is identityicon but can be changed to user/account avatar
  tags?: string[];
  includeInPortfolio: boolean; // This only applies to the value in this primary account and not any of the derived accounts
  // explorer?: string; // Remove later - moved to network
  connectedDomains: string[];
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface AccountInfo {
  id: string;
  index: number;
  accountName: string;
  path: string;
}

export interface PrimaryAccountData {
  extendedKey: string;
  privateKey: string;
  publicKey: string;
  publicKeyUncompressed?: string;
  path: string | null;
  pathIndex: number;
  fingerPrint?: string;
  parentFingerPrint?: string;
  chainCode?: string;  // Aids in deriving accounts/keys from the extended key on some blockchains
  mnemonic: string | null | undefined; // Mnemonic phrase
  entropy: string | Uint8Array | undefined; // Entropy used to create the mnemonic
  password?: string | undefined; // Not yakkl password but address creation password if there is one
  wordCount: number | undefined; // 12, 24, 48
  wordListLocale: string | undefined; // locale used for account creation may be different from current locale
}

export interface YakklPrimaryAccount {
  id: string; // Profile id
  name: string; // account name, address, and keys are here for convenience - they are also in the yakklAccount record
  address: string;
  value: BigNumberish;  // Value is used as a placeholder and adjusted as needed for display and calculations - dynamic
  index: number; // for primary path account index
  data: EncryptedData | PrimaryAccountData; // anything with 'data' as a property then the content will be encrypted
  account: YakklAccount; // Primary
  subIndex: number; // for indexing the path for derived - sub accounts
  subAccounts: YakklAccount[]; // yakklAccounts
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface PrimaryAccountReturnValues {
  currentlySelected: YakklCurrentlySelected;
  primaryAccount: YakklPrimaryAccount;
}

// Address information for the dApp on connected domains
export interface AccountAddress {
  address: string;
  name: string;
  alias: string;
  blockchain: string;
  chainId: number; // May only want the dapp to access a specific chainId (testnet)
}

// This is only for the Dapp address dialog
export interface ConnectedDomainAddress extends AccountAddress{
  checked: boolean; // Checkbox checked if true
}

export interface YakklConnectedDomain {
  id: string;
  addresses: AccountAddress[]; // Array of address objects
  name: string; // Name of dApp/site
  permissions: string[]; // What permissions has Yakkl allowed for this connected domain
  domain: string;
  icon: string;
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
}

export interface YakklContact {
  id: string;
  name: string;
  address: string;
  addressType: string; //'EOA' | 'SC'; // EOA or SC
  avatar?: string;
  blockchain: string; // Ethereum
  alias?: string;
  note?: string; // Note on the contact for anything you wish to keep
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
  meta?: MetaData; // Flexible type-safe approach for meta data
}

export interface Media {
  type: string; // 'image' | 'video' | 'audio';
  url: string;
}

export interface YakklNFT {
  id: string;
  name: string;
  description?: string;
  token?: string;
  thumbnail?: string;
  blockchain?: string;
  media?: Media[];
  contract?: string;
  owner?: string;
  transferDate?: string;
  version: string; // Travels with the data for upgrades
  createDate: string;
  updateDate: string;
  meta?: MetaData;
}



// Begin - may remove this section
// export interface TransactionDetail {
//   // Define properties based on the expected structure of the details
//   // For example:
//   blockNumber: string;
//   transactionIndex: number;
//   from: string;
//   to: string;
//   value: string;
//   gasUsed: string;
//   // Add more properties as necessary
// }

// export interface YakklTransactionDetail extends TransactionDetail {};

// export interface Transaction_original {
//   status: string; //'error' | 'pending' | 'dropped' | 'replaced' | 'Dropped & Replaced' | 'mined';
//   message: string; // Only applies to 'error', 'pending', 'dropped'
//   type: string; //'send' | 'receive';
//   to: string; // Address sent to
//   toType: string; //'eoa' | 'sc';
//   toMulti: string[]; // Multi-sig addresses
//   from: string; // Address received from
//   fromType: string; //'eoa' | 'sc';
//   value: string;
//   netFee: string; // Will be 0.0 on receives
//   gasLimit: string; // in gwei
//   baseFee: string; // on send only - what the baseFee was at the time of sending
//   maxFeePerGas: string; // at time of send
//   maxPriorityFeePerGas: string; // tip for validators at time of send
//   initialTimestamp: string; // This only gets updated if the transaction originates from yakkl
//   timestamp: string; // date or timestamp of transaction
//   formattedTimestamp: string;
//   nonce: number; // nonce used
//   hash: string; // Transaction hash
//   index: number; // Index in block
//   blockchain: string; // Name of network the transaction occurred on
//   type: string; // Name of the specific network type
//   chainId: string;
//   explorer: string;
//   blockNumber: string; // Block number the transaction is part of
//   blockHash: string;
//   data: unknown | null | undefined;  // This is a placeholder for any additional data that is not part of the standard profile
//   details: YakklTransactionDetail[]; // Raw details from blockchain of transactions, receipts and block
//   meta: MetaData;
// }

// export interface YakklTransaction extends Transaction_original {};

// May add back later...
// export interface YakklActivityLog {
//   id: string; // Profile id
//   txId: string;
//   txDate: string;
//   type: string; //'System' | 'Created' | 'Updated' | 'Changed' | 'Error' | 'Warning' | 'Buy' | 'Sell' | 'Swap' | 'Send' | 'Received' | 'Payment' | 'Token';
//   transaction: string; // 'Module name' (if 'type' = 'System') otherwise it's the 'txId' number from 'yakklTransactionDetail'
//   network: string; // which network like Ethereum
//   blockchain: string; // 'mainnet'
//   from: string;
//   to: string;
//   meta: MetaData; // Can be anything. It's an anonymous key/value property
//   version: string;
// }

// export interface YakklKYC {
//   profileType: string; // "naturalPerson", "company", ...
//   company: Company;
//   naturalPerson: NaturalPerson;
//   status: string;
//   statusReason: string; // if 'failure' then the reason why the kyc process did not pass
//   email: string;
//   createDate: string;
//   updateDate: string;
//   expireDate: string; // If annual or every 5 years or undefined if n/a
//   amlCleared: boolean;
//   cipCleared: boolean;
//   idConfirmed: boolean;
//   idDocsVerified: boolean;
//   documents: Document[];
//   taxId: string;
//   taxCountry: string;
//   proofOfAddress: boolean;
//   primaryPhone: PrimaryPhone;
//   primaryAddress: PrimaryAddress;
//   exceptions: string[];
// }


// export interface Network {
//   network?: string; // Deprecated
//   name: string;
//   symbol: string;
//   icon: string;
//   rpcUrls: string[]; // These are the provider URLs for the given network
//   types: NetworkType[];
//   explorer?: URL;
// }

// export interface NetworkType {
//   type: string;
//   release: string;
//   name: string;
//   chainId: Numberish;
// }

// export interface YakklAsset {
//   name: string; // This should be unique when combined with 'class'
//   class: string; // Asset class such as 'Tokens', 'NFTs', 'RWA', ...
//   subClass: string; // Mainly applies to RWA such as deeds, titles, ...
//   description: string;
//   status: string;
//   card: string;
//   icon: string;
//   symbol: string;
//   decimals: number;
//   network: Network; 
//   version: string; // Travels with the data for upgrades
// }

// export interface YakklAssetKey {
//   name: string; // Default
//   class: string; // Default
//   subClass: string; // Only applies to RWAs
//   version: string;
// }


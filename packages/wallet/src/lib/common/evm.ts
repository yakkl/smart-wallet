import type { BytesLike, BlockTag } from '$lib/common/types';
import type { BaseTransaction, TransactionRequest, EncryptedData, TransactionResponse, YakklPrimaryAccount } from '$lib/common/interfaces';
import type { BigNumber, BigNumberish } from '$lib/common/bignumber';


// Here for reference, but not used in the code at the moment.
export const etherTypes: string[] = [
    "wei",
    "kwei",
    "mwei",
    "gwei",
    "szabo",
    "finney",
    "ether",
];


/**
 * Options for creating a base account.
 */
export interface BaseAccountOptions {
  /**
   * The address of the account.
   */
  address: string;

  /**
   * The private key of the account.
   */
  privateKey: string;
}

/**
 * Options for creating an account, extending base account options.
 */
export interface AccountOptions extends BaseAccountOptions {
  /**
   * The public key of the account.
   */
  publicKey: string;

  /**
   * The mnemonic of the account.
   */
  mnemonic: string;

  /**
   * The path of the account.
   */
  path: string;

  /**
   * The primary account associated with Yakkl.
   */
  primary: YakklPrimaryAccount | null;
}

/**
 * Interface for objects that can return an address.
 */
export interface Addressable {
  /**
   * Get the object address.
   */
  getAddress(): Promise<string>;
}

/**
 * Data related to transaction fees.
 */
export interface FeeData {
  lastBaseFeePerGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasPrice: BigNumber | null;
}

/**
 * Access list type for Ethereum transactions.
 */
export type AccessList = Array<{ address: string, storageKeys: Array<string> }>;

/**
 * Type representing various forms of access lists.
 */
export type AccessListish = AccessList |
                            Array<[ string, Array<string> ]> |
                            Record<string, Array<string>>;

/**
 * Type for salted cryptographic keys.
 */
export type SaltedKey = {
  salt: string;
  key: CryptoKey;
}

/**
 * Type for serialized encrypted wallets.
 */
export type SerializedEncryptedWallet = {
  timeSaved: number;
  wallet: EncryptedData;
}

/**
 * Type for serialized encrypted wallets collection.
 */
export type SerializedEncryptedWallets = {
  version: 1;
  wallets: SerializedEncryptedWallet[];
}

/**
 * Legacy wallet provider interface.
 */
export type LegacyWalletProvider = {
  on: (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ) => unknown;
  removeListener: (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ) => unknown;
  [optionalProps: string]: unknown;
}

/**
 * Legacy window Ethereum provider interface.
 */
export type LegacyWindowEthereum = LegacyWalletProvider & {
  isMetaMask?: boolean;
  yakklSetAsDefault?: boolean;
  isYakkl?: boolean;
  autoRefreshOnNetworkChange?: boolean;
}

/**
 * Interface for transaction requests, extending base transactions.
 */
export interface EVMTransactionRequest extends TransactionRequest {
  blockTag?: BlockTag;
  /**
   * The blob versioned hashes (see [[link-eip-4844]]).
   */
  blobVersionedHashes?: null | Array<string>;

  /**
   * Any blobs to include in the transaction (see [[link-eip-4844]]).
   */
  blobs?: null | Array<BlobLike>;

  /**
   * An external library for computing the KZG commitments and
   * proofs necessary for EIP-4844 transactions (see [[link-eip-4844]]).
   *
   * This is generally ``null``, unless you are creating BLOb
   * transactions.
   */
  kzg?: null | KzgLibrary;  
}

/**
 * Interface for transaction details, extending base transactions.
 */
export interface Transaction extends BaseTransaction {
  r?: string;
  s?: string;
  v?: number;
}

/**
 * Interface for Ethereum logs.
 */
export interface Log {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
  logIndex: number;
}

/**
 * A BLOb object that can be passed for [[link-eip-4844]] transactions.
 * 
 * It may have had its commitment and proof already provided
 * or rely on an attached [[KzgLibrary]] to compute them.
 */
export type BlobLike = BytesLike | {
  data: BytesLike;
  proof: BytesLike;
  commitment: BytesLike;
};

/**
 * An interface for any object which can resolve an ENS name.
 */
export interface NameResolver {
  /**
   * Resolve to the address for the ENS %%name%%.
   *
   * Resolves to ``null`` if the name is unconfigured. Use
   * [[resolveAddress]] (passing this object as %%resolver%%) to
   * throw for names that are unconfigured.
   */
  resolveName(name: string): Promise<null | string>;
}

/**
 * A full-valid Blob object for [[link-eip-4844]] transactions.
 *
 * The commitment and proof should have been computed using a
 * KZG library.
 */
export interface Blob {
  data: string;
  proof: string;
  commitment: string;
}

/**
 * A KZG Library with the necessary functions to compute
 * Blob commitments and proofs.
 */
export interface KzgLibrary {
  blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
  computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
}

/**
 * Ethereum transaction interface extending base transactions.
 */
export interface EthereumTransaction extends BaseTransaction {
  // Additional Ethereum-specific properties if needed
}

/**
 * Basic block interface.
 */
export interface _Block {
  hash: string;
  parentHash: string;
  number: number;
  timestamp: number;
  nonce: string;
  difficulty: number;
  _difficulty: bigint;
  gasLimit: BigNumberish;
  gasUsed: BigNumberish;
  miner: string;
  extraData: string;
  baseFeePerGas?: null | BigNumberish;
}

/**
 * Block interface extending basic block.
 */
export interface Block extends _Block {
  transactions: Array<string>;
}

/**
 * Block interface with transactions extending basic block.
 */
export interface BlockWithTransactions extends _Block {
  transactions: Array<TransactionResponse>;
}

/**
 * Event filter interface.
 */
export interface EventFilter {
  address?: string;
  topics?: Array<string | Array<string> | null>;
}

/**
 * Filter interface extending event filter.
 */
export interface Filter extends EventFilter {
  fromBlock?: BlockTag;
  toBlock?: BlockTag;
}

/**
 * Filter by block hash interface extending event filter.
 */
export interface FilterByBlockHash extends EventFilter {
  blockHash?: string;
}

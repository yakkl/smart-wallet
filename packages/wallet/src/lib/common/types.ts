/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventFilter, Addressable, YakklAccount, YakklChat, YakklConnectedDomain, YakklPrimaryAccount, YakklContact, Network, BigNumberish, TokenData } from '$lib/common';

export type NotificationType = 'basic' | 'image' | 'list' | 'progress';

export interface NotificationBase {
  type: NotificationType;
  title: string;
  message: string;
  requireInteraction?: boolean;
  silent?: boolean;
  priority?: -2 | -1 | 0 | 1 | 2;
  contextMessage?: string;
  buttons?: Array<{ title: string; iconUrl?: string }>;
  eventTime?: number;
}

export interface BasicNotificationOptions extends NotificationBase {
  type: 'basic';
}

export interface ListNotificationOptions extends NotificationBase {
  type: 'list';
  items: Array<{ title: string; message: string }>;
}

export interface ImageNotificationOptions extends NotificationBase {
  type: 'image';
  imageUrl: string;
}

export interface ProgressNotificationOptions extends NotificationBase {
  type: 'progress';
  progress: number;
}

export type NotificationOptions =
  | BasicNotificationOptions
  | ListNotificationOptions
  | ImageNotificationOptions
  | ProgressNotificationOptions;

export type CreateNotificationOptions = NotificationOptions & {
  iconUrl: string;
};

export interface NotificationOptionsExample {
  // Priority affects how the notification is displayed (-2 to 2)
  priority?: number;
  // -2: Lowest priority - might be hidden in notification center
  // -1: Low priority - shown in notification center
  //  0: Default priority
  //  1: High priority - more prominent display
  //  2: Highest priority - most prominent, might bypass "quiet hours"

  // If true, notification stays visible until user interacts
  requireInteraction?: boolean;
  // false (default): Notification may auto-dismiss
  // true: Notification persists until clicked/dismissed

  // For progress notifications (0 to 100)
  progress?: number;
  // Shows a progress bar, useful for operations like:
  // - Loading/saving data
  // - Download progress
  // - Operation completion percentage

  // If true, notification appears without sound
  silent?: boolean;
  // false (default): Play system notification sound
  // true: No sound on notification

  // Additional context shown below main message
  contextMessage?: string;
  // Smaller text below the main message
  // Example: "Last updated: 2 minutes ago"

  // Action buttons (max 2 buttons)
  buttons?: Array<{
    title: string;    // Button text
    iconUrl?: string  // Button icon
  }>;

  // Timestamp for the notification
  eventTime?: number;
  // Unix timestamp in milliseconds
  // Shows when the event occurred
}

export type AccountType = YakklAccount | YakklPrimaryAccount;
export type YakklAccounts = [YakklAccount];
// export type YakklAssets = [YakklAsset];
export type YakklChats = [YakklChat];
export type YakklConnectedDomains = [YakklConnectedDomain];
export type YakklPrimaryAccounts = [YakklPrimaryAccount];
// export type YakklTransactions = [YakklTransaction];
export type YakklContacts = [YakklContact];
export type YakklNetworks = [Network];

export type ErrorBody = {
  error?: string;
  reason?: string;
  body?: string; // Ensure body is a string
  [key: string]: unknown; // Use `unknown` instead of `any` for better type safety
};

export enum SystemTheme {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system',
}

export enum AccountTypeCategory {
  PRIMARY = 'primary',
  SUB = 'sub',
  CONTRACT = 'contract',
  IMPORTED = 'imported',
}

export enum AccountTypeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export enum RegistrationType {
  STANDARD = 'standard',
  PRO = 'pro',
}

export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  PRIVATE = 'private',
  OTHER = 'other',
}

// Used for checking prices of asset pairs from different providers such as coinbase, coingecko, etc.
export type PricingStore = {
  provider: string; // e.g. "coinbase"
  id: string; // profile id
  pair?: string;   // e.g. "ETH/USD"
  price: number; // e.g. 2000
  prevPrice?: number; // e.g. 1990 - set prevPrice = price before getting new price
}

// Sub-classes of Signer may optionally extend this interface to indicate
// they have a private key available synchronously
export interface ExternallyOwnedAccount {
  readonly address: string;
  readonly privateKey: string;
}

export type ParsedError = ErrorBody | string | null;

export type EventType = string | Array<string | Array<string>> | EventFilter; // | ForkEvent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Listener = (...args: Array<any>) => void;

// export type Numeric = number | bigint;
// export type BigNumberish = string | Numeric | null;
export type BigNumberishLegacy = string | number | bigint;
export type Numberish = string | number;
export type Address = string;
export type Hash = string;

export type BlockTag = BigNumberish | string;

// Allows us to creates a new type that takes a generic type T and transforms it such that each property of T can either be its original type or a promise of its original type.
export type Deferrable<T> = {
  [ K in keyof T ]: T[K] | Promise<T[K]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Result = { key: string, value: any};


/**
 *  Anything that can be used to return or resolve an address.
 */
export type AddressLike = string | Promise<string> | Addressable;


/**
 *  A [[HexString]] whose length is even, which ensures it is a valid
 *  representation of binary data.
 */
export type DataHexString = string;

/**
 *  A string which is prefixed with ``0x`` and followed by any number
 *  of case-agnostic hexadecimal characters.
 *
 *  It must match the regular expression ``/0x[0-9A-Fa-f]*\/``.
 */
export type HexString = string;

/**
 *  An object that can be used to represent binary data.
 */
export type BytesLike = DataHexString | Uint8Array;


export type PermissionRequest = {
  key: string
  origin: string
  faviconUrl: string
  chainId: string
  title: string
  state: string //"request" | "allow" | "deny"
  accountAddress: string
}

export type URI = string;
export type URL = string;
export type DomainName = string;

export type IMAGEPATH = string; // This is a path to a file or directory, URL, or base64 encoded string of an image

import type { YakklCurrentlySelected, Settings, Preferences } from '$lib/common';
import type { Blockchain } from '$lib/plugins/Blockchain';
import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
import type { Provider } from '$lib/plugins/Provider';
import type { Wallet } from '$lib/plugins/Wallet';

export interface LayoutData {
  currentlySelected: YakklCurrentlySelected | null;
  yakklSettings: Settings | null;
  yakklMiscStore: string;
  yakklPrimaryAccountsStore: YakklPrimaryAccount[];
  yakklPreferences: Preferences | null;
  instances: [Wallet | null, Provider | null, Blockchain | null, TokenService<any> | null];
  yakklTokenDataStore: TokenData[];
}

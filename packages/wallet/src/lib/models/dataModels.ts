/* eslint-disable prefer-const */

// dataModels.ts - this is the default data that is used when the user first installs the app. Some of this data will be updated and some may seem out of date. If so, then please file an issue so we can address it. The customer data will override this data.

// yakklSettings
// `autoLockTimer` is in seconds as integers (e.g., 0 - on idle, 1 - 1 second, ..., 3600 - 1 hour, etc.)

// NOTE: 'id' should be unique value for the given group of data. Crypto uuidv4 can be used so that if we move to a central DB then it will be unique.

export const prerender = false;

import { dateString } from '$lib/common/datetime';
import type { Preferences, YakklWatch, YakklSecurity, YakklBlocked, YakklRegisteredData, Profile, YakklChat, YakklCurrentlySelected, YakklAccount, YakklPrimaryAccount, YakklConnectedDomain, YakklContact, YakklNFT, CurrentlySelectedData, AccountData, PrimaryAccountData, ProfileData, Settings } from '$lib/common/interfaces';

import {
  SystemTheme,
  AccountTypeCategory,
  RegistrationType,
  NetworkType,
} from '$lib/common/types';

import {
  DEFAULT_POPUP_WIDTH,
  DEFAULT_POPUP_HEIGHT,
  DEFAULT_EXT_HEIGHT,
  DEFAULT_TITLE,
  YAKKL_ZERO_ADDRESS,
  YAKKL_ZERO_ACCOUNT_NAME,
  NUM_OF_SPLASH_IMAGES,
  SPLASH_DELAY,
  ALERT_DELAY,
  IDLE_AUTO_LOCK_CYCLE,
  VERSION,
} from '$lib/common/constants';


// TBD - Need an IR (Incident Response) Plan in the event of security issues of any kind. Future insurance will require this
// TBD - Same holds true for DR (Disaster Recovery) Plan. We must create a 'chaos monkey' test plan and run on a regular basis

// TBD - Maybe setup a private cryptic domain to use for sending important analytical data
// TBD - Maybe setup a generic cdn imaging cryptic domain to for rotation of images (if even needed or desired)

// TBD - reset version automatically here...

// Version of data allows for downward compatibility, especially with any messaging systems
// rotationDate - Automatically set a rotation date for password or passkey change.
// passkey - // TBD - could be used instad of password with encryption of username + passkey + biometric when using mobile and 2FA with security key
// status - enabled, disabled, pending. Pending is being worked on and disabled means we're not currently supporting it

// TBD - need to capture OS, version, date of creation, what features are used. Creation date can be associated with personal data
// All other items would anonymized with no accociate with any given account
// TBD - May can use $YAK or $YAKKL as a means of credit that can be used for payment of services to get more community envolvement
// Think of it like earning points back like Amazon on things you normally would do in the crypto space anyway
// security: {
// TBD - We may need to have a secret security option that is not open sourced so that we can rotate keys or have multi-signature smart countracts
// This advanced security could be charged for and we double encrypt and backup on our closed servers via vpn
// Maybe we have a minimum of $2 USD per month with variable price up to $10 or $20 USD depending on actual usage that covers all costs
// TBD - Institional version could have an IIoT devices with an embedded TPM chip and certificate that would be able to communicate
// over VPN with our systems. Would can then work with the institutions security team on protecting all assets

// Default non-ecrypted data which is safe to be in memory (same as currentlySelected data)
// NOTE: id and userName are unique and part of each storage (stores are only in memory for a given session). All sensitive data is encrypted!



// NOTE: Update these two as needed!!
// WIP - May need to add a dataModel for providers and the blockchains they support. Review interfaces! This could be used for the wallet provider and blockchain combo for the future.
export let yakklWalletBlockchains = ['Ethereum'];
export let yakklWalletProviders = ['Alchemy'];
// WIP - Already have stores and storage defined


// Preferences - User specified and defaults
export const yakklPreferences: Preferences = {
  id: '',
  idleDelayInterval: 60, // System default of 1 minute - this is in seconds
  showTestNetworks: true,
  dark: SystemTheme.SYSTEM, // 'dark', 'light', 'system'
  chart: 'line',
  screenWidth: 0, // These two change. They are here for temporary but we're already using settings for the popup
  screenHeight: 0,
  idleAutoLock: true,
  idleAutoLockCycle: IDLE_AUTO_LOCK_CYCLE,  // 3 minutes
  locale: 'en_US',
  currency: {code: 'USD', symbol: '$'},
  words: 32,  // Default number of words - may not enable in the UI - 24 words= 12 words, 32 words= 24 words
  wallet: {
    title: DEFAULT_TITLE,
    extensionHeight: DEFAULT_EXT_HEIGHT,
    popupHeight: DEFAULT_POPUP_HEIGHT,
    popupWidth: DEFAULT_POPUP_WIDTH,
    enableContextMenu: false,
    enableResize: false,
    splashDelay: SPLASH_DELAY,
    alertDelay: ALERT_DELAY,
    splashImages: NUM_OF_SPLASH_IMAGES,
    autoLockTimer: 0, // In seconds - if 0 then it will autolock on system 'idle'
    autoLockAsk: false, // If true then it will prompt to ask the user to continue
    autoLockAskTimer: 10, // If autoLockAsk true then this timer will keep the dialog and app open this many more seconds before locking automatically via timeout
    animationLockScreen: false,
    pinned: true,
    pinnedLocation: 'TL',  // May want 'TL' Top Left, 'TR' Top Right, 'BL', 'BR', 'M' Middle, or 'x,y' coordinates
    defaultWallet: true,  // This can be cutoff in preferences/wallet. It allows any reference to 'window.ethereum' or others to only popup Yakkl
  },
  theme: 'yakkl',
  themes: [{
    name: "yakkl",
    animation: {
      lockScreen: '',
    },
    colors: {
      primary: '',
      secondary: '',
      primaryBackgroundLight: '',
      primaryBackgroundDark: '',
    }
  }],
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


// Settings - Mostly items that are automatically updated by the system
export let yakklSettings: Settings = {
  id: '',  // Profile id
  version: VERSION,  // Uses semversion format but puts 'default' as a placeholder
  previousVersion: '',
  registeredType: RegistrationType.STANDARD,  // This data comes from yakklRegisteredData.type
  legal: {
    termsAgreed: false,
    privacyViewed: false,
    updated: false,  // If this is set then we show the updated terms and privacy. We could just push the code in top pull up legal again and not have this attribute
  },
  platform: {
    arch: '',
    nacl_arch: '',
    os: '',
    osVersion: '',
    browser: '',
    browserVersion: '',
    platform: '',  // Something like 'MacIntel'
  },
  init: false,
  showHints: true,
  isLocked: true,
  isLockedHow: '',     //'internal' | 'idle_system' | 'idle_timer' | 'user',
  transactions: {
    retry: {
      enabled: true,
      howManyAttempts: 3,
      seconds: 30,  // Retry in 30 seconds
      baseFeeIncrease: .1, // percentages
      priorityFeeIncrease: .1, // percentages
    },
    retain: {
      enabled: true,  // Log all transactions (attempts, success, fails, etc...)
      days: -1, // days to retain, if -1 then as long as possible
      includeRaw: true,  // This will include the full raw blockchain transaction info
      // Could have obfuscation of data
    },
  },
  meta: {}, // Meta is currently not used
  upgradeDate: '',
  lastAccessDate: dateString(),
  createDate: dateString(),
  updateDate: dateString(),
};


export let yakklWatch: YakklWatch = {
  id: '',  // Profile id
  blockchain: '',
  name: '',
  tags: [],
  value: 0n,
  includeInPortfolio: false,
  explorer: '',
  address: '',
  addressAlias: '',
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


// Need to work on 2FA and zero trust for 'Premium' and/or 'Ultra' and 'Enterprise' (enterprise will need to support SSO or AD)
export let yakklSecurity: YakklSecurity = {
  type: '',
  value: '',
  enhancedSecurity: {
    enabled: false, // We have this off so that user makes a decision to enable it
    rotationDays: 0,
    lastRotationDate: '', // It will not force a pwd change but will keep prompting until they do
    passKey: "",
    passKeyHints: [],
    mfaType: '',
    phone: '',
  },
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
}

export let yakklBlocked: YakklBlocked = {
  domain: '',
};

export let yakklRegisteredData: YakklRegisteredData = {
  key: '',
  type: RegistrationType.STANDARD,
  version: VERSION,
  createDate: dateString(),
  updateDate: dateString(),
}

export let profile: Profile = {
  id: '', // Must be unique - used where there is an 'id'
  userName: '', // Must be unique - not encrypted
  preferences: yakklPreferences,
  data: {} as ProfileData,
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


export let yakklChat: YakklChat = {
  id: '',
  text: '',
  sender: '',
  timestamp: '',
  version: VERSION,
  createDate: dateString(),
  updateDate: dateString(),
};


export let yakklCurrentlySelected: YakklCurrentlySelected = {
  id: '',  // Profile id
  shortcuts: {
    value: 0n, // Account value - IF not 0.0 then use formatEther from utilities. If you need to convert to bigint then use parseEther from ethers
    accountType: AccountTypeCategory.PRIMARY,  // primary, imported, sub
    accountName: YAKKL_ZERO_ACCOUNT_NAME, // shortcut for account.name
    smartContract: false,
    address: YAKKL_ZERO_ADDRESS,  // So we don't have to hit yakklAccount every time
    alias: '', // Address alias like myaddress.eth
    primary: null,  // Primary account for quick reference
    init: false,
    legal: false,  // from yakklSettings - this version is only a shortcut - use the yakklSettings version for actual logic
    isLocked: true,
    showTestNetworks: false,
    profile: {
      userName: '',
      name: null,
      email: '',
    },
    gasLimit: 21000, // 21000 for EOA and 45000 for smart contracts - use decimalToHex to convert to hex
    networks: [
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
    ],  // List of the associated networks for both mainnet and testnets
    network:   {
      blockchain: 'Ethereum',
      name: 'Mainnet',
      chainId: 1,
      symbol: 'ETH',
      type: NetworkType.MAINNET,
      explorer: 'https://etherscan.io',
      decimals: 18,
    }, // The current network for the given account

    // Legacy - May remove
    blockchain: 'Ethereum',  // So we don't have to hit yakklNetwork every time - Also, make sure to name the background card to this blockchain in lowercase
    type: 'Mainnet',  // whatever type that was selected from the network type collection
    chainId: 1, // Default to mainnet
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
  },
  // network: yakklNetwork, // The current network for the given account
  preferences: {
    locale: "en_US",
    currency: {code: 'USD', symbol: '$'},
  },
  data: {} as CurrentlySelectedData,
  version: VERSION,  // travels with the data and mainly used for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


// Pulled from random popular or high-value addresses in etherscan.io
// If you have a qty > 0 AND includeInPortfolio is true then it will be added to the overall value
// Why is 'includeInPortfolio' present instead of simply assuming a qty > 0 is for including in the user's portfolio?
// It forces the user to make a choice and accept responsibility for these values appearing in their portfolio.


export let yakklPrimaryAccount: YakklPrimaryAccount = {
  id: '',  // Profile id
  name: YAKKL_ZERO_ACCOUNT_NAME,  // account name, address, and keys are here for convenience - they are also in the yakklAccount record
  address: YAKKL_ZERO_ADDRESS,
  value: 0n,
  index: 0,  // for primary path account index
  data: {} as PrimaryAccountData,  // Encrypted
  account: {} as YakklAccount, // Primary
  subIndex: 0, // for indexing the path for derived - sub accounts
  subAccounts: [], // yakklAccounts
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


// Represents the raw address used for transactions for any asset class
export let yakklAccount: YakklAccount = {
  id: '', // Profile id
  index: 0,
  blockchain: 'Ethereum',
  smartContract: false, // SmartContracts do not have private keys and the price per gas unit is usually 45,000 instead of 21,000
  address: YAKKL_ZERO_ADDRESS, // Must be unique
  alias: '',
  accountType: AccountTypeCategory.PRIMARY, //'imported' | 'sub' | 'primary',  // May need to add 'NFT' or 'RWA' or something else for different types of accounts - ??
  name: YAKKL_ZERO_ACCOUNT_NAME,
  description: '', // Can use this to describe an account associated with an NFT or RWA (Real World Asset) or class
  primaryAccount: yakklPrimaryAccount, // If the account is a primary account then this is empty
  data: {} as AccountData, // Encrypted
  value: 0n, // big number and supports up to 18 decimals - contains the value here plus the sum of all derived accounts from this primary account
  class: "Default", // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
  level: 'L1',
  isSigner: true,
  avatar: '', // Default is identityicon but can be changed to user/account avatar
  tags: ['Ethereum'],
  includeInPortfolio: true, // This only applys to the value in this primary account and not any of the derived accounts from this primary account
  connectedDomains: [],
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};

// Now update the 'primaryAccount' with the 'account' property
yakklPrimaryAccount.account = yakklAccount;

// Tracks the domain/dApp connected to a given address
export let yakklConnectedDomain: YakklConnectedDomain = {
  id: '',
  addresses: [], // {address: '', blockchain: 'Ethereum', chainId: '0x1'}
  name: '',  // Name of dApp/site
  permissions: [],  // What permissions has Yakkl allowed for this connected domain
  domain: '',
  icon: '',
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
};


// Holds any contact information of addresses used to send crypto to. Allows the addresses to be more human friendly
export let yakklContact: YakklContact = {
  id: '',
  name: '',
  address: '',
  addressType: 'EOA',  // EOA or SC
  avatar: '',
  blockchain: 'Ethereum',
  alias: '',
  note: '', // Note on the contact for anything you wish to keep
  version: VERSION, // Travels with the data for upgrades
  createDate: dateString(),
  updateDate: dateString(),
  meta: {},
}



// TODO: Think through NFT collections, rarity, transfers, etc.
export let yakklNFT: YakklNFT = {
  id: '',
  name: '',
  description: '',
  token: '',
  thumbnail: '',
  blockchain: '',
  media: [{
    type: 'image', //"image" | "video" | "audio"
    url: ''
  }],
  contract: '',
  owner: '',
  version: VERSION, // Travels with the data for upgrades
  transferDate: '',
  createDate: dateString(),
  updateDate: dateString(),
  meta: {},
}

// Lists...
export let yakklAccounts = [yakklAccount];
export let yakklPrimaryAccounts = [yakklPrimaryAccount];
export let yakklContacts = [yakklContact];
export let yakklChats = [yakklChat];
export let yakklConnectedDomains = [yakklConnectedDomain];
export let yakklBlockedList = [yakklBlocked];
export let yakklWatchList = [yakklWatch];

// Sample data...
// initialAssets.json is in the 'data' directory
export let sampleWatch: YakklWatch[] = [
  {
    id: '',
    blockchain: "Ethereum",
    name: "Watcher 1",
    tags: ["Binance 8", "Uniswap"],
    value: '.000455',
    includeInPortfolio: true,
    explorer: '',
    address: "0xf977814e90da44bfa03b6295a0616a897441acec",
    addressAlias: '',
    version: VERSION,
    createDate: dateString(),
    updateDate: dateString(),
  },
  {
    id: '',
    blockchain: "Ethereum",
    name: "Watcher 2",
    tags: ["Vb", "Token holdings"],
    value: '0.0',
    includeInPortfolio: false,
    explorer: "https://etherscan.io/tokenholdings?a=0xab5801a7d398351b8be11c439e05c5b3259aec9b",
    address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    addressAlias: "Vb",
    version: VERSION,
    createDate: dateString(),
    updateDate: dateString(),
  },
  {
    id: '',
    blockchain: "Ethereum",
    name: "Watcher 3",
    tags: ["barmstrong.eth", "coinbase", "address"],
    value: '0.0',
    includeInPortfolio: false,
    explorer: "https://etherscan.io/address/0x5b76f5b8fc9d700624f78208132f91ad4e61a1f0",
    address: "0x5b76f5B8fc9D700624F78208132f91AD4e61a1f0",
    addressAlias: "barmstrong.eth",
    version: VERSION,
    createDate: dateString(),
    updateDate: dateString(),
  }
];

// NOTE: May want to add other default data...
export const yakklStoredObjects = [
  { key: "preferences", value: yakklPreferences },
  { key: "settings", value: yakklSettings },
  { key: "yakklCurrentlySelected", value: yakklCurrentlySelected },
  { key: "yakklSecurity", value: yakklSecurity },
  { key: "yakklWalletBlockchains", value: yakklWalletBlockchains },
  { key: "yakklWalletProviders", value: yakklWalletProviders },
  { key: "profile", value: profile },
  { key: "yakklBlockedList", value: yakklBlockedList },
  { key: "yakklWatchList", value: sampleWatch },
];


// Below to be removed at a later date.


// initialAssets.json is in the 'data' directory
// export let defaultYakklAssets = [
//   {
//     name: 'Ethereum', // This should be unique when combined with 'class'
//     class: 'Token',   // Asset class such as 'Tokens', 'NFTs', 'RWA', ...
//     subClass: '',  // Mainly applies to RWA such as deeds, titles, ...
//     description: 'Ethereum crypto',
//     status: 'enabled',
//     icon: '/images/ethereum.svg',
//     symbol: 'ETH',
//     network: 'Ethereum',  // Primary network
//     networks: [  // TODO: Verify 'network' and 'name' are handled correctly
//       {network: "Ethereum", type: "mainnet", release: "Production", name: "mainnet", chainId: "0x1", symbol: "ETH", urlRPC: "https://mainnet.infura.io/v3/", explorer: "https://etherscan.io"},
//       {network: "Ethereum", type: "testnet", release: "Test", name: "Sepolia", chainId: "0xaa36a7", symbol: "ETH", urlRPC: "https://sepolia.infura.io/v3/", explorer: "https://etherscan.io"}
//     ],
//     version: '',
//   },
//   {
//     name: 'Bitcoin', // This should be unique when combined with 'class'
//     class: 'Token',
//     subClass: '',  // Mainly applies to RWA such as deeds, titles, ...
//     description: 'Bitcoin crypto',
//     status: 'pending',
//     icon: '/images/bitcoin.svg',
//     symbol: 'BTC',  // May can be different for different asset classes
//     network: 'Bitcoin',
//     networks: [],
//     version: '',
//   },
//   {
//     name: 'Solana', // This should be unique when combined with 'class'
//     class: 'Token',
//     subClass: '',  // Mainly applies to RWA such as deeds, titles, ...
//     description: 'Solana crypto',
//     status: 'pending',
//     icon: '/images/solana.svg',
//     symbol: 'SOL',  // May can be different for different asset classes
//     network: 'Solana',
//     networks: [],
//     version: '',
//   },
// ];

// initialNetworks.json is in the 'data' directory
// export let defaultEthereumNetworks = [
//   {network: "Ethereum", type: "mainnet", release: "Production", name: "mainnet", chainId: "0x1", symbol: "ETH", urlRPC: "https://mainnet.infura.io/v3/", explorer: "https://etherscan.io"},
//   {network: "Ethereum", type: "testnet", release: "Test", name: "Sepolia", chainId: "0xaa36a7", symbol: "ETH", urlRPC: "https://sepolia.infura.io/v3/", explorer: "https://etherscan.io"}
// ];


// export let yakklProvider: YakklProvider = {
//   provider: 'Infura',   // If name is 'yakkl' then yakkl cloud is the provider and we're going direct to the given blockchains
//   blockchain: 'Ethereum',
//   name: 'Mainnet',
//   chainId: '0x1',     // Have to look up the 'name' from yakklNetworks and 'key' from process.env
//   weight: 5,    // Weight 1-5 with 5 being the provider to use the most - this only applies to mainnets. Testnets all have a weight of 0
//   data: {       // encrypted
//     keys: {
//       key: '',
//       chainId: '0x1',     // Have to look up the 'name' from yakklNetworks and 'key' from process.env
//       blockchain: 'Mainnet',
//     },
//     protocols: [
//       {type: 'https', url: '{{blockchain}}.infura.io/v3/{{key}}'},
//       {type: 'wss', url: '{{blockchain}}.infura.io/ws/v3/{{key}}'}
//     ],
//   },
//   version: '', // Travels with the data for upgrades
// };


// // Possible example of a provider. Will need to modify and enhance
// export let yakklProviders: YakklProvider [] = [
//   {
//     provider: 'Infura',   // If name is 'yakkl' then yakkl cloud is the provider and we're going direct to the given blockchains
//     blockchain: 'Ethereum',
//     name: 'Mainnet',
//     chainId: '0x1',     // Have to look up the 'name' from yakklNetworks and 'key' from process.env
//     weight: 5,    // Weight 1-5 with 5 being the provider to use the most - this only applies to mainnets. Testnets all have a weight of 0
//     data: {
//       keys: {
//         key: '',
//         chainId: '0x1',     // Have to look up the 'name' from yakklNetworks and 'key' from process.env
//         blockchain: 'Mainnet',
//       },
//       protocols: [
//         {type: 'https', url: '{{blockchain}}.infura.io/v3/{{key}}'},
//         {type: 'wss', url: '{{blockchain}}.infura.io/ws/v3/{{key}}'}
//         ]
//       },
//     version: '', // Travels with the data for upgrades
//   },
//   {provider: "Infura", blockchain: "Ethereum", name: "Sepolia", chainId: "0xaa36a7", weight: 0, data: { keys: { key: '', chainId: '0x01', blockchain: 'Mainnet'}, protocols: [{type: "https", url: "{{name}}.infura.io/v3/{{key}}"}, {type: "wss", url: "{{name}}.infura.io/ws/v3/{{key}}"}]}, version: ''},
// ];


// Defaults for Ethereum
// export let yakklNetwork: YakklNetwork = {
//   name: 'Ethereum',
//   symbol: 'ETH',
//   card: 'ethereum-background.png',
//   icon: '/images/ethereum.svg',
//   decimals: 18,
//   types: [
//     {type: 'mainnet', release: 'Production', name: 'Mainnet', chainId: 1},
//     {type: 'testnet', release: 'Test', name: 'Sepolia', chainId: 11155111},
//   ],
//   explorer: 'https://etherscan.io',
//   rpcUrls: [],  // These are the provider urls for the given network
//   version: '', // Travels with the data for upgrades
// };


// export let yakklNetworks: Network[] = [
//   {
//     name: 'Ethereum',
//     symbol: 'ETH',
//     card: 'ethereum-background.png',
//     icon: '/images/ethereum.svg',
//     decimals: 18,
//     types: [
//       {type: 'mainnet', release: 'Production', name: 'Mainnet', chainId: '0x1'},
//       {type: 'testnet', release: 'Test', name: 'Sepolia', chainId: '0xaa36a7'},
//     ],
//     explorer: 'https://etherscan.io',
//     rpcUrls: [],  // These are the provider urls for the given network
//     version: '',
//   },
//   {
//     name: 'Polygon',
//     symbol: 'MATIC',
//     card: 'polygon-background.png',
//     icon: '/images/polygon.svg',
//     decimals: 6, // Not sure if this is correct
//     types: [
//       {type: 'mainnet', release: 'Production', name: 'Mainnet', chainId: '0x89'},
//       {type: 'testnet', release: 'Test', name: 'Mumbai', chainId: '0x13881'},
//     ],
//     explorer: 'https://etherscan.io',
//     rpcUrls: [],  // These are the provider urls for the given network
//     version: '',
//   },
//   {
//     name: 'Optimism',
//     symbol: 'OP',
//     card: 'optimism-background.png',
//     icon: '/images/optimism.svg',
//     decimals: 6, // Not sure if this is correct
//     types: [
//       {type: 'mainnet', release: 'Production', name: 'Mainnet', chainId: '0xA'},
//       {type: 'testnet', release: 'Test', name: 'Kovan', chainId: '0x45'},
//     ],
//     explorer: 'https://etherscan.io',
//     rpcUrls: [],  // These are the provider urls for the given network
//     version: '',
//   },
// ];


// export let yakklAssetKey: YakklAssetKey = {
//   name: 'Ethereum',  // Default
//   class: 'Token',    // Default
//   subClass: '',  // Only applies to RWAs
//   version: '',
// };


// export let yakklAssetKeys: YakklAssetKey[] = [
//   {
//     name: "Ethereum",
//     class: "Token",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Ethereum",
//     class: "NFT",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Ethereum",
//     class: "RWA",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Polygon",
//     class: "Token",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Polygon",
//     class: "NFT",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Polygon",
//     class: "RWA",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Bitcoin",
//     class: "Token",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Optimism",
//     class: "Token",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Optimism",
//     class: "NFT",
//     subClass: "",
//     version: '',
//   },
//   {
//     name: "Optimism",
//     class: "RWA",
//     subClass: "",
//     version: '',
//   }
// ];


// export let yakklAsset: YakklAsset = {
//   name: 'Ethereum', // This should be unique when combined with 'class'
//   class: 'Token',   // Asset class such as 'Tokens', 'NFTs', 'RWA', ...
//   subClass: '',  // Mainly applies to RWA such as deeds, titles, ...
//   description: 'Ethereum crypto',
//   status: 'enabled',
//   card: 'ethereum-background.png',
//   icon: '/images/ethereum.svg',
//   symbol: 'ETH',
//   decimals: 18,
//   network:   {
//     name: 'Ethereum',
//     symbol: 'ETH',
//     icon: '/images/ethereum.svg',
//     rpcUrls: [],  // These are the provider urls for the given network
//     types: [
//       {type: 'mainnet', release: 'Production', name: 'Mainnet', chainId: '0x1'},
//       {type: 'testnet', release: 'Test', name: 'Sepolia', chainId: '0xaa36a7'},
//     ],
//     explorer: 'https://etherscan.io'
//   },
//   version: '',
// };

// TODO: Need to refactor these to be more intuitive and easier to use!!
// Examples of assets
// export let yakklAssets: YakklAsset[] = [
//   {
//     name: "Ethereum",
//     class: "Token",
//     subClass: "",
//     description: "Ethereum crypto",
//     status: "enabled",
//     card: "ethereum-background.png",
//     icon: "/images/ethereum.svg",
//     symbol: "ETH",
//     decimals: 18,
//     network: {
//       name: "Ethereum",
//       symbol: "ETH",
//       icon: "/images/ethereum.svg",
//       rpcUrls: [],
//       types: [
//         {type: "mainnet", release: "Production", name: "Mainnet", chainId: "0x1"},
//         {type: "testnet", release: "Test", name: "Sepolia", chainId: "0xaa36a7"}
//       ],
//       explorer: "https://etherscan.io",
//     },
//     version: '',
//   },
//   {
//     name: "Ethereum",
//     class: "NFT",
//     subClass: "",
//     description: "Ethereum NFT",
//     status: "enabled",
//     card: "ethereum-background.png",
//     icon: "/images/ethereum.svg",
//     symbol: "ETH",
//     decimals: 18,
//     network: {
//       name: "Ethereum",
//       symbol: "ETH",
//       icon: "/images/ethereum.svg",
//       rpcUrls: [],
//       types: [
//         {type: "mainnet", release: "Production", name: "Mainnet", chainId: "0x1"},
//         {type: "testnet", release: "Test", name: "Sepolia", chainId: "0xaa36a7"}
//       ],
//       explorer: "https://etherscan.io",
//     },
//     version: '',
//   },
//   {
//     name: "Ethereum",
//     class: "RWA",
//     subClass: "",
//     description: "Ethereum RWA (Real World Asset)",
//     status: "enabled",
//     icon: "/images/ethereum.svg",
//     card: "ethereum-background.png",
//     symbol: "ETH",
//     decimals: 18,
//     network: {
//       name: "Ethereum",
//       symbol: "ETH",
//       icon: "/images/ethereum.svg",
//       rpcUrls: [],
//       types: [
//         {type: "mainnet", release: "Production", name: "Mainnet", chainId: "0x1"},
//         {type: "testnet", release: "Test", name: "Sepolia", chainId: "0xaa36a7"}
//       ],
//       explorer: "https://etherscan.io",
//     },
//     version: '',
//   },
// ];

// Premature for this but appears we're heading in this direction on regulations
// export let yakklKYC: YakklKYC = {
//   profileType: "naturalPerson", // company...
//   company: {
//     name: '',
//     formedDate: '',
//     type: '',
//     registeredCountries: [],
//     registeredRegions: [],
//   },
//   naturalPerson: {
//     sex: '',
//     dateOfBirth: '',
//     idPhoto: false,
//   },
//   status: '',
//   statusReason: '',  // if 'failure' then the reason why the kyc process did not pass
//   email: '',
//   createDate: '',
//   updateDate: '',
//   expireDate: '', // If annual or every 5 years or undefined if n/a
//   amlCleared: false,
//   cipCleared: false,
//   idConfirmed: false,
//   idDocsVerified: false,
//   documents: [],  // {id: 'userId', type: 'passport', fileName: '', created: '', expires: '', updated: '', store: ''}
//   taxId: '',
//   taxCountry: '',
//   proofOfAddress: false,
//   primaryPhone: {
//     country: '',
//     number: '',
//     type: '',
//     sms: false  // true/false
//   },
//   primaryAddress: {
//     add1: '',
//     add2: '',
//     city: '',
//     region: '',  // State/prov...
//     country: '',
//     postal: ''
//   },
//   exceptions: []
// }


/////////////////////////
// IMPORTANT: EVERYWHERE there is 'id': in the data. Wait to install initial default data UNTIL AFTER the registration so that
//  we have a valid unique ID
/////////////////////////

// Encrypted
// export let profile: Profile = {  // ALL 'data' properties are encrypted. The others are not
//   id: 0, // Must be unique - used where there is an 'id'
//   userName: '',  // Must be unique - not encrypted
//   preferences: yakklPreferences,
//   data: {
//     name: {  // TBD - May want to change for institutional version
//       first: "Current",
//       middle: '',
//       last: "User",
//       suffix: ''
//     }, // currently the only one but it can easily be multi-profile
//     email: '', // added in 0.33.4
//     registered: yakklRegisteredData,  // This will unlock certain features - This value can be '' or 'Standard', 'Premium', 'Ultra', 'Enterprise'
//     kyc: yakklKYC, // KYC (institution) - not currently used
//     digest: '',
//     pincode: '', // Encrypted pincode
//     sig: '',
//     security: yakklSecurity,
//     value: 0.0,        // This is a bignumber that represents the grand total of all accounts that are flagged to be included in the overall portforlio
//     accountIndex: 0,
//     primaryAccounts: [],
//     importedAccounts: [],  // Independent accounts - These accounts have no relation to any primary or subaccount.
//     watchList: [], // If you want to see data from any of your other centralized exchanges or something different
//     meta: {},
//   },
//   version: '', // Travels with the data for upgrades
//   createDate: '',
//   updateDate: '',
// };

// export let yakklActivityLog: YakklActivityLog = {
//   id: 0,  // Profile id
//   txId: '',
//   txDate: '',
//   type: 'System', // 'System' (misc data that does not fit the other types), 'Created' (when system was created), 'Updated' (when system was upgraded/updated), 'Changed' (any datastore changes), 'Error', 'Warning', 'Buy', 'Sell', 'Swap', 'Send', 'Received', 'Payment', 'Token' created
//   transaction: '', // 'Module name' (if 'type' = 'System') otherwise it's the 'txId' number from 'yakklTransactionDetail'
//   network: '', // which network like Ethereum
//   blockchain: '',  // 'mainnet'
//   from: '',
//   to: '',
//   meta: {}, // Can be anything. It's an anonymous key/value property (i.e., meta: {'key': value} or meta: {'key': value...'more': value} where 'more' means any number of key/value pairs) For example, it may be related to a given transaction or set of transactions, etc.
//   version: '',
// };


// Begin - May remove these since we now pull from the blockchain
// export let yakklTransaction: YakklTransaction = {
//   status: 'pending', // 'error', 'pending', 'dropped', 'replaced' or 'Dropped & Replaced', 'mined' - (success, failure/execution reverted)
//   message: '',  // Only applies to 'error', 'pending', 'dropped'
//   type: 'send',  // 'receive'
//   to: '', // Address sent to
//   toType: 'eoa', //'sc'
//   toMulti: [], // Multi-sig ??
//   from: '', // Address received from
//   fromType: 'eoa', //'sc'
//   value: '0.0',
//   netFee: '0.0', // Will be 0.0 on receives
//   gasLimit: '0.0', // in gwei
//   baseFee: '0.0', // on send only - what the baseFee was at the time of sending
//   maxFeePerGas: '0.0', // at time of send
//   maxPriorityFeePerGas: '0.0', // tip for validators at time of send
//   initialTimestamp: '', //This only gets updated if the transaction originates from yakkl
//   timestamp: '', // date or timestamp of transaction
//   formattedTimestamp: '',
//   nonce: 0, // nonce used
//   hash: '',  // Transaction hash
//   index: -1, // Index in block
//   blockchain: 'Ethereum',  // Name of network the transaction occurred on
//   type: 'Mainnet', // Name of the specific network type
//   chainId: '0x1',
//   explorer: 'https://etherscan.io',
//   blockNumber: '', // Block number the transaction is apart of
//   blockHash: '',
//   data: '', // See below
//   details: [], // Raw details from blockchain of transactions, receipts and block
//   meta: {},
// }  // This will get populated after after a send or receive


// // We don't currently store this on the device but we do in memory via the store
// export let yakklTransactionHistory = {
//   id: 0,
//   type: 'etherscan',  // This will change based on the provider of the history data
//   chainId: '',
//   blockHash: '',
//   blockNumber: '',
//   from: '',
//   gas: '',
//   gasUsed: '',
//   hash: '',
//   nonce: '',
//   timestamp: '',
//   formattedTimestamp: '',
//   to: '',
//   index: '',
//   status: '',
//   value: '',
//   explorer: '',
//   contractAddress: '',
//   functionName: '',
//   gasPrice: '',
//   input: '',
//   isError: '',
//   methodId: '',
//   // meta: {},  // Reference where the data came from... ie meta: yakklEtherscanHistory
// }

// Etherscan Transaction History - may remove this later
// export let yakklEtherscanHistory = {
//   contractAddress: '',
//   functionName: '',
//   gasPrice: '',
//   input: '',
//   isError: '',
//   methodId: '',
// }
// End - May remove these since we now pull from the blockchain


// TODO: Think through Real World Assets on the blockchains! Currentlt 'yakklAssets' is focused on crypto space for currencies, NFTs, other smart contracts. We may simply have to map to a smart contract!!

// Security...
// 'authCredentials.type = "PWD"' is the default. Type can be the following:
//      PWD - Password - Default but required. If user selects any option then they still must have a valid password since encryption is based on that as part of the keys
//      MFA - Multi-Function Authentication
//      PLess - Passwordless
//      SSO - Single Sign On - Enterprise only
//      Google - Provider Google
//      Facebook - Provider Facebook
//      Twitter - Provider Twitter
//      Instagram - Provider Instagram
// 'rotationDate' - The date of next required password change. IMPORTANT - data will be encrypted off of new password
// 'passKey' - Additional security code (i.e., pin code or phrase)
// 'passKeyHints' - Array of objects {question: "", answer: ""}. The user can create their own questions but must have a minimum of 3
// 'mfaType' - If MFA is used above then the valid type of communication of the secondary authtentication.
//      SMS - Text message a code
//      KEY - Key device such as secure key connected via USB (similar to hardware wallets)
//      APP - Authentication app such as Google Authenticator or Microsoft Authenticator

// 'version' - Current version the user is using
// 'previousVerion' - The version the user was using before upgrading
//// 'featureVersion' - 'open' is default representing opensource version and 'advanced' is for advanced paid features
// 'installDate' - The original date the user installed YAKKL. If they removed it and installed it again later then the later date
// 'acceptDate' - Date the user clicked on accept for user data cookie like info
// 'upgradeDate' - Date the user upgraded

// Default - User related data that must be encrypted
// Password is used as part of the encryption key. The encrypted version is maintained
// if the user uses the "backup" option this can help BUT we may need to maintain a hashed
// version


// Singles or lists above... (already exported above)
// profile
// yakklSettings
// yakklPreferences
// yakklSecurity

// yakklCurrentlySelected
// yakklRegisteredData


// TODO: Think through maybe adding a collection of totals for each asset class (e.g., 'Ethereum', 'Bitcoin', ...)
// Includes account values, NFT values and more...
// export let yakklPortfolio = {
//   id: 0,
//   accounts: yakklAccounts,
//   version: '', // Travels with the data for upgrades
// }



// IMPORTANT NOTE: Edit 'constants.mustache' since it is the template for 'constants.ts'

// Global shared constants. Network specifics are in the network/<whatever>/contants.js file
export const VERSION = "1.0.5";

export const YEAR = "2024"; // Instead of computing year since user can change date on system - use a constant

export const GAS_PER_BLOB = 131072; // 2**17

export const NUM_OF_SPLASH_IMAGES = 3;
export const SPLASH_DELAY = 3000; //milliseconds
export const ALERT_DELAY = 3000; //milliseconds
export const IDLE_AUTO_LOCK_CYCLE = 3; // minutes

// Retry and backoff constants
export const DEV_MAX_RETRIES = 5;
export const DEV_BASE_DELAY = 1000; //milliseconds

export const ETH_BASE_EOA_GAS_UNITS = 21000; // Base amount of gas units it takes for a EOA transaction
export const ETH_BASE_SCA_GAS_UNITS = 45000; // Base amount of gas units it takes for a Smart Contract transaction
export const ETH_BASE_UNISWAP_GAS_UNITS = 500000; // Base amount of gas units it takes for a Uniswap transaction
export const ETH_BASE_FORCANCEL_GAS_UNITS = ETH_BASE_EOA_GAS_UNITS * 3;

export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address on Ethereum mainnet

export const YAKKL_GAS_ESTIMATE_MIN_USD = 2.00;
export const YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT = 3750000;
export const YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS = 15000; // 150%
export const YAKKL_FEE_BASIS_POINTS = 500; //4375; //0.4375% //875; // 0.875%
export const YAKKL_FEE_BASIS_POINTS_MAX = 1000; // 10%
export const YAKKL_ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const YAKKL_ZERO_ACCOUNT_NAME = "YAKKL - Zero Account - YAKKL";
export const YAKKL_ZERO_ACCOUNT_TYPE = "NA"; // Not applicable - default value

export const YAKKL_INTERNAL = "yakkl-internal";
export const YAKKL_EXTERNAL = "yakkl-external";
export const YAKKL_PROVIDER_EIP6963 = "yakkl-provider-eip6963";
export const YAKKL_PROVIDER = "yakkl-provider";
export const YAKKL_PROVIDER_ETHEREUM = "yakkl-provider-ethereum";
export const YAKKL_SPLASH = "yakkl-splash";
export const YAKKL_DAPP = "yakkl-dapp";
export const YAKKL_ETH = "yakkl-eth";

// Logical viewport size of iPhone pro max
export const DEFAULT_POPUP_WIDTH = 428; //394;
export const DEFAULT_POPUP_HEIGHT = 926; //620;
export const DEFAULT_EXT_HEIGHT = 926; //600;
export const DEFAULT_TITLE = "YAKKL® Smart Wallet";
export const DEFAULT_UPGRADE_LABEL = "Premier - ";

export const DEFAULT_DERIVED_PATH_ETH = "m/44'/60'/"; // '0'/0/0' - First of these three represents the account. Last of these three represents index and gets dynamically created. Middle one of these three is always '0'

export const DEFAULT_YAKKL_ASSETS = "yakklAssets"; // Not stored in local storage but static json.

export const STORAGE_YAKKL_PREFERENCES = "preferences";
export const STORAGE_YAKKL_SETTINGS = "settings";
export const STORAGE_YAKKL_SECURITY = "yakklSecurity";
export const STORAGE_YAKKL_PORTFOLIO = "yakklPortfolio";
export const STORAGE_YAKKL_CURRENTLY_SELECTED = "yakklCurrentlySelected";
export const STORAGE_YAKKL_REGISTERED_DATA = "yakklRegisteredData";

export const STORAGE_YAKKL_PROFILE = "profile";
export const STORAGE_YAKKL_PROFILES = "profiles";  
export const STORAGE_YAKKL_ACCOUNTS = "yakklAccounts";
export const STORAGE_YAKKL_PRIMARY_ACCOUNTS = "yakklPrimaryAccounts";
export const STORAGE_YAKKL_CONTACTS = "yakklContacts";
export const STORAGE_YAKKL_CHATS = "yakklChats";
export const STORAGE_YAKKL_WATCHLIST = "yakklWatchList";
export const STORAGE_YAKKL_BLOCKEDLIST = "yakklBlockedList";
export const STORAGE_YAKKL_CONNECTED_DOMAINS = "yakklConnectedDomains";

export const STORAGE_YAKKL_WALLET_PROVIDERS = "yakklWalletProviders";
export const STORAGE_YAKKL_WALLET_BLOCKCHAINS = "yakklWalletBlockchains";

export const STORAGE_YAKKL_MEMPOOL = "yakklMemPool";

export const PASSKEY_HINTS_MIN = 3;

export const PATH_HOME = "/";
export const PATH_REGISTER = "/register/Register";
export const PATH_LOGIN = "/login/Login";
export const PATH_LOCK = "/lock";
export const PATH_CONTACTS = "/contacts";
export const PATH_WELCOME = "/welcome/Welcome";
export const PATH_DASHBOARD = "/dashboard";
export const PATH_LOGOUT = "/logout";
export const PATH_IMPORT_EMERGENCYKIT = "/import/import-emergencykit";
export const PATH_IMPORT_PRIVATEKEY = "/import/import-privatekey";
export const PATH_IMPORT_WATCH = "/import/import-watch";
export const PATH_IMPORT_PHRASE = "/import/import-phrase";
export const PATH_EXPORT = "/export";
export const PATH_EXPORT_EXPORT = "/export/export";
export const PATH_ACCOUNTS = "/accounts";
export const PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY = "/accounts/ethereum/create/primary";
export const PATH_ACCOUNTS_ETHEREUM_CREATE_DERIVED = "/accounts/ethereum/create/derived";
export const PATH_ACCOUNT_MAINTENANCE = "/accounts/ethereum/maintenance";
export const PATH_LEGAL = "/legal/Legal";
export const PATH_PROFILE = "/components/profile";
export const PATH_ACTIVITIES = "/activities";
export const PATH_CRYPTO = "/crypto";
export const PATH_NFTS = "/nfts";
export const PATH_UNIVERSITY = "/university";
export const PATH_SECURITY = "/security";
export const PATH_SECURITY_PASSWORD = "/security/password";
export const PATH_SECURITY_2FA = "/security/2fa";
export const PATH_SECURITY_USERNAME = "/security/username";
export const PATH_SECURITY_SECRET = "/security/secret";
export const PATH_SECURITY_RESET = "/security/reset";
export const PATH_SETTINGS = "/settings";
export const PATH_SETTINGS_PREFERENCES = "/settings/preferences";
export const PATH_SETTINGS_SETTINGS = "/settings/settings";
export const PATH_TOKENS = "/tokens";
export const PATH_WEB3 = "/web3";
export const PATH_DAPP_TRANSACTIONS = "/dapp/popups/transactions";
export const PATH_DAPP_ACCOUNTS = "/dapp/popups/accounts";
export const PATH_DAPP_POPUPS = "/dapp/popups"; // base for all popups specific for dapps
export const PATH_ETHEREUM_TRANSACTIONS_SEND = "/accounts/ethereum/transactions/send";
export const PATH_ETHEREUM_TRANSACTIONS_RECV = "/accounts/ethereum/transactions/recv";
export const PATH_ETHEREUM_TRANSACTIONS_SWAP = "/accounts/ethereum/transactions/swap";
export const PATH_ETHEREUM_TRANSACTIONS_SELL = "/accounts/ethereum/transactions/sell";
export const PATH_ETHEREUM_TRANSACTIONS_STAKE = "/accounts/ethereum/transactions/stake";
export const PATH_ETHEREUM_TRANSACTIONS_BUY = "/accounts/ethereum/transactions/buy";

export enum EVMDenominations {
  ETH = 'ETH',
  GWEI = 'GWEI',
  WEI = 'WEI',
}

// Add other blockchain denominations


// Just temporary...
export const WEB3_SVG = '<svg height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" style="width: 28px; height: 28px;"><radialGradient id="injected-a" cx="1.813132%" cy="50%" r="98.186868%"><stop offset="0" stop-color="#424242"></stop><stop offset="1"></stop></radialGradient><g fill="none" fill-rule="evenodd"><path d="m256 0c141.384896 0 256 114.615104 256 256 0 141.384896-114.615104 256-256 256-141.384896 0-256-114.615104-256-256 0-141.384896 114.615104-256 256-256z" fill="url(#injected-a)"></path><path d="m137.902344 242.761719-15.820313 55.957031h-16.699219l-22.382812-84.550781h18.398438l13.183593 59.589843h.9375l15.410157-59.589843h14.941406l15.703125 59.589843h.9375l13.066406-59.589843h18.28125l-22.441406 84.550781h-16.582031l-15.996094-55.957031zm127.324218 40.839843v15.117188h-56.015624v-84.550781h56.015624v15.117187h-38.320312v19.746094h36.152344v14.003906h-36.152344v20.566406zm56.601563 15.117188h-37.96875v-84.550781h36.972656c16.40625 0 26.191407 8.027343 26.191407 21.09375 0 8.964843-6.621094 16.757812-15.292969 18.046875v1.054687c11.191406.820313 19.335937 9.257813 19.335937 20.15625 0 14.824219-11.191406 24.199219-29.238281 24.199219zm-20.273437-71.015625v21.503906h13.300781c9.550781 0 14.765625-3.925781 14.765625-10.722656 0-6.738281-4.863282-10.78125-13.300782-10.78125zm0 57.480469h15.761718c10.195313 0 15.703125-4.277344 15.703125-12.1875 0-7.734375-5.683593-11.835938-16.113281-11.835938h-15.351562zm84.433593-23.144532v-13.183593h10.3125c8.027344 0 13.476563-4.6875 13.476563-11.601563 0-6.796875-5.273438-11.132812-13.535156-11.132812-8.203126 0-13.652344 4.628906-14.121094 11.953125h-16.347656c.585937-15.996094 12.480468-26.074219 30.9375-26.074219 17.34375 0 29.824218 9.492188 29.824218 22.792969 0 9.785156-6.152344 17.402343-15.585937 19.335937v1.054688c11.601562 1.289062 18.867187 9.023437 18.867187 20.15625 0 14.824218-13.945312 25.546875-33.222656 25.546875-18.867188 0-31.640625-10.429688-32.402344-26.367188h16.933594c.527344 7.148438 6.5625 11.660157 15.644531 11.660157 8.847657 0 15-4.980469 15-12.1875 0-7.382813-5.800781-11.953126-15.292969-11.953126z" fill="#fff"></path></g></svg>';

export const WEB3_SVG_DATA = 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHdpZHRoPSI1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGFyaWEtaGlkZGVuPSJ0cnVlIiBmb2N1c2FibGU9ImZhbHNlIiBzdHlsZT0id2lkdGg6IDQ4cHg7IGhlaWdodDogNDhweDsiPjxyYWRpYWxHcmFkaWVudCBpZD0iaW5qZWN0ZWQtYSIgY3g9IjEuODEzMTMyJSIgY3k9IjUwJSIgcj0iOTguMTg2ODY4JSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNDI0MjQyIj48L3N0b3A+PHN0b3Agb2Zmc2V0PSIxIj48L3N0b3A+PC9yYWRpYWxHcmFkaWVudD48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Im0yNTYgMGMxNDEuMzg0ODk2IDAgMjU2IDExNC42MTUxMDQgMjU2IDI1NiAwIDE0MS4zODQ4OTYtMTE0LjYxNTEwNCAyNTYtMjU2IDI1Ni0xNDEuMzg0ODk2IDAtMjU2LTExNC42MTUxMDQtMjU2LTI1NiAwLTE0MS4zODQ4OTYgMTE0LjYxNTEwNC0yNTYgMjU2LTI1NnoiIGZpbGw9InVybCgjaW5qZWN0ZWQtYSkiPjwvcGF0aD48cGF0aCBkPSJtMTM3LjkwMjM0NCAyNDIuNzYxNzE5LTE1LjgyMDMxMyA1NS45NTcwMzFoLTE2LjY5OTIxOWwtMjIuMzgyODEyLTg0LjU1MDc4MWgxOC4zOTg0MzhsMTMuMTgzNTkzIDU5LjU4OTg0M2guOTM3NWwxNS40MTAxNTctNTkuNTg5ODQzaDE0Ljk0MTQwNmwxNS43MDMxMjUgNTkuNTg5ODQzaC45Mzc1bDEzLjA2NjQwNi01OS41ODk4NDNoMTguMjgxMjVsLTIyLjQ0MTQwNiA4NC41NTA3ODFoLTE2LjU4MjAzMWwtMTUuOTk2MDk0LTU1Ljk1NzAzMXptMTI3LjMyNDIxOCA0MC44Mzk4NDN2MTUuMTE3MTg4aC01Ni4wMTU2MjR2LTg0LjU1MDc4MWg1Ni4wMTU2MjR2MTUuMTE3MTg3aC0zOC4zMjAzMTJ2MTkuNzQ2MDk0aDM2LjE1MjM0NHYxNC4wMDM5MDZoLTM2LjE1MjM0NHYyMC41NjY0MDZ6bTU2LjYwMTU2MyAxNS4xMTcxODhoLTM3Ljk2ODc1di04NC41NTA3ODFoMzYuOTcyNjU2YzE2LjQwNjI1IDAgMjYuMTkxNDA3IDguMDI3MzQzIDI2LjE5MTQwNyAyMS4wOTM3NSAwIDguOTY0ODQzLTYuNjIxMDk0IDE2Ljc1NzgxMi0xNS4yOTI5NjkgMTguMDQ2ODc1djEuMDU0Njg3YzExLjE5MTQwNi44MjAzMTMgMTkuMzM1OTM3IDkuMjU3ODEzIDE5LjMzNTkzNyAyMC4xNTYyNSAwIDE0LjgyNDIxOS0xMS4xOTE0MDYgMjQuMTk5MjE5LTI5LjIzODI4MSAyNC4xOTkyMTl6bS0yMC4yNzM0MzctNzEuMDE1NjI1djIxLjUwMzkwNmgxMy4zMDA3ODFjOS41NTA3ODEgMCAxNC43NjU2MjUtMy45MjU3ODEgMTQuNzY1NjI1LTEwLjcyMjY1NiAwLTYuNzM4MjgxLTQuODYzMjgyLTEwLjc4MTI1LTEzLjMwMDc4Mi0xMC43ODEyNXptMCA1Ny40ODA0NjloMTUuNzYxNzE4YzEwLjE5NTMxMyAwIDE1LjcwMzEyNS00LjI3NzM0NCAxNS43MDMxMjUtMTIuMTg3NSAwLTcuNzM0Mzc1LTUuNjgzNTkzLTExLjgzNTkzOC0xNi4xMTMyODEtMTEuODM1OTM4aC0xNS4zNTE1NjJ6bTg0LjQzMzU5My0yMy4xNDQ1MzJ2LTEzLjE4MzU5M2gxMC4zMTI1YzguMDI3MzQ0IDAgMTMuNDc2NTYzLTQuNjg3NSAxMy40NzY1NjMtMTEuNjAxNTYzIDAtNi43OTY4NzUtNS4yNzM0MzgtMTEuMTMyODEyLTEzLjUzNTE1Ni0xMS4xMzI4MTItOC4yMDMxMjYgMC0xMy42NTIzNDQgNC42Mjg5MDYtMTQuMTIxMDk0IDExLjk1MzEyNWgtMTYuMzQ3NjU2Yy41ODU5MzctMTUuOTk2MDk0IDEyLjQ4MDQ2OC0yNi4wNzQyMTkgMzAuOTM3NS0yNi4wNzQyMTkgMTcuMzQzNzUgMCAyOS44MjQyMTggOS40OTIxODggMjkuODI0MjE4IDIyLjc5Mjk2OSAwIDkuNzg1MTU2LTYuMTUyMzQ0IDE3LjQwMjM0My0xNS41ODU5MzcgMTkuMzM1OTM3djEuMDU0Njg4YzExLjYwMTU2MiAxLjI4OTA2MiAxOC44NjcxODcgOS4wMjM0MzcgMTguODY3MTg3IDIwLjE1NjI1IDAgMTQuODI0MjE4LTEzLjk0NTMxMiAyNS41NDY4NzUtMzMuMjIyNjU2IDI1LjU0Njg3NS0xOC44NjcxODggMC0zMS42NDA2MjUtMTAuNDI5Njg4LTMyLjQwMjM0NC0yNi4zNjcxODhoMTYuOTMzNTk0Yy41MjczNDQgNy4xNDg0MzggNi41NjI1IDExLjY2MDE1NyAxNS42NDQ1MzEgMTEuNjYwMTU3IDguODQ3NjU3IDAgMTUtNC45ODA0NjkgMTUtMTIuMTg3NSAwLTcuMzgyODEzLTUuODAwNzgxLTExLjk1MzEyNi0xNS4yOTI5NjktMTEuOTUzMTI2eiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjwvZz48L3N2Zz4K';

export const PROVIDERS = {
    YAKKL: 'yakkl',
    INFURA: 'infura',
    ALCHEMY: 'alchemy',
    ETHERSCAN: 'etherscan',
};

export const PRICE_PROVIDERS = {
    ETHERSCAN: 'etherscan',
    COINBASE: 'coinbase',
    KRAKEN: 'kraken',
};

export const BLOCKCHAINS = {
    ETHEREUM: 'ethereum',
    BITCOIN: 'bitcoin',
    SOLANA: 'solana',
    CARDANO: 'cardano',
};

export const BLOCKCHAINS_NETWORKS = {
    ETHEREUM: {
        mainnet: 'mainnet',
        goerli: 'goerli', // Deprecates at end of 2023
        sepolia: 'sepolia',
    },
    BITCOIN: 'bitcoin',
    SOLANA: 'solana',
    CARDANO: 'cardano',
};

export const ENVIRONMENT_TYPES = {
    BACKGROUND: 'background',
    BROWSER: 'browser',
    NOTIFICATION: 'notification',
    POPUP: 'index',
};

export const PLATFORM_TYPES = {
    BRAVE: 'Brave',
    CHROME: 'Chrome',
    EDGE: 'Edge',
    FIREFOX: 'Firefox',
    OPERA: 'Opera',
    SAFARI: 'Safari',  // We don't support currently
};

export const TOKEN_IMAGES = {
    ETH_URL: './images/eth_logo.svg',
    BNB_URL: './images/bnb.png',
    MATIC_URL: './images/matic-token.png',
};

// Maybe change these to reflect the user_agent value
export const OS_TYPES = {
    OSX: 'OSX', //Mac
    WINDOWS: 'Windows',
    LINUX_REDHAT: 'Red Hat',
    LINUX_UBUNTU: 'Ubuntu',
    LINUX_OTHER: 'Linux',
    CHROME: 'Chrome OS',
    ANDROID: 'Android',
    IOS: "iOS",
};

export const SMART_TRANSACTION_STATUSES = {
    CANCELLED: 'cancelled',
    PENDING: 'pending',
    SUCCESS: 'success',
};


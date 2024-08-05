// EthereumProviderTypes.d.ts

// Interface for provider information following EIP-6963.
export interface EIP6963ProviderInfo {
  walletId: string; // Unique identifier for the wallet  
  uuid: string; // Globally unique ID to differentiate between provider sessions for the lifetime of the page
  name: string; // Human-readable name of the wallet
  icon: string; // URL to the wallet's icon
  rdns: string; // Reverse domain name system (DNS) for the wallet
}

// Interface for Ethereum providers based on the EIP-1193 standard.
export interface EIP1193Provider {
  isStatus?: boolean; // Optional: Indicates the status of the provider
  host?: string; // Optional: Host URL of the Ethereum node
  path?: string; // Optional: Path to a specific endpoint or service on the host
  sendAsync?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void; // For sending asynchronous requests
  send?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void; // For sending synchronous requests
  announce: () => void; // Required due possible undefined if declared optional: Method for announcing the provider - can be used another way if desired
  request: (request: { method: string, params?: Array<unknown> }) => Promise<unknown>; // Standard method for sending requests per EIP-1193
}

// Interface detailing the structure of provider information and its Ethereum provider.
export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo; // The provider's info
  provider: EIP1193Provider; // The EIP-1193 compatible provider
}

// Type representing the event structure for announcing a provider based on EIP-6963.
export type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo; // The provider's info
    provider: EIP1193Provider; // The EIP-1193 compatible provider
  }
}

// Announce Event dispatched by a Wallet
export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

// Request Event dispatched by a DApp
export interface EIP6963RequestProviderEvent extends Event {
  type: "eip6963:requestProvider";
}

export type BaseProviderState = {
  accounts: null | string[];
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
};

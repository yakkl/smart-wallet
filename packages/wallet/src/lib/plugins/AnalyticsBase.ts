import type { Provider } from "./Provider";

// lib/analytics/AnalyticsBase.ts
export enum Web3Provider {
  ALCHEMY = 'alchemy',
  INFURA = 'infura',
  CLOUDFLARE = 'cloudflare',
  QUICKNODE = 'quicknode',
  CUSTOM = 'custom'
}

export interface BlockchainNetworkInfo {
  provider: Web3Provider;
  chainId: number;
  networkName: string;
  rpcLatency?: number;      // Response time from RPC calls
  blockNumber?: number;     // Current block number
  isSyncing?: boolean;      // Network sync status
  peers?: number;           // Number of peers (if available)
  providerUrl?: string;     // RPC endpoint (masked for security)
}

export interface GasAnalytics {
  timestamp: number;
  estimateType: 'normal' | 'fallback' | 'optimized' | 'historical' | 'prediction';
  gasLimit: string;
  priorityFee: string;
  maxFee: string;
  baseFee?: string;
  success: boolean;
  networkInfo: BlockchainNetworkInfo;
  errorMessage?: string;
  methodName?: string;      // Which method was called
  fallbackReason?: string;  // Why fallback was used
}

export interface SwapAnalytics extends GasAnalytics {
  tokenInSymbol: string;
  tokenOutSymbol: string;
  amount: string;
  isMultiHop: boolean;
  swapType: 'exactIn' | 'exactOut';
  dexUsed: string;         // e.g., 'Uniswap V3'
  routeHops?: number;
}

export abstract class AnalyticsBase {
  networkInfo: BlockchainNetworkInfo;
  provider: Provider;

  constructor(
    provider: Provider,
    web3Provider: Web3Provider,
    chainId: number,
    networkName: string
  ) {
    this.provider = provider;
    this.networkInfo = {
      provider: web3Provider,
      chainId,
      networkName
    };
  }

  protected abstract initializeNetworkInfo(): Promise<void>;
  abstract trackGasEstimate(data: GasAnalytics): void;
  abstract trackSwapEstimate(data: SwapAnalytics): void;
  abstract getAnalyticsSummary(): Promise<any>;
}

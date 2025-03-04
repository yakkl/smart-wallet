// lib/analytics/EthereumAnalytics.ts
import {
  AnalyticsBase,
  type GasAnalytics,
  type SwapAnalytics,
  type BlockchainNetworkInfo,
  Web3Provider
} from '$plugins/AnalyticsBase';
import { log } from '$plugins/Logger';
import type { Provider } from '$plugins/Provider';
import { ethers as ethersv6 } from 'ethers-v6';

interface EstimateStats {
  total: number;
  successful: number;
  fallbackUsed: number;
  averageGasPrice: bigint;
  averageLatency: number;
  commonErrors: Map<string, number>;
  methodUsage: Map<string, number>;
  lastBlockNumber: number;
  timeWindow: {
    start: number;
    end: number;
  };
}

interface ProviderStats {
  totalCalls: number;
  failedCalls: number;
  averageLatency: number;
  lastError?: string;
  lastErrorTime?: number;
}

export class EthereumAnalytics extends AnalyticsBase {
  private gasEstimates: GasAnalytics[] = [];
  private swapEstimates: SwapAnalytics[] = [];
  private readonly MAX_STORED_ENTRIES = 1000;
  private providerStats: Map<string, ProviderStats> = new Map();
  private lastNetworkCheck: number = 0;
  private readonly NETWORK_CHECK_INTERVAL = 60000;

  constructor(
    provider: Provider,
    web3Provider: Web3Provider,
    chainId: number,
    networkName: string
  ) {
    super(provider, web3Provider, chainId, networkName);
    this.initializeProviderStats();
  }

  static async create(
    provider: Provider,
    web3Provider: Web3Provider,
    chainId: number,
    networkName: string
  ): Promise<EthereumAnalytics> {
    const analytics = new EthereumAnalytics(provider, web3Provider, chainId, networkName);
    await analytics.initializeNetworkInfo();
    return analytics;
  }

  private initializeProviderStats() {
    this.providerStats.set(this.networkInfo.provider, {
      totalCalls: 0,
      failedCalls: 0,
      averageLatency: 0
    });
  }

  protected async initializeNetworkInfo(): Promise<void> {
    try {
      const startTime = Date.now();

      // Get network status
      const blockNumber = await this.provider.getBlockNumber();
      const latency = Date.now() - startTime;

      this.networkInfo = {
        ...this.networkInfo,
        blockNumber,
        rpcLatency: latency,
        providerUrl: this.maskProviderUrl(await this.provider.getProviderURL())
      };

      this.updateProviderStats('initializeNetworkInfo', true, latency);
    } catch (error) {
      log.error('Failed to initialize network info:', false, false, error);
      // Don't throw here, just log the error
    }
  }

  private maskProviderUrl(url?: string): string {
    if (!url) return 'unknown';
    try {
      const urlObj = new URL(url);
      // Mask API keys and sensitive info
      return `${urlObj.protocol}//${urlObj.hostname}/*****`;
    } catch {
      return 'invalid-url';
    }
  }

  private updateProviderStats(
    method: string,
    success: boolean,
    latency: number,
    error?: Error
  ) {
    const stats = this.providerStats.get(this.networkInfo.provider) || {
      totalCalls: 0,
      failedCalls: 0,
      averageLatency: 0
    };

    stats.totalCalls++;
    if (!success) {
      stats.failedCalls++;
      stats.lastError = error?.message;
      stats.lastErrorTime = Date.now();
    }

    // Update rolling average latency
    stats.averageLatency = (stats.averageLatency * (stats.totalCalls - 1) + latency) / stats.totalCalls;

    this.providerStats.set(this.networkInfo.provider, stats);
  }

  async trackGasEstimate(data: GasAnalytics) {
    // Check if network info needs refresh
    await this.checkAndUpdateNetworkInfo();

    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      networkInfo: { ...this.networkInfo }
    };

    this.gasEstimates.push(enrichedData);

    // Maintain array size
    if (this.gasEstimates.length > this.MAX_STORED_ENTRIES) {
      this.gasEstimates.shift();
    }

    // Update provider stats
    this.updateProviderStats(
      data.methodName || 'gasEstimate',
      data.success,
      this.networkInfo.rpcLatency || 0
    );

    // Log significant events
    if (!data.success) {
      log.warn(`Gas estimation failed for ${data.methodName}:`, false, data.errorMessage);
    }
    if (data.estimateType === 'fallback') {
      log.info(`Using fallback gas estimation for ${data.methodName}:`, false, data.fallbackReason);
    }
  }

  async trackSwapEstimate(data: SwapAnalytics) {
    await this.checkAndUpdateNetworkInfo();

    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      networkInfo: { ...this.networkInfo }
    };

    this.swapEstimates.push(enrichedData);

    if (this.swapEstimates.length > this.MAX_STORED_ENTRIES) {
      this.swapEstimates.shift();
    }

    // Track specific swap analytics
    this.updateProviderStats(
      `swap_${data.swapType}`,
      data.success,
      this.networkInfo.rpcLatency || 0
    );
  }

  private async checkAndUpdateNetworkInfo(): Promise<void> {
    const now = Date.now();
    if (now - this.lastNetworkCheck > this.NETWORK_CHECK_INTERVAL) {
      await this.initializeNetworkInfo();
      this.lastNetworkCheck = now;
    }
  }

  async getAnalyticsSummary(): Promise<{
    gasStats: EstimateStats;
    swapStats: EstimateStats;
    providerHealth: Map<string, ProviderStats>;
    networkInfo: BlockchainNetworkInfo;
  }> {
    await this.checkAndUpdateNetworkInfo();

    return {
      gasStats: this.calculateGasStats(this.gasEstimates),
      swapStats: this.calculateSwapStats(this.swapEstimates),
      providerHealth: this.providerStats,
      networkInfo: this.networkInfo
    };
  }

  private calculateGasStats(estimates: GasAnalytics[]): EstimateStats {
    const timeWindow = {
      start: estimates[0]?.timestamp || Date.now(),
      end: estimates[estimates.length - 1]?.timestamp || Date.now()
    };

    const commonErrors = new Map<string, number>();
    const methodUsage = new Map<string, number>();

    let totalGasPrice = 0n;
    let totalLatency = 0;

    estimates.forEach(e => {
      if (e.errorMessage) {
        commonErrors.set(e.errorMessage, (commonErrors.get(e.errorMessage) || 0) + 1);
      }
      if (e.methodName) {
        methodUsage.set(e.methodName, (methodUsage.get(e.methodName) || 0) + 1);
      }
      totalGasPrice += BigInt(e.maxFee);
      totalLatency += e.networkInfo.rpcLatency || 0;
    });

    return {
      total: estimates.length,
      successful: estimates.filter(e => e.success).length,
      fallbackUsed: estimates.filter(e => e.estimateType === 'fallback').length,
      averageGasPrice: estimates.length ? totalGasPrice / BigInt(estimates.length) : 0n,
      averageLatency: estimates.length ? totalLatency / estimates.length : 0,
      commonErrors,
      methodUsage,
      lastBlockNumber: this.networkInfo.blockNumber || 0,
      timeWindow
    };
  }

  private calculateSwapStats(estimates: SwapAnalytics[]): EstimateStats & {
    averageHops: number;
    popularPairs: Map<string, number>;
  } {
    const baseStats = this.calculateGasStats(estimates);
    const popularPairs = new Map<string, number>();
    let totalHops = 0;

    estimates.forEach(e => {
      const pair = `${e.tokenInSymbol}/${e.tokenOutSymbol}`;
      popularPairs.set(pair, (popularPairs.get(pair) || 0) + 1);
      totalHops += e.routeHops || 1;
    });

    return {
      ...baseStats,
      averageHops: estimates.length ? totalHops / estimates.length : 0,
      popularPairs
    };
  }

  getProviderHealth(): string {
    const stats = this.providerStats.get(this.networkInfo.provider);
    if (!stats) return 'Unknown';

    const successRate = (stats.totalCalls - stats.failedCalls) / stats.totalCalls;
    const latency = stats.averageLatency;

    if (successRate > 0.99 && latency < 500) return 'Excellent';
    if (successRate > 0.95 && latency < 1000) return 'Good';
    if (successRate > 0.90 && latency < 2000) return 'Fair';
    return 'Poor';
  }
}

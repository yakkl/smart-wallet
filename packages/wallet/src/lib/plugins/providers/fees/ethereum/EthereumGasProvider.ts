/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// EthereumGasProvider.ts

import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import {
  type GasProvider,
  type GasEstimate,
  type HistoricalGasData,
  type GasPrediction,
  type GasFeeOptions,
  type GasFeeEstimate,
  TransactionSpeed,
  type FeeEstimate,
  EOA_FALLBACK_GAS,
} from '$lib/common/gas-types';
import type { PriceProvider, SwapToken, TransactionRequest } from '$lib/common/interfaces';
import type { Blockchain, Wallet } from '$lib/plugins';
import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
import { log } from '$plugins/Logger';
import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
import type { Provider } from '$plugins/Provider';
import { ethers as ethersv6 } from 'ethers-v6';
import { Web3Provider } from '$plugins/AnalyticsBase';
import { EthereumAnalytics } from '$lib/plugins/blockchains/evm/ethereum/EthereumAnalytics';

const DEFAULT_GAS_ESTIMATES = {
  ERC20_APPROVE: 46000n,
  SWAP_EXACT_IN: 180000n,
  SWAP_EXACT_OUT: 250000n
};


export class EthereumGasProvider implements GasProvider {
  private provider: Provider;
  private blockchain: Ethereum;
  private priceProvider: PriceProvider;
  private analytics: EthereumAnalytics;

  private readonly PRIORITY_FEE_MULTIPLIERS = {
    [TransactionSpeed.SLOW]: 1n,
    [TransactionSpeed.NORMAL]: 2n,
    [TransactionSpeed.FAST]: 3n
  };

  private readonly BASE_FEE_MULTIPLIERS = {
    [TransactionSpeed.SLOW]: 1.2,
    [TransactionSpeed.NORMAL]: 1.5,
    [TransactionSpeed.FAST]: 2.0
  };

  private readonly FALLBACK_MULTIPLIERS = {
    [TransactionSpeed.SLOW]: 0.8,
    [TransactionSpeed.NORMAL]: 1,
    [TransactionSpeed.FAST]: 1.5
  };

  private readonly SAFE_FALLBACK_VALUES = {
    BASE_PRIORITY_FEE: 1n,
    MAX_TOTAL_GWEI: 100n,
    MIN_TOTAL_GWEI: 25n
  };

  private readonly MIN_PRIORITY_FEE = 1n;

  private constructor(
    provider: Provider,
    blockchain: Ethereum,
    priceProvider: PriceProvider,
    analytics: EthereumAnalytics
  ) {
    this.provider = provider;
    this.blockchain = blockchain;
    this.priceProvider = priceProvider;
    this.analytics = analytics;
  }

  static async create(
    provider: Provider,
    blockchain: Blockchain,
    priceProvider: PriceProvider
  ): Promise<EthereumGasProvider> {
    const web3ProviderType = await this.determineProviderType(provider);
    const network = blockchain.getNetwork();

    const analytics = await EthereumAnalytics.create(
      provider,
      web3ProviderType,
      network.chainId,
      network.name
    );

    return new EthereumGasProvider(
      provider,
      blockchain as Ethereum,
      priceProvider,
      analytics
    );
  }

  private static async determineProviderType(provider: Provider): Promise<Web3Provider> {
    const providerUrl = await provider.getProviderURL() || '';

    if (providerUrl.includes('alchemy')) return Web3Provider.ALCHEMY;
    if (providerUrl.includes('infura')) return Web3Provider.INFURA;
    if (providerUrl.includes('cloudflare')) return Web3Provider.CLOUDFLARE;
    if (providerUrl.includes('quiknode')) return Web3Provider.QUICKNODE;
    return Web3Provider.CUSTOM;
  }

getName(): string {
    return "EthereumGasProvider";
  }

  async getFallbackGasPrice(speed: TransactionSpeed = TransactionSpeed.NORMAL): Promise<bigint> {
    try {
      const recentGasPrice = await this.provider.getGasPrice();
      const multiplier = this.FALLBACK_MULTIPLIERS[speed];
      return BigInt(Number(recentGasPrice) * multiplier);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackGasEstimate({
        estimateType: 'fallback',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'getFallbackGasPrice',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        fallbackReason: 'Gas price fetch failed'
      });
      return EOA_FALLBACK_GAS.GWEI[speed].MAX_FEE * BigInt(1e9);
    }
  }

  async getOptimizedGasFees(
    gasLimit: bigint,
    options: GasFeeOptions = {}
  ): Promise<GasFeeEstimate> {
    try {
      const speed = options.speed || TransactionSpeed.NORMAL;
      const feeData = await this.provider.getFeeData();

      // Calculate priority fee
      let priorityFeePerGas: bigint;
      if (options.customPriorityFee) {
        priorityFeePerGas = options.customPriorityFee;
      } else {
        const basePriorityFee = BigInt(Math.max(
          Number(feeData.maxPriorityFeePerGas || this.MIN_PRIORITY_FEE),
          Number(this.MIN_PRIORITY_FEE)
        ));
        priorityFeePerGas = basePriorityFee * this.PRIORITY_FEE_MULTIPLIERS[speed];
      }

      // Calculate max fee
      let maxFeePerGas: bigint;
      if (options.customMaxFee) {
        maxFeePerGas = options.customMaxFee;
      } else {
        const baseFee = feeData.lastBaseFeePerGas || 0n;
        const multiplier = this.BASE_FEE_MULTIPLIERS[speed];
        maxFeePerGas = baseFee * BigInt(multiplier * 10) / 10n + priorityFeePerGas;
      }

      // Calculate estimated cost
      const estimatedCostWei = gasLimit * maxFeePerGas;
      const estimatedCostEth = ethersv6.formatEther(estimatedCostWei);
      const ethPrice = await this.getEthPrice();
      const estimatedCostUsd = (Number(estimatedCostEth) * ethPrice).toFixed(2);

      const result = {
        maxPriorityFeePerGas: priorityFeePerGas,
        maxFeePerGas: maxFeePerGas,
        estimatedCostWei: estimatedCostWei,
        estimatedCostEth: estimatedCostEth,
        estimatedCostUsd: `$${estimatedCostUsd}`
      };

      this.analytics.trackGasEstimate({
        estimateType: 'optimized',
        gasLimit: gasLimit.toString(),
        priorityFee: priorityFeePerGas.toString(),
        maxFee: maxFeePerGas.toString(),
        success: true,
        methodName: 'getOptimizedGasFees',
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackGasEstimate({
        estimateType: 'fallback',
        gasLimit: gasLimit.toString(),
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'getOptimizedGasFees',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        fallbackReason: 'Optimization failed'
      });
      throw error;
    }
  }

  async getGasEstimate(
    transaction: TransactionRequest,
    options: GasFeeOptions = {}
  ): Promise<GasEstimate> {
    try {
      const gasLimit = await this.provider.estimateGas(transaction);
      const optimizedFees = await this.getOptimizedGasFees(gasLimit, options);

      const result = {
        gasLimit: gasLimit.toString(),
        feeEstimate: {
          baseFee: (optimizedFees.maxFeePerGas - optimizedFees.maxPriorityFeePerGas).toString(),
          priorityFee: optimizedFees.maxPriorityFeePerGas.toString(),
          totalFee: optimizedFees.maxFeePerGas.toString(),
          estimatedCostEth: optimizedFees.estimatedCostEth,
          estimatedCostUsd: optimizedFees.estimatedCostUsd
        }
      };

      this.analytics.trackGasEstimate({
        estimateType: 'normal',
        gasLimit: gasLimit.toString(),
        priorityFee: optimizedFees.maxPriorityFeePerGas.toString(),
        maxFee: optimizedFees.maxFeePerGas.toString(),
        success: true,
        methodName: 'getGasEstimate',
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackGasEstimate({
        estimateType: 'fallback',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'getGasEstimate',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        fallbackReason: 'Estimation failed'
      });
      throw error;
    }
  }

  async getSafeGasEstimate(
    to: string,
    value: bigint,
    options: GasFeeOptions = {}
  ): Promise<GasEstimate> {
    try {
      const estimate = await this.getEOATransferGasEstimate(to, value, options);

      const totalGwei = EthereumBigNumber.from(estimate.feeEstimate.totalFee).toBigInt();
      if (totalGwei > this.SAFE_FALLBACK_VALUES.MAX_TOTAL_GWEI) {
        throw new Error('Gas estimate too high');
      }
      if (totalGwei < this.SAFE_FALLBACK_VALUES.MIN_TOTAL_GWEI) {
        throw new Error('Gas estimate too low');
      }

      return estimate;
    } catch (error: unknown) {
      const baseGasPrice = await this.getFallbackGasPrice(options.speed);
      const priorityFee = this.SAFE_FALLBACK_VALUES.BASE_PRIORITY_FEE * BigInt(1e9);
      const maxFee = baseGasPrice + priorityFee;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.analytics.trackGasEstimate({
        estimateType: 'fallback',
        gasLimit: '21000',
        priorityFee: priorityFee.toString(),
        maxFee: maxFee.toString(),
        success: false,
        methodName: 'getSafeGasEstimate',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        fallbackReason: 'Safe estimate bounds exceeded'
      });

      return {
        gasLimit: '21000',
        feeEstimate: {
          baseFee: baseGasPrice.toString(),
          priorityFee: priorityFee.toString(),
          totalFee: maxFee.toString(),
          estimatedCostEth: ethersv6.formatEther(21000n * maxFee),
          estimatedCostUsd: 'Using fallback values'
        }
      };
    }
  }

  async getEOATransferGasEstimate(
    to: string,
    value: bigint,
    options: GasFeeOptions = {}
  ): Promise<GasEstimate> {
    const transaction: TransactionRequest = {
      to,
      value,
      from: '0x0000000000000000000000000000000000000000',
      chainId: this.blockchain.getChainId()
    };

    return this.getGasEstimate(transaction, options);
  }

  async getEOATransferGasEstimateWithFallback(
    to: string,
    value: bigint,
    options: GasFeeOptions = {}
  ): Promise<GasEstimate> {
    try {
      return await this.getEOATransferGasEstimate(to, value, options);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Gas estimation failed, using fallback values:', false, errorMessage);

      const speed = options.speed || TransactionSpeed.NORMAL;
      const fallbackValues = EOA_FALLBACK_GAS.GWEI[speed];

      this.analytics.trackGasEstimate({
        estimateType: 'fallback',
        gasLimit: EOA_FALLBACK_GAS.LIMITS.BASE.toString(),
        priorityFee: fallbackValues.PRIORITY_FEE.toString(),
        maxFee: fallbackValues.MAX_FEE.toString(),
        success: false,
        methodName: 'getEOATransferGasEstimateWithFallback',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        fallbackReason: 'Estimation failed, using fallback'
      });

      return {
        gasLimit: EOA_FALLBACK_GAS.LIMITS.BASE.toString(),
        feeEstimate: {
          baseFee: (fallbackValues.MAX_FEE - fallbackValues.PRIORITY_FEE).toString(),
          priorityFee: fallbackValues.PRIORITY_FEE.toString(),
          totalFee: fallbackValues.MAX_FEE.toString(),
          estimatedCostEth: ethersv6.formatEther(
            EOA_FALLBACK_GAS.LIMITS.BASE * fallbackValues.MAX_FEE * BigInt(1e9)
          ),
          estimatedCostUsd: 'Fallback estimate'
        }
      };
    }
  }

  async getHistoricalGasData(duration: number): Promise<HistoricalGasData[]> {
    try {
      // Implement the logic to fetch historical gas data from an external API or indexer
      // For example, you can use a service like Etherscan or Infura to retrieve historical gas data
      // You'll need to make an HTTP request to the API endpoint and parse the response
      // The response should contain the historical gas data for the specified duration
      // Map the response data to the HistoricalGasData interface and return it

      // Example using a mock API response
      const response = await fetch('https://api.example.com/historical-gas-data');
      const data = await response.json();

      const historicalData = data.map((item: any) => ({
        timestamp: item.timestamp,
        baseFee: item.baseFeePerGas,
        priorityFee: item.priorityFeePerGas
      }));

      this.analytics.trackGasEstimate({
        estimateType: 'historical',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: true,
        methodName: 'getHistoricalGasData',
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      return historicalData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Error fetching historical gas data:', false, errorMessage);

      this.analytics.trackGasEstimate({
        estimateType: 'historical',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'getHistoricalGasData',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  async predictFutureFees(duration: number): Promise<GasPrediction[]> {
    try {
      const historicalData = await this.getHistoricalGasData(duration);
      const predictions = historicalData.map((item) => ({
        timestamp: item.timestamp + duration,
        estimatedBaseFee: item.baseFee,
        estimatedPriorityFee: item.priorityFee
      }));

      this.analytics.trackGasEstimate({
        estimateType: 'prediction',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: true,
        methodName: 'predictFutureFees',
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      return predictions;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Error predicting future gas fees:', false, errorMessage);

      this.analytics.trackGasEstimate({
        estimateType: 'prediction',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'predictFutureFees',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  async estimateSwapGasFee(
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    fromAmount: BigNumberish,
    slippageTolerance: number,
    deadline: number,
    swapManager: UniswapSwapManager,
    fee: number = 3000
  ): Promise<string> {
    try {
      // Base gas units for different operations
      const BASE_SWAP_GAS = 150000n;
      const APPROVAL_GAS = 46000n;

      // Calculate total gas units needed
      let totalGasUnits = BASE_SWAP_GAS;
      if (!tokenIn.isNative) {
        totalGasUnits += APPROVAL_GAS;
      }

      // Get current gas prices
      const feeData = await this.provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
      if (!maxFeePerGas) throw new Error('Could not get gas price');

      // Calculate total gas cost in wei
      const gasCostWei = totalGasUnits * BigInt(maxFeePerGas.toString());

      // Convert to ETH
      const gasCostEth = EthereumBigNumber.fromWei(gasCostWei.toString()).toEtherString();

      // Get ETH price
      const ethPrice = await this.getEthPrice();

      // Calculate USD cost
      const gasCostUsd = parseFloat(gasCostEth) * ethPrice;

      this.analytics.trackSwapEstimate({
        estimateType: 'normal',
        gasLimit: totalGasUnits.toString(),
        priorityFee: feeData.maxPriorityFeePerGas?.toString() || '0',
        maxFee: maxFeePerGas.toString(),
        success: true,
        methodName: 'estimateSwapGasFee',
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        tokenInSymbol: tokenIn.symbol,
        tokenOutSymbol: tokenOut.symbol,
        amount: fromAmount.toString(),
        isMultiHop: false,
        swapType: 'exactIn',
        dexUsed: 'Uniswap V3'
      });

      return `$${gasCostUsd.toFixed(2)} (${gasCostEth} ETH)`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('Gas estimation error:', false, errorMessage);

      this.analytics.trackSwapEstimate({
        estimateType: 'fallback',
        gasLimit: '0',
        priorityFee: '0',
        maxFee: '0',
        success: false,
        methodName: 'estimateSwapGasFee',
        errorMessage,
        networkInfo: this.analytics.networkInfo,
        timestamp: Date.now(),
        tokenInSymbol: tokenIn.symbol,
        tokenOutSymbol: tokenOut.symbol,
        amount: fromAmount.toString(),
        isMultiHop: false,
        swapType: 'exactIn',
        dexUsed: 'Uniswap V3'
      });

      return 'Unable to estimate gas';
    }
  }

  // First one was tested after bottom one
  // async estimateSwapGasFee(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   fromAmount: BigNumberish,
  //   slippageTolerance: number,
  //   deadline: number,
  //   swapManager: UniswapSwapManager,
  //   fee: number = 3000,
  //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000'
  // ): Promise<string> {
  //   try {
  //     // Convert input values
  //     const fromAmountBN = EthereumBigNumber.from(fromAmount);
  //     const slippageBN = fromAmountBN.mul(Math.floor(slippageTolerance * 10)).div(1000);
  //     const minAmountOut = fromAmountBN.sub(slippageBN);
  //     const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;
  //     let totalGasEstimate: bigint;

  //     try {
  //       // Attempt to get the exact gas estimate
  //       const swapGasEstimate = await swapManager.populateSwapTransaction(
  //         Token.fromSwapToken(tokenIn, this.blockchain, this.provider),
  //         Token.fromSwapToken(tokenOut, this.blockchain, this.provider),
  //         fromAmountBN.toString(),
  //         minAmountOut.toString(),
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         fee,
  //         true
  //       );

  //       // Check if the result is a bigint (gas estimate) or a TransactionRequest
  //       if (typeof swapGasEstimate === 'bigint') {
  //         totalGasEstimate = swapGasEstimate;
  //       } else {
  //         // Use default estimates based on transaction type
  //         const isMultiHop = false; // Optional: Set this dynamically based on external logic if available
  //         totalGasEstimate = isMultiHop ? 200000n : 150000n;
  //       }

  //       // Add approval gas if not native
  //       if (!tokenIn.isNative) {
  //         totalGasEstimate += 46000n;
  //       }
  //     } catch {
  //       log.error('Gas estimation failed, using default.');
  //       totalGasEstimate = (tokenIn.isNative ? 150000n : 196000n);
  //     }

  //     // Calculate fee in ETH and USD
  //     const feeData = await this.provider.getFeeData();
  //     const gasPriceGwei = EthereumBigNumber.from(feeData.maxFeePerGas || feeData.gasPrice || 0);
  //     const gasFeeGwei = EthereumBigNumber.from(totalGasEstimate).mul(gasPriceGwei);
  //     const gasFeeEth = EthereumBigNumber.fromGwei(gasFeeGwei.toString()).toEtherString();
  //     const ethPrice = await this.getEthPrice();
  //     const gasFeeUsd = parseFloat(gasFeeEth) * ethPrice;

  //     return `$${gasFeeUsd.toFixed(2)} (${gasFeeEth} ETH)`;
  //   } catch (error) {
  //     log.error('Error estimating swap gas fee:', false, error);
  //     return 'N/A';
  //   }
  // }

  // async estimateSwapGasFee(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   fromAmount: BigNumberish,
  //   slippageTolerance: number,
  //   deadline: number,
  //   swapManager: UniswapSwapManager,
  //   fee: number = 3000,
  //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000' // Dummy from address for ETH swaps estimates
  // ): Promise<string> {
  //   try {
  //     if (!tokenIn || !tokenOut || !fromAmount || !slippageTolerance || !deadline || !swapManager) {
  //       return 'N/A'; //'Invalid parameters'; // Return an error message if any required parameters are missing
  //     }

  //     const fromAmountBN = EthereumBigNumber.from(fromAmount);
  //     const slippageBN = fromAmountBN.mul(Math.floor(slippageTolerance * 10)).div(1000);
  //     const minAmountOut = fromAmountBN.sub(slippageBN);
  //     const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);

  //     let totalGasEstimate: bigint;

  //     try {
  //       const swapGasEstimate = await swapManager.populateSwapTransaction(
  //         Token.fromSwapToken(tokenIn, this.blockchain, this.provider),
  //         Token.fromSwapToken(tokenOut, this.blockchain, this.provider),
  //         fromAmountBN.toString(),
  //         minAmountOut.toString(),
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         fee,
  //         true
  //       );

  //       if (typeof swapGasEstimate === 'bigint') {
  //         totalGasEstimate = swapGasEstimate;
  //       } else {
  //         // If we couldn't get an exact estimate, use defaults
  //         totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

  //         // Add approval gas if it's not a native token
  //         if (!tokenIn.isNative) {
  //           totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
  //         }
  //       }
  //     } catch (error) {
  //       log.error('Gas estimation failed, using defaults...');

  //       // Use default estimates
  //       totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

  //       // Add approval gas if it's not a native token
  //       if (!tokenIn.isNative) {
  //         totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
  //       }
  //     }

  //     // Calculate fee in ETH
  //     const feeData = await this.provider.getFeeData();
  //     const gasPriceGwei = EthereumBigNumber.from(feeData.maxFeePerGas || feeData.gasPrice || 0);
  //     const gasFeeGwei = EthereumBigNumber.from(totalGasEstimate).mul(gasPriceGwei);
  //     const gasFeeEth = EthereumBigNumber.fromGwei(gasFeeGwei.toString()).toEtherString();

  //     // Get ETH price and calculate USD value
  //     const ethPrice = await this.getEthPrice();
  //     const gasFeeUsd = parseFloat(gasFeeEth) * ethPrice;

  //     return `$${gasFeeUsd.toFixed(2)} (${gasFeeEth} ETH)`;
  //   } catch (error) {
  //     log.error('Error estimating swap gas fee:', false, error);
  //     // Even if everything fails, return a conservative estimate
  //     const conservativeGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN +
  //       (!tokenIn.isNative ? DEFAULT_GAS_ESTIMATES.ERC20_APPROVE : 0n);

  //     try {
  //       const feeData = await this.provider.getFeeData();
  //       const gasPriceGwei = EthereumBigNumber.from(feeData.maxFeePerGas || feeData.gasPrice || 0);
  //       const gasFeeGwei = EthereumBigNumber.from(conservativeGasEstimate).mul(gasPriceGwei);
  //       const gasFeeEth = EthereumBigNumber.fromGwei(gasFeeGwei.toString()).toEtherString();
  //       const ethPrice = await this.getEthPrice();
  //       const gasFeeUsd = parseFloat(gasFeeEth) * ethPrice;

  //       return `≈ $${gasFeeUsd.toFixed(2)} (${gasFeeEth} ETH)`;
  //     } catch {
  //       return 'N/A';
  //     }
  //   }
  // }

  async getEthPrice(): Promise<number> {
    try {
      log.debug('getEthPrice - priceProvider', false, this.priceProvider);

      const marketPrice = this.priceProvider.getMarketPrice('ETH-USD');
      return (await marketPrice).price;
    } catch (error) {
      log.error('Error fetching ETH price:', false, false, error);
      return 0;
    }
  }

  async getCurrentGasPriceInGwei(factor: number = 1): Promise<number> {
    const gasPrice = await this.provider.getGasPrice();
    return Number(ethersv6.formatUnits(gasPrice, "gwei")) * factor;
  }

  async getGasPriceFromEtherscan(apiKey: string): Promise<number> {
    const response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`);
    const data = await response.json();
    return Number(data.result.ProposeGasPrice);
  }

  async getFormattedGasEstimates(
    gasEstimate: BigNumberish,
    factor: number = 1.5,
    gasPriceInGwei: number = 0,
    ethPriceInUsd: number = 0
  ) {
    if (!gasEstimate) {
      throw new Error("Gas estimate must be provided");
    }

    const gasEstimateBigInt = BigNumber.from(gasEstimate).toBigInt();

    if (gasEstimateBigInt! <= 0n) {
      return 0;
    }

    if (factor <= 0) {
      factor = 1;
      log.warn('Factor must be greater than 0 - set to 1');
    }

    if (gasPriceInGwei < 0) {
      gasPriceInGwei = 0;
      log.warn('Gas price must be greater than or equal to 0 - set to 0');
    }

    if (ethPriceInUsd <= 0) {
      ethPriceInUsd = 0;
      log.warn('ETH price must be greater than 0 - set to 0');
    }

    if (gasPriceInGwei === 0) {
      gasPriceInGwei = await this.getCurrentGasPriceInGwei(factor);
    }

    if (ethPriceInUsd === 0) {
      ethPriceInUsd = await this.getEthPrice();
    }

    const gasPriceInEth = gasPriceInGwei * 1e-9;
    const gasEstimateInEth = Number(gasEstimate) * gasPriceInEth;
    const gasEstimateInUsd = gasEstimateInEth * ethPriceInUsd;

    return gasEstimateInUsd;
  }

  setPriceProvider(priceProvider: PriceProvider): void {
    this.priceProvider = priceProvider;
  }
}









// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // EthereumGasProvider.ts

// import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
// import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
// import { log.debug } from '$lib/common/debug-error';
// // import { ETH_BASE_UNISWAP_GAS_UNITS } from '$lib/common/constants';
// import type {
//   GasProvider,
//   GasEstimate,
//   HistoricalGasData,
//   GasPrediction,
//   FeeEstimate
// } from '$lib/common/gas-types';
// import type { PriceProvider, SwapToken, TransactionRequest } from '$lib/common/interfaces';
// import type { Blockchain, Wallet } from '$lib/plugins';
// import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
// import { log } from '$lib/plugins/Logger';
// import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
// import type { Provider } from '$plugins/Provider';
// import { ethers as ethersv6 } from 'ethers-v6';

// const DEFAULT_GAS_ESTIMATES = {
//   ERC20_APPROVE: 46000n,
//   SWAP_EXACT_IN: 180000n,
//   SWAP_EXACT_OUT: 250000n
// };

// export class EthereumGasProvider implements GasProvider {
//   private provider: Provider;
//   private blockchain: Ethereum;
//   private priceProvider: PriceProvider;

//   constructor ( provider: Provider, blockchain: Blockchain, priceProvider: PriceProvider ) {
//     this.provider = provider;
//     this.blockchain = blockchain as Ethereum;
//     this.priceProvider = priceProvider;
//   }

//   getName(): string {
//     return "EthereumGasProvider";
//   }

//   async getGasEstimate( transaction: TransactionRequest ): Promise<GasEstimate> {
//     let gasLimit: bigint = 0n;
//     let feeEstimate: FeeEstimate | null = null;
//     let feeData: any;
//     try {
//       gasLimit = await this.provider.estimateGas( transaction );
//       feeData = await this.provider.getFeeData();

//       feeEstimate = {
//         baseFee: feeData.lastBaseFeePerGas.toString(),
//         priorityFee: feeData.maxPriorityFeePerGas.toString(),
//         totalFee: BigNumber.from( feeData.lastBaseFeePerGas ).add( feeData.maxPriorityFeePerGas ).toString()
//       };

//       return {
//         gasLimit: gasLimit.toString(),
//         feeEstimate: feeEstimate
//       };
//     } catch ( error ) {
//       log.error('Error estimating gas gasLimit, feeEstimate, feeData :==>>', { gasLimit, feeEstimate, feeData });
//       log.error('Error estimating gas:', false, error );
//       throw error;
//     }
//   }

//   async getHistoricalGasData( duration: number ): Promise<HistoricalGasData[]> {
//     try {
//       // Implement the logic to fetch historical gas data from an external API or indexer
//       // For example, you can use a service like Etherscan or Infura to retrieve historical gas data
//       // You'll need to make an HTTP request to the API endpoint and parse the response
//       // The response should contain the historical gas data for the specified duration
//       // Map the response data to the HistoricalGasData interface and return it

//       // Example using a mock API response
//       const response = await fetch( 'https://api.example.com/historical-gas-data' );
//       const data = await response.json();

//       return data.map( ( item: any ) => ( {
//         timestamp: item.timestamp,
//         baseFee: item.baseFeePerGas,
//         priorityFee: item.priorityFeePerGas
//       } ) );
//     } catch ( error ) {
//       log.error( 'Error fetching historical gas data:', false, error );
//       throw error;
//     }
//   }

//   async predictFutureFees( duration: number ): Promise<GasPrediction[]> {
//     try {
//       // Implement the logic to predict future gas fees using a predictive model
//       // You can use historical gas data and machine learning techniques to build a predictive model
//       // The model should take into account factors like network congestion, transaction volume, etc.
//       // Train the model using historical data and use it to predict future gas fees for the specified duration
//       // Map the predicted data to the GasPrediction interface and return it

//       // Example using a mock prediction model
//       const historicalData = await this.getHistoricalGasData( duration );
//       const predictions = historicalData.map( ( item ) => ( {
//         timestamp: item.timestamp + duration,
//         estimatedBaseFee: item.baseFee,
//         estimatedPriorityFee: item.priorityFee
//       } ) );

//       return predictions;
//     } catch ( error ) {
//       log.error( 'Error predicting future gas fees:', false, error );
//       throw error;
//     }
//   }

//   async estimateSwapGasFee(
//     tokenIn: SwapToken,
//     tokenOut: SwapToken,
//     fromAmount: BigNumberish,
//     slippageTolerance: number,
//     deadline: number,
//     swapManager: UniswapSwapManager,
//     fee: number = 3000
//   ): Promise<string> {
//     try {
//       // Base gas units for different operations
//       const BASE_SWAP_GAS = 150000n;
//       const APPROVAL_GAS = 46000n;

//       // Calculate total gas units needed
//       let totalGasUnits = BASE_SWAP_GAS;
//       if ( !tokenIn.isNative ) {
//         totalGasUnits += APPROVAL_GAS;
//       }

//       // Get current gas prices
//       const feeData = await this.provider.getFeeData();
//       const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
//       if ( !maxFeePerGas ) throw new Error( 'Could not get gas price' );

//       // Calculate total gas cost in wei
//       const gasCostWei = totalGasUnits * BigInt( maxFeePerGas.toString() );

//       // Convert to ETH
//       const gasCostEth = EthereumBigNumber.fromWei( gasCostWei.toString() ).toEtherString();

//       // Get ETH price
//       const ethPrice = await this.getEthPrice();

//       // Calculate USD cost
//       const gasCostUsd = parseFloat( gasCostEth ) * ethPrice;

//       return `$${ gasCostUsd.toFixed( 2 ) } (${ gasCostEth } ETH)`;
//     } catch ( error ) {
//       log.error( 'Gas estimation error:', false, error );
//       return 'Unable to estimate gas';
//     }
//   }

//   // First one was tested after bottom one
//   // async estimateSwapGasFee(
//   //   tokenIn: SwapToken,
//   //   tokenOut: SwapToken,
//   //   fromAmount: BigNumberish,
//   //   slippageTolerance: number,
//   //   deadline: number,
//   //   swapManager: UniswapSwapManager,
//   //   fee: number = 3000,
//   //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000'
//   // ): Promise<string> {
//   //   try {
//   //     // Convert input values
//   //     const fromAmountBN = EthereumBigNumber.from( fromAmount );
//   //     const slippageBN = fromAmountBN.mul( Math.floor( slippageTolerance * 10 ) ).div( 1000 );
//   //     const minAmountOut = fromAmountBN.sub( slippageBN );
//   //     const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + deadline * 60;
//   //     let totalGasEstimate: bigint;

//   //     try {
//   //       // Attempt to get the exact gas estimate
//   //       const swapGasEstimate = await swapManager.populateSwapTransaction(
//   //         Token.fromSwapToken( tokenIn, this.blockchain, this.provider ),
//   //         Token.fromSwapToken( tokenOut, this.blockchain, this.provider ),
//   //         fromAmountBN.toString(),
//   //         minAmountOut.toString(),
//   //         dummyFromAddress,
//   //         deadlineTimestamp,
//   //         fee,
//   //         true
//   //       );

//   //       // Check if the result is a bigint (gas estimate) or a TransactionRequest
//   //       if ( typeof swapGasEstimate === 'bigint' ) {
//   //         totalGasEstimate = swapGasEstimate;
//   //       } else {
//   //         // Use default estimates based on transaction type
//   //         const isMultiHop = false; // Optional: Set this dynamically based on external logic if available
//   //         totalGasEstimate = isMultiHop ? 200000n : 150000n;
//   //       }

//   //       // Add approval gas if not native
//   //       if ( !tokenIn.isNative ) {
//   //         totalGasEstimate += 46000n;
//   //       }
//   //     } catch {
//   //       log.error( 'Gas estimation failed, using default.' );
//   //       totalGasEstimate = ( tokenIn.isNative ? 150000n : 196000n );
//   //     }

//   //     // Calculate fee in ETH and USD
//   //     const feeData = await this.provider.getFeeData();
//   //     const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
//   //     const gasFeeGwei = EthereumBigNumber.from( totalGasEstimate ).mul( gasPriceGwei );
//   //     const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();
//   //     const ethPrice = await this.getEthPrice();
//   //     const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

//   //     return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
//   //   } catch ( error ) {
//   //     log.error( 'Error estimating swap gas fee:', false, error );
//   //     return 'N/A';
//   //   }
//   // }

//   // async estimateSwapGasFee(
//   //   tokenIn: SwapToken,
//   //   tokenOut: SwapToken,
//   //   fromAmount: BigNumberish,
//   //   slippageTolerance: number,
//   //   deadline: number,
//   //   swapManager: UniswapSwapManager,
//   //   fee: number = 3000,
//   //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000' // Dummy from address for ETH swaps estimates
//   // ): Promise<string> {
//   //   try {
//   //     if ( !tokenIn || !tokenOut || !fromAmount || !slippageTolerance || !deadline || !swapManager ) {
//   //       return 'N/A'; //'Invalid parameters'; // Return an error message if any required parameters are missing
//   //     }

//   //     const fromAmountBN = EthereumBigNumber.from( fromAmount );
//   //     const slippageBN = fromAmountBN.mul( Math.floor( slippageTolerance * 10 ) ).div( 1000 );
//   //     const minAmountOut = fromAmountBN.sub( slippageBN );
//   //     const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + ( deadline * 60 );

//   //     let totalGasEstimate: bigint;

//   //     try {
//   //       const swapGasEstimate = await swapManager.populateSwapTransaction(
//   //         Token.fromSwapToken( tokenIn, this.blockchain, this.provider ),
//   //         Token.fromSwapToken( tokenOut, this.blockchain, this.provider ),
//   //         fromAmountBN.toString(),
//   //         minAmountOut.toString(),
//   //         dummyFromAddress,
//   //         deadlineTimestamp,
//   //         fee,
//   //         true
//   //       );

//   //       if ( typeof swapGasEstimate === 'bigint' ) {
//   //         totalGasEstimate = swapGasEstimate;
//   //       } else {
//   //         // If we couldn't get an exact estimate, use defaults
//   //         totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

//   //         // Add approval gas if it's not a native token
//   //         if ( !tokenIn.isNative ) {
//   //           totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
//   //         }
//   //       }
//   //     } catch ( error ) {
//   //       // log.error( 'Gas estimation failed, using default:', false, error );
//   //       log.error( 'Gas estimation failed, using defaults...');

//   //       // Use default estimates
//   //       totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

//   //       // Add approval gas if it's not a native token
//   //       if ( !tokenIn.isNative ) {
//   //         totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
//   //       }
//   //     }

//   //     // Calculate fee in ETH
//   //     const feeData = await this.provider.getFeeData();
//   //     const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
//   //     const gasFeeGwei = EthereumBigNumber.from( totalGasEstimate ).mul( gasPriceGwei );
//   //     const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();

//   //     // Get ETH price and calculate USD value
//   //     const ethPrice = await this.getEthPrice();
//   //     const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

//   //     return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
//   //   } catch ( error ) {
//   //     log.error( 'Error estimating swap gas fee:', false, error );
//   //     // Even if everything fails, return a conservative estimate
//   //     const conservativeGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN +
//   //       ( !tokenIn.isNative ? DEFAULT_GAS_ESTIMATES.ERC20_APPROVE : 0n );

//   //     try {
//   //       const feeData = await this.provider.getFeeData();
//   //       const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
//   //       const gasFeeGwei = EthereumBigNumber.from( conservativeGasEstimate ).mul( gasPriceGwei );
//   //       const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();
//   //       const ethPrice = await this.getEthPrice();
//   //       const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

//   //       return `≈ $${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
//   //     } catch {
//   //       return 'N/A';
//   //     }
//   //   }
//   // }

//   async getEthPrice(): Promise<number> {
//     try {
//       log.debug('getEthPrice - priceProvider', this.priceProvider);

//       const marketPrice = this.priceProvider.getMarketPrice( 'ETH-USD' );
//       return ( await marketPrice ).price;
//     } catch ( error ) {
//       log.error( 'Error fetching ETH price:', false, error );
//       // throw error;
//       return 0;
//     }
//   }

//   // factor is a multiplier to adjust the gas price. Default of 1 will return the current gas price
//   async getCurrentGasPriceInGwei(factor: number = 1): Promise<number> {
//     const gasPrice = await this.provider.getGasPrice();
//     // Convert from wei to gwei (1 gwei = 10^9 wei)
//     return Number( ethersv6.formatUnits( gasPrice, "gwei" ) ) * factor;
//   }

//   async getGasPriceFromEtherscan( apiKey: string ): Promise<number> {
//     const response = await fetch( `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ apiKey }` );
//     const data = await response.json();
//     return Number( data.result.ProposeGasPrice ); // returns a standard gas price in gwei
//   }

//   async getFormattedGasEstimates( gasEstimate: BigNumberish, factor: number = 1.5, gasPriceInGwei: number = 0, ethPriceInUsd: number = 0 ) {
//     if ( !gasEstimate ) {
//       throw new Error("Gas estimate must be provided");
//     }

//     const gasEstimateBigInt = BigNumber.from( gasEstimate ).toBigInt();

//     if ( gasEstimateBigInt! <= 0n ) {
//       return 0;
//     }

//     if ( factor <= 0 ) {
//       factor = 1;
//       log.warn( 'Factor must be greater than 0 - set to 1' );
//     }

//     if ( gasPriceInGwei < 0 ) {
//       gasPriceInGwei = 0;
//       log.warn( 'Gas price must be greater than or equal to 0 - set to 0' );
//     }

//     if ( ethPriceInUsd <= 0 ) {
//       ethPriceInUsd = 0;
//       log.warn( 'ETH price must be greater than 0 - set to 0' );
//     }

//     if ( gasPriceInGwei === 0 ) {
//       // Get the current gas price in gwei
//       gasPriceInGwei = await this.getCurrentGasPriceInGwei(factor);
//     }

//     if ( ethPriceInUsd === 0 ) {
//       // Get the current ETH price in USD
//       ethPriceInUsd = await this.getEthPrice();
//     }

//     // Convert gas price from gwei to ETH (1 gwei = 10^-9 ETH)
//     const gasPriceInEth = gasPriceInGwei * 1e-9;
//     // Calculate the gas cost in ETH
//     const gasEstimateInEth = Number(gasEstimate) * gasPriceInEth;  // May want to stay as bigint
//     // Calculate the gas cost in USD
//     const gasEstimateInUsd = gasEstimateInEth * ethPriceInUsd;

//     return gasEstimateInUsd;
//   }

//   setPriceProvider( priceProvider: PriceProvider ): void {
//     this.priceProvider = priceProvider;
//   }
// }

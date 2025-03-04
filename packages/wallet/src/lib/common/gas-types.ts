// lib/common/types/gas-types.ts
import type { BigNumberish } from './bignumber';
import type { TransactionRequest } from './interfaces';

export enum TransactionSpeed {
  SLOW = 'SLOW',
  NORMAL = 'NORMAL',
  FAST = 'FAST',
}

export interface GasFeeOptions {
  speed?: TransactionSpeed;
  customPriorityFee?: bigint;
  customMaxFee?: bigint;
}

export interface FeeEstimate {
  baseFee: BigNumberish;
  priorityFee: BigNumberish;
  totalFee: BigNumberish;
  estimatedCostEth?: string;
  estimatedCostUsd?: string;
}

export interface GasEstimate {
  gasLimit: BigNumberish;
  feeEstimate: FeeEstimate;
}

export interface GasFeeEstimate {
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostEth: string;
  estimatedCostUsd: string;
}

export interface HistoricalGasData {
  timestamp: number;
  baseFee: BigNumberish;
  priorityFee: BigNumberish;
}

export interface GasPrediction {
  timestamp: number;
  estimatedBaseFee: BigNumberish;
  estimatedPriorityFee: BigNumberish;
}

export interface GasProvider {
  getName(): string;
  getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate>;
  getHistoricalGasData(duration: number): Promise<HistoricalGasData[]>;
  predictFutureFees(duration: number): Promise<GasPrediction[]>;
  getEOATransferGasEstimate(to: string, value: bigint, options?: GasFeeOptions): Promise<GasEstimate>;
}

export interface FeeManager {
  getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate>;
  getHistoricalGasData(duration: number): Promise<HistoricalGasData[]>;
  predictFutureFees(duration: number): Promise<GasPrediction[]>;
  addProvider(provider: GasProvider | Promise<GasProvider>): Promise<void>;
  removeProvider(providerName: string): void;
  getProviders(): string[];  // Add this method
  setPriorityOrder(providerNames: string[]): void;
  setDefaultProvider(providerName: string): void;
}

// These are fallback values for EOA transactions
export const EOA_FALLBACK_GAS = {
  LIMITS: {
    BASE: 21000n,    // Standard ETH transfer always costs 21000 gas units
  },
  GWEI: {
    SLOW: {
      PRIORITY_FEE: 1n,     // 1 gwei
      MAX_FEE: 35n         // 35 gwei
    },
    NORMAL: {
      PRIORITY_FEE: 2n,     // 2 gwei
      MAX_FEE: 50n         // 50 gwei
    },
    FAST: {
      PRIORITY_FEE: 3n,     // 3 gwei
      MAX_FEE: 70n         // 70 gwei
    }
  }
};

import type { BigNumberish } from './bignumber';
import type { TransactionRequest } from './interfaces';

export interface FeeEstimate {
  baseFee: BigNumberish;
  priorityFee: BigNumberish;
  totalFee: BigNumberish;
}

export interface GasEstimate {
  gasLimit: BigNumberish;
  feeEstimate: FeeEstimate;
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
}

export interface FeeManager {
  getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate>;
  getHistoricalGasData(duration: number): Promise<HistoricalGasData[]>;
  predictFutureFees(duration: number): Promise<GasPrediction[]>;
  addProvider(provider: GasProvider): void;
  removeProvider(providerName: string): void;
}

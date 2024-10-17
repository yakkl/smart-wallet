import type { GasEstimate, GasPrediction, HistoricalGasData } from '$lib/common/gas-types';
import type { TransactionRequest } from '$lib/common/interfaces';

// GasProvider.ts
export interface GasProvider {
  getName(): string;
  getGasEstimate( transaction: TransactionRequest ): Promise<GasEstimate>;
  getHistoricalGasData( duration: number ): Promise<HistoricalGasData[]>;
  predictFutureFees( duration: number ): Promise<GasPrediction[]>;
}


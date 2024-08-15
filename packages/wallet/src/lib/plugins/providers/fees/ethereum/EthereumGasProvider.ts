// EthereumGasProvider.ts

import { BigNumber } from '$lib/common/bignumber';
import type { 
  GasProvider, 
  GasEstimate, 
  HistoricalGasData, 
  GasPrediction,
  FeeEstimate
} from '$lib/common/gas-types';
import type { TransactionRequest } from '$lib/common/interfaces';
import type { Provider } from '$plugins/Provider';

export class EthereumGasProvider implements GasProvider {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  getName(): string {
    return "EthereumGasProvider";
  }

  async getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate> {
    const gasLimit = await this.provider.estimateGas(transaction);
    const feeData = await this.provider.getFeeData();

    const feeEstimate: FeeEstimate = {
      baseFee: feeData.lastBaseFeePerGas.toString(),
      priorityFee: feeData.maxPriorityFeePerGas.toString(),
      totalFee: BigNumber.from(feeData.lastBaseFeePerGas).add(feeData.maxPriorityFeePerGas).toString()
    };

    return {
      gasLimit: gasLimit.toString(),
      feeEstimate: feeEstimate
    };
  }

  async getHistoricalGasData(duration: number): Promise<HistoricalGasData[]> {
    // This would typically involve querying an external API or indexer
    // For this example, we'll return mock data
    const now = Math.floor(Date.now() / 1000);
    const data: HistoricalGasData[] = [];

    for (let i = 0; i < duration; i += 3600) {
      data.push({
        timestamp: now - i,
        baseFee: (Math.floor(Math.random() * 100) + 50).toString(),
        priorityFee: (Math.floor(Math.random() * 20) + 1).toString()
      });
    }

    return data;
  }

  async predictFutureFees(duration: number): Promise<GasPrediction[]> {
    // This would typically involve some kind of predictive model
    // For this example, we'll return mock predictions
    const now = Math.floor(Date.now() / 1000);
    const predictions: GasPrediction[] = [];

    for (let i = 0; i < duration; i += 3600) {
      predictions.push({
        timestamp: now + i,
        estimatedBaseFee: (Math.floor(Math.random() * 100) + 50).toString(),
        estimatedPriorityFee: (Math.floor(Math.random() * 20) + 1).toString()
      });
    }

    return predictions;
  }
}

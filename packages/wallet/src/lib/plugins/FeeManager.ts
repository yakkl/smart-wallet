// FeeManager.ts
import { BigNumber } from '$lib/common/bignumber';
import type {
  FeeManager,
  GasProvider,
  GasEstimate,
  HistoricalGasData,
  GasPrediction,
  FeeEstimate
} from '$lib/common/gas-types';
import type { TransactionRequest } from '$lib/common/interfaces';

export class BaseFeeManager implements FeeManager {
  private providers: Map<string, GasProvider>;
  private initializationPromise: Promise<void>;

  constructor() {
    this.providers = new Map();
    this.initializationPromise = Promise.resolve();
  }

  async addProvider(providerPromise: GasProvider | Promise<GasProvider>): Promise<void> {
    const provider = await providerPromise;
    this.providers.set(provider.getName(), provider);
  }

  removeProvider(providerName: string): void {
    this.providers.delete(providerName);
  }

  getProviders(): string[] {
    return Array.from( this.providers.keys() );
  }

  async getGasEstimate(transaction: TransactionRequest): Promise<GasEstimate> {
    await this.initializationPromise;
    if (this.providers.size === 0) {
      throw new Error('No gas providers available');
    }

    const estimates: GasEstimate[] = await Promise.all(
      Array.from( this.providers.values() ).map( async ( provider ): Promise<GasEstimate | null> => {
        return provider.getGasEstimate( transaction ).catch( ( error: unknown ): GasEstimate | null => {
          console.log( `Failed to get gas estimate from ${ provider.getName() }:`, false, error );
          return null; // Explicitly return `null` for failed estimates
        } );
      } )
    ).then( ( estimates: ( GasEstimate | null )[] ): GasEstimate[] => {
      return estimates.filter( ( estimate ): estimate is GasEstimate => estimate !== null );
    } );

    const gasLimits = estimates.map(e => BigNumber.from(e.gasLimit)).sort((a, b) => a.compare(b));
    const baseFees = estimates.map(e => BigNumber.from(e.feeEstimate.baseFee)).sort((a, b) => a.compare(b));
    const priorityFees = estimates.map(e => BigNumber.from(e.feeEstimate.priorityFee)).sort((a, b) => a.compare(b));

    const medianGasLimit = gasLimits[Math.floor(gasLimits.length / 2)];
    const medianBaseFee = baseFees[Math.floor(baseFees.length / 2)];
    const medianPriorityFee = priorityFees[Math.floor(priorityFees.length / 2)];

    const feeEstimate: FeeEstimate = {
      baseFee: medianBaseFee.toString(),
      priorityFee: medianPriorityFee.toString(),
      totalFee: medianBaseFee.add(medianPriorityFee).toString()
    };

    return {
      gasLimit: medianGasLimit.toString(),
      feeEstimate: feeEstimate
    };
  }

  async getHistoricalGasData(duration: number): Promise<HistoricalGasData[]> {
    if (this.providers.size === 0) {
      throw new Error('No gas providers available');
    }

    const allHistoricalData = await Promise.all(
      Array.from(this.providers.values()).map(provider => provider.getHistoricalGasData(duration))
    );

    const aggregatedData: Map<number, HistoricalGasData & { count: number }> = new Map();

    allHistoricalData.flat().forEach(data => {
      if (!aggregatedData.has(data.timestamp)) {
        aggregatedData.set(data.timestamp, { ...data, count: 1 });
      } else {
        const existing = aggregatedData.get(data.timestamp)!;
        existing.baseFee = BigNumber.from(existing.baseFee).add(BigNumber.from(data.baseFee)).toString();
        existing.priorityFee = BigNumber.from(existing.priorityFee).add(BigNumber.from(data.priorityFee)).toString();
        existing.count++;
      }
    });

    return Array.from(aggregatedData.values()).map(data => ({
      timestamp: data.timestamp,
      baseFee: BigNumber.from(data.baseFee).div(BigNumber.from(data.count)).toString(),
      priorityFee: BigNumber.from(data.priorityFee).div(BigNumber.from(data.count)).toString()
    }));
  }

  async predictFutureFees(duration: number): Promise<GasPrediction[]> {
    if (this.providers.size === 0) {
      throw new Error('No gas providers available');
    }

    const allPredictions = await Promise.all(
      Array.from(this.providers.values()).map(provider => provider.predictFutureFees(duration))
    );

    const aggregatedPredictions: Map<number, GasPrediction & { count: number }> = new Map();

    allPredictions.flat().forEach(prediction => {
      if (!aggregatedPredictions.has(prediction.timestamp)) {
        aggregatedPredictions.set(prediction.timestamp, { ...prediction, count: 1 });
      } else {
        const existing = aggregatedPredictions.get(prediction.timestamp)!;
        existing.estimatedBaseFee = BigNumber.from(existing.estimatedBaseFee).add(BigNumber.from(prediction.estimatedBaseFee)).toString();
        existing.estimatedPriorityFee = BigNumber.from(existing.estimatedPriorityFee).add(BigNumber.from(prediction.estimatedPriorityFee)).toString();
        existing.count++;
      }
    });

    return Array.from(aggregatedPredictions.values()).map(prediction => ({
      timestamp: prediction.timestamp,
      estimatedBaseFee: BigNumber.from(prediction.estimatedBaseFee).div(BigNumber.from(prediction.count)).toString(),
      estimatedPriorityFee: BigNumber.from(prediction.estimatedPriorityFee).div(BigNumber.from(prediction.count)).toString()
    }));
  }

  setPriorityOrder( providerNames: string[] ): void {
    const orderedProviders = new Map<string, GasProvider>();
    providerNames.forEach( name => {
      if ( this.providers.has( name ) ) {
        orderedProviders.set( name, this.providers.get( name )! );
      }
    } );
    this.providers = orderedProviders;
  }

  setDefaultProvider( providerName: string ): void {
    if ( this.providers.has( providerName ) ) {
      const defaultProvider = this.providers.get( providerName )!;
      this.providers.delete( providerName );
      this.providers = new Map( [ [ providerName, defaultProvider ], ...this.providers ] );
    }
  }


}

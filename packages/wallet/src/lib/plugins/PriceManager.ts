import type { PriceData, PriceProvider, WeightedProvider } from '$lib/common/interfaces';
import { AlchemyPriceProvider } from './providers/price/alchemy/AlchemyPriceProvider';
import { CoinbasePriceProvider } from './providers/price/coinbase/CoinbasePriceProvider';
import { CoingeckoPriceProvider } from './providers/price/coingecko/CoingeckoPriceProvider';
// import { KrakenPriceProvider } from './providers/price/kraken/KrakenPriceProvider';

export class PriceManager {
  private weightedProviders: WeightedProvider[];
  private totalWeight: number;
  private readonly DEFAULT_WEIGHT = 1;

  constructor ( weightedProviders: WeightedProvider[] = PriceManager.getDefaultProviders() ) {
    if ( !weightedProviders || weightedProviders.length === 0 ) {
      throw new Error( "At least one provider must be specified" );
    }

    this.weightedProviders = this.normalizeWeights( weightedProviders );
    this.totalWeight = this.calculateTotalWeight();
  }

  static getDefaultProviders(): WeightedProvider[] {
    return [
      // { provider: new AlchemyPriceProvider(), weight: 2 },
      { provider: new CoinbasePriceProvider(), weight: 8 },
      { provider: new CoingeckoPriceProvider(), weight: 5 },
      // { provider: new KrakenPriceProvider(), weight: 1 },
      // Add other providers with their weights...
    ];
  }

  private normalizeWeights( providers: WeightedProvider[] ): WeightedProvider[] {
    const allZeroWeights = providers.every( wp => wp.weight === 0 );
    const allEqualWeights = providers.every( wp => wp.weight === providers[ 0 ].weight );

    if ( allZeroWeights || allEqualWeights ) {
      // If all weights are zero or equal, assign default weight to all
      return providers.map( wp => ( { ...wp, weight: this.DEFAULT_WEIGHT } ) );
    }

    // Replace any zero weights with the smallest non-zero weight
    const smallestNonZeroWeight = Math.min( ...providers.filter( wp => wp.weight > 0 ).map( wp => wp.weight ) );
    return providers.map( wp => ( {
      ...wp,
      weight: wp.weight === 0 ? smallestNonZeroWeight : wp.weight
    } ) );
  }

  private calculateTotalWeight(): number {
    return this.weightedProviders.reduce( ( sum, wp ) => sum + wp.weight, 0 );
  }

  public getAvailableProviders(): PriceProvider[] {
    return this.weightedProviders.map( wp => wp.provider );
  }

  async getMarketPrice( pair: string, availableProviders?: PriceProvider[] ): Promise<PriceData> {
    const providersToUse = availableProviders || this.getAvailableProviders();

    if ( providersToUse.length === 0 ) {
      throw new Error( "No providers available to fetch market price" );
    }

    const provider = this.getWeightedRandomProvider( providersToUse );
    try {
      return await provider.getMarketPrice( pair );
    } catch ( error ) {
      console.error( `Error fetching price from ${ provider.getName() }:`, error );
      // Retry with a different provider
      return this.getMarketPrice( pair, providersToUse.filter( p => p !== provider ) ); // Avoid circular error by excluding failed provider
    }
  }

  private getWeightedRandomProvider( providers: PriceProvider[] ): PriceProvider {
    if ( providers.length === 1 ) {
      return providers[ 0 ];
    }

    const weightedProviders = this.weightedProviders.filter( wp => providers.includes( wp.provider ) );
    const totalWeight = weightedProviders.reduce( ( sum, wp ) => sum + wp.weight, 0 );

    if ( weightedProviders.every( wp => wp.weight === weightedProviders[ 0 ].weight ) ) {
      // If all weights are equal, choose randomly
      return weightedProviders[ Math.floor( Math.random() * weightedProviders.length ) ].provider;
    }

    let random = Math.random() * totalWeight;

    for ( const wp of weightedProviders ) {
      if ( random < wp.weight ) {
        return wp.provider;
      }
      random -= wp.weight;
    }

    // This should never happen if weights are set correctly
    return weightedProviders[ 0 ].provider;
  }
}

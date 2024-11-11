import type { PriceData, PriceProvider, WeightedProvider } from '$lib/common/interfaces';


export class PriceManager {
  private weightedProviders: WeightedProvider[];
  private totalWeight: number;
  private readonly DEFAULT_WEIGHT = 1;

  constructor(weightedProviders: WeightedProvider[]) {
    if (!weightedProviders || weightedProviders.length === 0) {
      throw new Error("At least one provider must be specified");
    }

    this.weightedProviders = this.normalizeWeights(weightedProviders);
    this.totalWeight = this.calculateTotalWeight();
  }

  private normalizeWeights(providers: WeightedProvider[]): WeightedProvider[] {
    const allZeroWeights = providers.every(wp => wp.weight === 0);
    const allEqualWeights = providers.every(wp => wp.weight === providers[0].weight);

    if (allZeroWeights || allEqualWeights) {
      // If all weights are zero or equal, assign default weight to all
      return providers.map(wp => ({ ...wp, weight: this.DEFAULT_WEIGHT }));
    }

    // Replace any zero weights with the smallest non-zero weight
    const smallestNonZeroWeight = Math.min(...providers.filter(wp => wp.weight > 0).map(wp => wp.weight));
    return providers.map(wp => ({
      ...wp,
      weight: wp.weight === 0 ? smallestNonZeroWeight : wp.weight
    }));
  }

  private calculateTotalWeight(): number {
    return this.weightedProviders.reduce((sum, wp) => sum + wp.weight, 0);
  }

  // May want to add a second param that supplied the provider to use instead of picking a random one. If null or undefined, pick a random one.
  async getMarketPrice(pair: string): Promise<PriceData> {
    const provider = this.getWeightedRandomProvider();
    try {
      return await provider.getMarketPrice(pair);
    } catch (error) {
      console.error(`Error fetching price from ${provider.getName()}:`, error);
      // Retry with a different provider
      return this.getMarketPrice(pair); // This will create a circular error if all providers fail so another option is to return an error here
    }
  }

  private getWeightedRandomProvider(): PriceProvider {
    if (this.weightedProviders.length === 1) {
      return this.weightedProviders[0].provider;
    }

    if (this.weightedProviders.every(wp => wp.weight === this.weightedProviders[0].weight)) {
      // If all weights are equal, choose randomly
      return this.weightedProviders[Math.floor(Math.random() * this.weightedProviders.length)].provider;
    }

    let random = Math.random() * this.totalWeight;
    
    for (const wp of this.weightedProviders) {
      if (random < wp.weight) {
        return wp.provider;
      }
      random -= wp.weight;
    }

    // This should never happen if weights are set correctly
    return this.weightedProviders[0].provider;
  }
}

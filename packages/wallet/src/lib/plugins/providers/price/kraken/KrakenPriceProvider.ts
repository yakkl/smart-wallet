import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';

export class KrakenPriceProvider implements PriceProvider {
  getName() {
    return 'Kraken';
  }

  async getPrice(pair: string): Promise<PriceData> {
    const newPair = pair.replace('-', '');
    const json = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${newPair}`);
    const result = json.result[Object.keys(json.result)[0]];
    if (!result || !result.c || !result.c[0]) {
      throw new Error('Invalid JSON structure or missing data from Kraken');
    }
    return {
      provider: this.getName(),
      price: parseFloat(result.c[0]),
      lastUpdated: new Date()
    };
  }
}

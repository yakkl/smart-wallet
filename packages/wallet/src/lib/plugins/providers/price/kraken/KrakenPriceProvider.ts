import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';

export class KrakenPriceProvider implements PriceProvider {
  getName() {
    return 'Kraken';
  }

  async getPrice(pair: string): Promise<PriceData> {
    const krakenPair = pair.replace('-', '');
    const json = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${krakenPair}`);
    const result = json.result[Object.keys(json.result)[0]];
    return {
      provider: this.getName(),
      price: parseFloat(result.c[0]),
      lastUpdated: new Date()
    };
  }
}

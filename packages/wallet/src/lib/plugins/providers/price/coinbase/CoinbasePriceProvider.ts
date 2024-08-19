import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';


export class CoinbasePriceProvider implements PriceProvider {
  getName() {
    return 'Coinbase';
  }

  async getPrice(pair: string): Promise<PriceData> {
    const json = await fetchJson(`https://api.pro.coinbase.com/products/${pair}/ticker`);
    if (!json.price || !json.time) {
      throw new Error('Invalid JSON structure or missing data from Coinbase');
    }
    return {
      provider: this.getName(),
      price: parseFloat(json.price),
      lastUpdated: new Date(json.time)
    };
  }
}

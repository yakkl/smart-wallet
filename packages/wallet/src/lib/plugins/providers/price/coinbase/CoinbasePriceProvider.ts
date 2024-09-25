import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';


export class CoinbasePriceProvider implements PriceProvider {
  getName() {
    return 'Coinbase';
  }

  async getPrice(pair: string): Promise<PriceData> {
    const json = await fetchJson(`https://api.coinbase.com/api/v3/brokerage/market/products?limit=1&product_ids=${pair}`);
    if (json.num_products <= 0) {
      throw new Error('Invalid JSON structure or missing data from Coinbase');
    }
    return {
      provider: this.getName(),
      price: parseFloat(json.products[0].price),
      lastUpdated: new Date()
    };
  }
}

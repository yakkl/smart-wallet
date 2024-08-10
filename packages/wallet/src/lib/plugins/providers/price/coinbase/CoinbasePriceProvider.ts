import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';


export class CoinbasePriceProvider implements PriceProvider {
  getName() {
    return 'Coinbase';
  }

  async getPrice(pair: string): Promise<PriceData> {
    const json = await fetchJson(`https://api.pro.coinbase.com/products/${pair}/ticker`);
    return {
      provider: this.getName(),
      price: parseFloat(json.price),
      lastUpdated: new Date(json.time)
    };
  }
}


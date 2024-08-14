import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';

// Response Fields (trading pairs, ex. tBTCUSD)
// Index	Field	Type	Description
// [0]	BID	float	Price of last highest bid
// [1]	BID_SIZE	float	Sum of the 25 highest bid sizes
// [2]	ASK	float	Price of last lowest ask
// [3]	ASK_SIZE	float	Sum of the 25 lowest ask sizes
// [4]	DAILY_CHANGE	float	Amount that the last price has changed since yesterday
// [5]	DAILY_CHANGE_RELATIVE	float	Relative price change since yesterday (*100 for percentage change)
// [6]	LAST_PRICE	float	Price of the last trade
// [7]	VOLUME	float	Daily volume
// [8]	HIGH	float	Daily high
// [9]	LOW	float	Daily low

// Example response: [60134, 3.11775918, 60135, 6.29412191, -617, -0.01015621, 60134, 243.54258395, 61916, 60072]
// Last trade price: 60134 or [6]

export class BitfinexPriceProvider implements PriceProvider {
  getName() {
    return 'Bitfinex';
  }

  async getPrice(pair: string): Promise<PriceData> {
    // const json = await fetchJson(`https://api-pub.bitfinex.com/v2/tickers?symbols=t${pair.toUpperCase().replace('-', '')}`); // Can use this to pull multiple pairs
    const json = await fetchJson(`https://api-pub.bitfinex.com/v2/ticker/t${pair.toUpperCase().replace('-', '')}`);
    if (!json[6]) {
      throw new Error('Invalid JSON structure or missing data from Bitfinex');
    }
    return {
      provider: this.getName(),
      price: parseFloat(json[0]),
      lastUpdated: new Date()
    };
  }
}

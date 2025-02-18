/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';
import { log } from "$lib/plugins/Logger";

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
  getAPIKey(): string {
    return '';  //import.meta.env.VITE_BITFINEX_API_KEY_PROD;
  }

  getName() {
    return 'Bitfinex';
  }

  async getMarketPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      pair = await this.getProviderPairFormat( pair );

      // const json = await fetchJson(`https://api-pub.bitfinex.com/v2/tickers?symbols=t${pair.toUpperCase().replace('-', '')}`); // Can use this to pull multiple pairs
      const json = await fetchJson( `https://api-pub.bitfinex.com/v2/ticker/t${ pair }` );
      if ( !json[ 6 ] ) {
        throw new Error( 'Invalid JSON structure or missing data from Bitfinex' );
      }
      return {
        provider: this.getName(),
        price: parseFloat( json[ 0 ] ),
        lastUpdated: new Date(),
        status: 0,
        message: '',
      };
    }
    catch ( e: any ) {
      log.error( 'BitfinexPriceProvider - getPrice - error', e );

      let status = 404;  // Default status
      let message = `Error - ${ e }`;

      if ( e.response && e.response.status === 429 ) {
        // Handle 429 Too Many Requests error
        status = 429;
        message = 'Too Many Requests - Rate limit exceeded';
      }

      return {
        provider: this.getName(),
        price: 0,
        lastUpdated: new Date(),
        status,
        message,
      };
    }
  }

  async getProviderPairFormat( pair: string ) {
    const [ token, symbol ] = pair.split( '-' );
    if ( !token || !symbol ) {
      throw new Error( `Invalid pair - ${ pair }` );
    }
    if ( token === 'WETH' ) {
      pair = `ETH-${ symbol }`;
    }
    if ( token === 'WBTC' ) {
      pair = `BTC-${ symbol }`;
    }
    return pair.replace( '-', '' );
  }
}

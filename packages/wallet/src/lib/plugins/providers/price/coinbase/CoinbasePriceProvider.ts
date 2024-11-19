/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';


export class CoinbasePriceProvider implements PriceProvider {
  getAPIKey(): string {
    return import.meta.env.VITE_COINBASE_API_KEY;
  }

  getName() {
    return 'Coinbase';
  }

  async getMarketPrice( pair: string ): Promise<MarketPriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      const [ tokenIn, tokenOut ] = pair.split( '-' );
      if ( !tokenIn || !tokenOut ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      if ( tokenIn === 'WETH' ) {
        pair = `ETH-${ tokenOut }`;
      }
      if ( tokenIn === 'WBTC' ) {
        pair = `BTC-${ tokenOut }`;
      }
      // console.log( 'CoinbasePriceProvider - getPrice - pair', pair );
    
      const json = await fetchJson( `https://api.coinbase.com/api/v3/brokerage/market/products?limit=1&product_ids=${ pair }` ); // WETH is not supported by Coinbase
    
      // console.log( 'CoinbasePriceProvider - getPrice - json', json );

      if ( json.num_products <= 0 ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `No data found for - ${ pair }` };
      }
      return {
        provider: this.getName(),
        price: parseFloat( json.products[ 0 ].price ),
        lastUpdated: new Date(),
        currency: tokenOut,
        status: 0,
        message: ''
      };
    }
    catch ( e: any ) {
      console.log( 'CoinbasePriceProvider - getPrice - error', e );

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
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';
import { log } from "$plugins/Logger";

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

      pair = await this.getProviderPairFormat( pair );

      const [ tokenIn, tokenOut ] = pair.split( '-' );
      if ( !tokenIn || !tokenOut ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }

      if ( tokenIn === 'USDC' ) {
        // Coinbase has declared USD:USDC as an alias to each other and always $1 in value
        return {
          provider: this.getName(),
          price: parseFloat( "1.00" ),
          lastUpdated: new Date(),
          currency: tokenOut,
          status: 0,
          message: ''
        };
      }

      if ( tokenIn === 'WETH' ) {
        pair = `ETH-${ tokenOut }`;
      }
      if ( tokenIn === 'WBTC' ) {
        pair = `BTC-${ tokenOut }`;
      }

      const json = await fetchJson( `https://api.coinbase.com/api/v3/brokerage/market/products?limit=1&product_ids=${ pair }` ); // WETH is not supported by Coinbase

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
      log.error( 'CoinbasePriceProvider - getPrice - error', e );

      let status = 404;  // Default status
      let message = `Error - ${ e }`;

      if ( e.response && e.response.status === 429 ) {
        // Handle 429 Too Many Requests error
        status = 429;
        message = 'Too Many Requests - Rate limit exceeded';
      }

      // log.debug( 'CoinbasePriceProvider - getPrice - error', status, message );

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
    return pair;
  }
}

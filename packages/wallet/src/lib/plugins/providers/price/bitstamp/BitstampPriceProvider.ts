/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';
import { log } from "$lib/plugins/Logger";

// Bitstamp has a number of nice features. This returned data show the percent of change in the last 24 hours
// {timestamp: "1723398353", open: "60940", high: "61868", low: "59959", last: "60192", volume: "1008.29813067", vwap: "60962", bid: "60173", ask: "60175", side: "1", open_24: "60652", percent_change_24: "-0.76"}
// We need the last price and the percent change in the last 24 hours
export class BitstampPriceProvider implements PriceProvider {
  getAPIKey(): string {
    return '';  //import.meta.env.VITE_BITSTAMP_API_KEY_PROD;
  }

  getName() {
    return 'Bitstamp';
  }

  async getMarketPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }

      pair = await this.getProviderPairFormat( pair );

      const json = await fetchJson( `https://www.bitstamp.net/api/v2/ticker/${ pair }` );
      if ( !json[ 'last' ] || !json[ 'timestamp' ] ) {
        throw new Error( 'Invalid JSON structure or missing data from Bitstamp' );
      }
      return {
        provider: this.getName(),
        price: parseFloat( json[ 'last' ] ),
        lastUpdated: new Date( parseInt( json[ 'timestamp' ] ) * 1000 ),
        status: 0,
        message: '',
      };
    }
    catch ( e: any ) {
      log.error( 'BitstampPriceProvider - getPrice - error', e );

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

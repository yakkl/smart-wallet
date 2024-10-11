import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';

export class KrakenPriceProvider implements PriceProvider {
  getName() {
    return 'Kraken';
  }

  async getPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      // eslint-disable-next-line prefer-const
      let [ token, symbol ] = pair.split( '-' );
      if ( !token || !symbol ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      if ( token === 'WETH' ) {
        token = 'ETH';
        pair = `${ token }-${ symbol }`;
      }
      if ( token === 'WBTC' ) {
        token = 'BTC';
        pair = `${ token }-${ symbol }`;
      }
      const newPair = pair.replace( '-', '' );
      const json = await fetchJson( `https://api.kraken.com/0/public/Ticker?pair=${ newPair }` );
      const result = json.result[ Object.keys( json.result )[ 0 ] ];
      if ( !result || !result.c || !result.c[ 0 ] ) {
        throw new Error( 'Invalid JSON structure or missing data from Kraken' );
      }
      return {
        provider: this.getName(),
        price: parseFloat( result.c[ 0 ] ),
        lastUpdated: new Date(),
        status: 0,
        message: ''
      };
    }
    catch ( e ) {
      console.log( 'KrakenPriceProvider - getPrice - error', e );
      return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Error - ${ e }` };
    }
  }
}

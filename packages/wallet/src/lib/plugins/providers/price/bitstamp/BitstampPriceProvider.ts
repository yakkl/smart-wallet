import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';

// Bitstamp has a number of nice features. This returned data show the percent of change in the last 24 hours
// {timestamp: "1723398353", open: "60940", high: "61868", low: "59959", last: "60192", volume: "1008.29813067", vwap: "60962", bid: "60173", ask: "60175", side: "1", open_24: "60652", percent_change_24: "-0.76"}
// We need the last price and the percent change in the last 24 hours
export class BitstampPriceProvider implements PriceProvider {
  getName() {
    return 'Bitstamp';
  }

  async getPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      const [ token, symbol ] = pair.split( '-' );
      if ( !token || !symbol ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      if ( token === 'WETH' ) {
        pair = `ETH-${ symbol }`;
      }
      if ( token === 'WBTC' ) {
        pair = `BTC-${ symbol }`;
      }
      const json = await fetchJson( `https://www.bitstamp.net/api/v2/ticker/${ pair.toLowerCase().replace( '-', '' ) }` );
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
    catch ( e ) {
      console.log( 'BitstampPriceProvider - getPrice - error', e );
      return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Error - ${ e }` };
    }
  }
}

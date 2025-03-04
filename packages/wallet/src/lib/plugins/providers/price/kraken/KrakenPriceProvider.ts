import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';
import { log } from "$lib/plugins/Logger";

export class KrakenPriceProvider implements PriceProvider {
  getAPIKey(): string {
    return '';  //import.meta.env.VITE_KRAKEN_API_KEY_PROD
  }

  getName() {
    return 'Kraken';
  }

  async getMarketPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }

      pair = await this.getProviderPairFormat( pair );

      const json = await fetchJson( `https://api.kraken.com/0/public/Ticker?pair=${ pair }` );
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
      log.error( 'KrakenPriceProvider - getPrice - error', false, e );
      return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Error - ${ e }` };
    }
  }

  async getProviderPairFormat( pair: string ): Promise<string> {
    // eslint-disable-next-line prefer-const
    let [ token, symbol ] = pair.split( '-' );
    if ( !token || !symbol ) {
      throw new Error( `Invalid pair - ${ pair }` );
    }
    switch ( token ) {
      case 'ETH':
        pair = 'ETHUSDC';
        break;
      case 'WETH':
        pair = 'ETHWETH';
        break;
      case 'WBTC':
        pair = 'WBTCUSD';
        break;
      case 'PEPE':
        pair = 'PEPEUSD';
        break;
    }
    return pair.replace( '-', '' );
  }
}

import { fetchJson } from "@ethersproject/web";
import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';


export class CoinbasePriceProvider implements PriceProvider {
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
        status: 0,
        message: ''
      };
    }
    catch ( e ) {
      console.log( 'CoinbasePriceProvider - getPrice - error', e );
      return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Error - ${ e }` };
    }
  }
}

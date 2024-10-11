import { fetchJson } from "@ethersproject/web";
import type { PriceData, PriceProvider } from '$lib/common/interfaces';
import { splitWords } from '$lib/utilities';

// Coingecko public API pulls from a number of exchanges.
// Coingecko does not update their prices as frequently as other providers so it may appear that prices look like an arbitrage opportunity but it may not be.
export class CoingeckoPriceProvider implements PriceProvider {
  getName() {
    return 'Coingecko';
  }

  async getPrice( pair: string ): Promise<PriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      let name: string = '';
      const [ symbol, currencySymbol ] = splitWords( pair, '-' );
    
      if ( !symbol || !currencySymbol ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      // symbol to name mapping needs to be updated at times. You can find the list at https://api.coingecko.com/api/v3/coins/list?include_platform=true&status=active
      // NOTE: This is not a complete list. You may need to add more symbols as needed. Also, the symbol may not match the name exactly.
      switch ( symbol ) {
        case 'ETH':
        case 'WETH':
          name = 'ethereum';
          break;
        case 'BTC':
          name = 'bitcoin';
          break;
        case 'USDC':
          name = 'usd-coin';
          break;
        case 'DAI':
          name = 'dai';
          break;
        case 'USDT':
          name = 'tether';
          break;
        case 'BUSD':
          name = 'binance-usd';
          break;
        case 'WBTC':
          name = 'wrapped-bitcoin';
          break;
        case 'SOL':
          name = 'solana';
          break;
        case 'MATIC':
          name = 'matic-network';
          break;
        case 'BNB':
          name = 'binance-coin';
          break;
        case 'AVAX':
          name = 'avalanche-2';
          break;

        default:
          name = symbol.toLowerCase();
          break;
      }
      const json = await fetchJson( `https://api.coingecko.com/api/v3/simple/price?ids=${ name }&include_last_updated_at=true&vs_currencies=${ currencySymbol }` );
      const priceData = json[ name.toLowerCase() ];

      if ( !priceData || !priceData[ currencySymbol.toLowerCase() ] ) {
        throw new Error( 'Invalid JSON structure or missing data from Coingecko' );
      }

      return {
        provider: this.getName(),
        price: parseFloat( priceData[ currencySymbol.toLowerCase() ] ),
        lastUpdated: new Date( priceData.last_updated_at * 1000 ),
        status: 0,
        message: ''
      };
    }
    catch ( e ) {
      console.log( 'CoingeckoPriceProvider - getPrice - error', e );
      return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Error - ${ e }` };
    }
  }
}

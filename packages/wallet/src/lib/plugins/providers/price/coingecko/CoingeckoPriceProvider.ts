/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';
import { splitWords } from '$lib/utilities';
import { log } from "$lib/plugins/Logger";

// Coingecko public API pulls from a number of exchanges.
// Coingecko does not update their prices as frequently as other providers so it may appear that prices look like an arbitrage opportunity but it may not be.
export class CoingeckoPriceProvider implements PriceProvider {
  getAPIKey(): string {
    return import.meta.env.VITE_COINGECKO_API_KEY;
  }

  getName() {
    return 'Coingecko';
  }

  async getMarketPrice( pair: string ): Promise<MarketPriceData> {
    try {
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }

      const [ name, currencySymbol ] = await this.getProviderPairFormat( pair );
      if ( !name || !currencySymbol ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }

      const json = await fetchJson( {
        url: `https://pro-api.coingecko.com/api/v3/simple/price?ids=${ name }&include_last_updated_at=true&vs_currencies=${ currencySymbol }`,
        headers: {
          'Accept': 'application/json',
          'x-cg-pro-api-key': this.getAPIKey()
        }
      } );
      const priceData = json[ name.toLowerCase() ];

      if ( !priceData || !priceData[ currencySymbol.toLowerCase() ] ) {
        throw new Error( 'Invalid JSON structure or missing data from Coingecko' );
      }

      return {
        provider: this.getName(),
        price: parseFloat( priceData[ currencySymbol.toLowerCase() ] ),
        lastUpdated: new Date( priceData.last_updated_at * 1000 ),
        currency: currencySymbol,
        status: 0,
        message: 'Success'
      };
    }
    catch ( e: any ) {
      log.error( 'CoingeckoPriceProvider - getPrice - error', e );

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

  async getProviderPairFormat(pair: string): Promise<[string, string]> {
    let name: string = '';
    const [ symbol, currencySymbol ] = splitWords( pair, '-' );

    if ( !symbol || !currencySymbol ) {
      return ['', ''];
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
        // TBD: Add more symbols as needed. May want to add a mapping file for this that only loads when not found in above list. This will need to be implemented in a dynamically generated function call.
        name = symbol.toLowerCase();
        break;
    }
    return [ name, currencySymbol ];
  }

}

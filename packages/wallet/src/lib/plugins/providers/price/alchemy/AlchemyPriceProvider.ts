/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchJson } from "@ethersproject/web";
import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';


export class AlchemyPriceProvider implements PriceProvider {
  getAPIKey(): string {
    return import.meta.env.VITE_ALCHEMY_API_KEY_PROD;  
  }

  getName() {
    return 'Alchemy';
  }

  // pair - 'ETH' or generic 'ETH-USD'. If generic then use up to first '-' and ignore the rest. 
  async getMarketPrice( pair: string ): Promise<MarketPriceData> {
    try {
      // Kept variable name as pair for consistency with other providers
      if ( !pair ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `Invalid pair - ${ pair }` };
      }
      // Check if '-' exists in the pair
      const dashIndex = pair.indexOf( '-' );

      // If '-' exists, update the pair to include only the part before '-'
      if ( dashIndex !== -1 ) {
        pair = pair.substring( 0, dashIndex );
      }

      if ( pair === 'WETH' ) {
        pair = `ETH`;
      }
      if ( pair === 'WBTC' ) {
        pair = `BTC`;
      }

      const json = await fetchJson( {
        url: `https://api.g.alchemy.com/prices/v1/tokens/by-symbol?symbols=${ pair }`,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${ this.getAPIKey() }`
        }
      } ); 

      if ( json.data.length <= 0 ) {
        return { provider: this.getName(), price: 0, lastUpdated: new Date(), status: 404, message: `No data found for - ${ pair }` };
      }
      return {
        provider: this.getName(),
        price: parseFloat( json.data.prices[ 0 ].value ),
        lastUpdated: json.data.prices[ 0 ].lastUpdatedAt,
        currency: json.data.prices[ 0 ].currency,
        status: 0,
        message: ''
      };
    }
    catch ( e: any ) {
      console.log( 'AlchemyPriceProvider - getPrice - error', e );

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

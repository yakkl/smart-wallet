// Base coingecko API
import { fetchJson } from "@ethersproject/web";
import { get } from 'svelte/store';
import { yakklPricingStore, yakklConnectionStore } from "$lib/common/stores";
import { PriceManager } from '$lib/plugins/PriceManager';
import { KrakenPriceProvider } from '$lib/plugins/providers/price/kraken/KrakenPriceProvider';
import { CoingeckoPriceProvider } from '$lib/plugins/providers/price/coingecko/CoingeckoPriceProvider';
import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';


// https://polygon.io/docs/crypto/get_v3_reference_exchanges - APIs to look at next (stocks and crypto)

let pricingIntervalID: string | number | NodeJS.Timeout | undefined=undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let providerCB: string; // Note: If we decided to have multiple intervals running or alarms then we can add to an array

// Add other providers here
// NOTE: The original api.pro.coinbase.com is now deprecated.
const priceManager = new PriceManager([
  { provider: new CoinbasePriceProvider(), weight: 5 },
  { provider: new CoingeckoPriceProvider(), weight: 3 },
  { provider: new KrakenPriceProvider(), weight: 2 },
  // Add other providers with their weights...
]);

// This file will be going away soon. It is only here for reference. The new code is in the plugins folder.

// TODO: If we want to randomly check prices then we need a more abstract function that randomly chooses from the different exchanges or aggregators
export async function checkPricesCB() {
  try {
    // if (pricingIntervalID) {
      // if (get(yakklConnectionStore) === true) {
        const result = await priceManager.getMarketPrice( 'ETH-USD' );
        if ( result ) {
          yakklPricingStore.set( {
            provider: result.provider,
            id: 'checkPricesCB',
            price: result.price
          } );
        }
      // } else {
      //   console.log('checkPrices:', 'Internet connection may be down.'); // Comment this out later
      // }
    // }
  } catch (e) {
    console.log(`checkPricesCB: ${e}`);    
  }
}

function setCBProvider(provider: string) {
  providerCB = provider;
}

// Use this function instead of -1 in checkPrices
export function stopCheckPrices() {
  if (pricingIntervalID && Number(pricingIntervalID) > 0) {
    clearInterval(pricingIntervalID);
    setCBProvider('');
    pricingIntervalID = undefined;
  } else {
    pricingIntervalID = undefined;
  }
}


export function startCheckPrices(provider = 'coinbase', seconds = 10): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (seconds > 0) {
        if ( pricingIntervalID && Number( pricingIntervalID ) > 0 ) {
          return resolve(); // Already running
        }
        setCBProvider(provider);
        pricingIntervalID = setInterval(checkPricesCB, 1000 * seconds);
        resolve();
      } else {
        // Handle the case where seconds are less than or equal to 0
        if (pricingIntervalID && Number(pricingIntervalID) > 0) {
          clearInterval(pricingIntervalID);
          pricingIntervalID = undefined;
        }
        resolve();
      }
    } catch (e) {
      console.log(`startCheckPrices: ${e}`);
      reject(e);
    }
  });
}


// TODO: Add Provider param with a switch statement to call and default to given providers
export async function getPrices(pairs: [string]) {
  // Add an array of the pricing providers
  // random index for the array
  // switch statement matching the strings in the array
  // default to coinbase
  // transpose results to abstract schema

  let pair: string;

  try {
    // Needs better gaits
    pair = pairs[0];
    if ( get( yakklConnectionStore ) === true ) {
      return await getPricesCoinbase(pair.toUpperCase());
    } else {
      console.log('Internet Connection:', 'May be offline for getPrices method.');
    }
  } catch (e) {
    console.log(`getPrices: ${e}`);
    return [];
  }
}

// export async function getPricesEtherscan(
//   assets: [string],
//   currencies: [string]
// ): Promise<[]> {
//   const coinIds = assets.map((a) => a).join(",")

//   const currencySymbols = currencies
//     .map((c) => c.toLowerCase())
//     .join(",");

//   try {
//     const json = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&include_last_updated_at=true&vs_currencies=${currencySymbols}`);

//     // TBD - May want to look at ajv json validator for future...

//     return json;
//   } catch (e) {
//     console.log(`getPricesEtherscan: ${e}`);
//     return [];
//   }
// }


// TBD - TBD - TBD - Create a promise and take the errors and reject AND/OR make a call to another price provider until retrieved.
//  The returned structure MUST the same so move from vendor specific to abstract before returning
//  Need Binance and a few others and then we can pool and randomly pick and if an error randomly pick again but without the one that just failed


export async function getPricesCoinbase(pair: string) {
  try {
    const json = await fetchJson( `https://api.coinbase.com/api/v3/brokerage/market/products?limit=1&product_ids=${ pair }` ); // TODO: Move to a provider!
    return json;
  } catch (e) {
    console.log(`getPricesCoinbase: ${e}`);
    return [];
  }
}

// export async function getPricesKraken(pair: string) {
//   try {
//     const json = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
//     return json;
//   } catch (e) {
//     console.log(`getPricesKraken: ${e}`);
//     return [];
//   }
// }

// https://api.binance.us/api/v3/ticker/price?symbol=LTCBTC
// https://docs.binance.us/#market-data-endpoints

// export async function getPricesBinanceUS(pair: string) {
//   try {
//     const json = await fetchJson(`https://api.binance.us/api/v3/ticker/price?symbol=${pair.toUpperCase()}`);
//     return json;
//   } catch (e) {
//     console.log(e);
//     return [];
//   }
// }

// export async function getPricesBitfinex(pair: string) {
//   try {
//     const json = await fetchJson(`https://api-pub.bitfinex.com/v2/tickers?symbols=t${pair.toUpperCase().replace('-', '')}`);
//     return json;
//   } catch (e) {
//     console.log(e);
//     return [];
//   }
// }

// // Bitstamp has a number of nice features. This returned data show the percent of change in the last 24 hours
// export async function getPricesBitstamp(pair: string) {
//   try {
//     const json = await fetchJson(`https://www.bitstamp.net/api/v2/ticker/${pair.toUpperCase().replace('-', '')}`);
//     return json;
//   } catch (e) {
//     console.log(e);
//     return [];
//   }
// }


